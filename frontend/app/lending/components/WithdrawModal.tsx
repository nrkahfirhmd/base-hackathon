"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/app/providers";
import { X } from "lucide-react"; // Import icon X
import { WithdrawResponse } from "@/app/hooks/useLending";
import {
  LENDING_POOL_ABI,
  LENDING_POOL_MUSDC,
  LENDING_POOL_MIDRX,
} from "@/app/constant/smartContract";

const DECIMALS = 6;

interface Props {
  open: boolean;
  onClose: () => void;
  positionId?: number | null;
  tokenSymbol?: string;
  currentAmount?: number;
  onConfirmWithdraw: (payload: {
    id: number;
    token: string;
    amount: number;
    tx_hash?: string;
    wallet_address?: string;
  }) => Promise<WithdrawResponse | null>;
}

export default function WithdrawModal({
  open,
  onClose,
  positionId,
  tokenSymbol = "mUSDC",
  currentAmount = 0,
  onConfirmWithdraw,
}: Props) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WithdrawResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");

  if (!open || !positionId) return null;

  const isValidAmount = (v: string) => {
    const n = Number(v);
    return !isNaN(n) && n > 0;
  };

  const getLendingPoolAddress = () => {
    const token = tokenSymbol.toLowerCase();
    if (token.includes("usdc")) {
      return LENDING_POOL_MUSDC as `0x${string}`;
    } else if (token.includes("idrx")) {
      return LENDING_POOL_MIDRX as `0x${string}`;
    }
    return LENDING_POOL_MUSDC as `0x${string}`;
  };

  const handleMax = () => {
    if (currentAmount > 0) {
      setAmount(currentAmount.toString());
    }
  };

  const handleConfirm = async () => {
    setErrorMsg(null);
    setResult(null);

    if (!address) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    if (!isValidAmount(amount)) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    const withdrawAmount = Number(amount);
    const EPS = 1e-9;
    const amountForApi =
      withdrawAmount >= currentAmount - EPS ? -1 : withdrawAmount;
    if (withdrawAmount > currentAmount) {
      setErrorMsg(`Amount exceeds your balance (${currentAmount})`);
      return;
    }

    setIsLoading(true);

    try {
      const lendingPoolAddress = getLendingPoolAddress();

      // 1. WITHDRAW FROM LENDING POOL
      setStatusText("Withdrawing...");
      const withdrawHash = await writeContractAsync({
        address: lendingPoolAddress,
        abi: parseAbi(LENDING_POOL_ABI),
        functionName: "withdraw",
        args: [parseUnits(amount, DECIMALS), address],
      });

      // 2. WAIT CONFIRMATION
      await waitForTransactionReceipt(config, {
        hash: withdrawHash,
        confirmations: 1,
      });

      // 3. UPDATE BACKEND
      setStatusText("Updating Records...");
      const res = await onConfirmWithdraw({
        id: positionId,
        token: tokenSymbol,
        amount: withdrawAmount,
        tx_hash: withdrawHash,
        wallet_address: address,
      });

      setResult(res);

      if (!res || res.status !== "success") {
        setErrorMsg(res?.message || "Failed to update records.");
      } else {
        setStatusText("Complete!");
      }
    } catch (err: any) {
      console.error("Withdraw error:", err);
      if (err?.message?.includes("User rejected")) {
        setErrorMsg("Transaction rejected by user.");
      } else if (err?.message?.includes("insufficient")) {
        setErrorMsg("Insufficient LP token balance.");
      } else {
        setErrorMsg(
          err?.shortMessage || err?.message || "Unexpected error occurred.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F1222] border border-white/10 p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter text-center">
          Withdraw Funds
        </h3>

        <div className="space-y-6">
          {/* Input Amount Section */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center gap-2 relative">
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              Enter Amount
            </span>

            <div className="flex flex-col items-center w-full">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="bg-transparent text-5xl font-black text-white outline-none w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-white/20"
              />

              {/* Token Name & Max Button */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-white/40 tracking-widest uppercase italic">
                  {tokenSymbol}
                </span>
                <button
                  onClick={handleMax}
                  className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-bold hover:bg-indigo-500/40 transition-colors"
                >
                  MAX
                </button>
              </div>

              {/* Balance Indicator */}
              <span className="text-[10px] text-white/30 mt-1">
                Available: {currentAmount}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] text-center leading-tight">
              {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {result && result.status === "success" && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs text-center font-bold uppercase">
              Withdraw Successful!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={result ? onClose : handleConfirm}
              disabled={isLoading || !address}
              className="h-[52px] w-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-2xl disabled:opacity-50 shadow-lg"
            >
              <span className="text-white/40 font-bold tracking-[0.2em] text-xs uppercase">
                {isLoading ? statusText : result ? "CLOSE" : "CONFIRM WITHDRAW"}
              </span>
              {isLoading && (
                <div className="ml-3 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
            </button>

            {!result && !isLoading && (
              <button
                onClick={onClose}
                className="text-[10px] text-white/20 font-bold uppercase tracking-widest hover:text-white transition-colors py-2"
              >
                Cancel Transaction
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
