"use client";

import React, { useState } from "react";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import { WithdrawResponse } from "@/app/hooks/useLending";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/app/providers";
import { 
  LENDING_POOL_ABI, 
  LENDING_POOL_MUSDC, 
  LENDING_POOL_MIDRX 
} from "@/app/constant/smartContract";

const DECIMALS = 6;

interface Props {
  open: boolean;
  onClose: () => void;
  positionId?: number | null;
  tokenSymbol?: string; // mUSDC, mIDRX, etc.
  currentAmount?: number; // Current deposited amount for validation
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

  // Determine lending pool address based on token
  const getLendingPoolAddress = () => {
    const token = tokenSymbol.toLowerCase();
    if (token.includes("usdc")) {
      return LENDING_POOL_MUSDC as `0x${string}`;
    } else if (token.includes("idrx")) {
      return LENDING_POOL_MIDRX as `0x${string}`;
    }
    // Default to USDC pool
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
    if (withdrawAmount > currentAmount) {
      setErrorMsg(`Amount exceeds your balance (${currentAmount})`);
      return;
    }

    setIsLoading(true);

    try {
      const lendingPoolAddress = getLendingPoolAddress();

      // 1. WITHDRAW FROM LENDING POOL (On-Chain via User Wallet)
      setStatusText("Withdrawing from Pool...");
      const withdrawHash = await writeContractAsync({
        address: lendingPoolAddress,
        abi: parseAbi(LENDING_POOL_ABI),
        functionName: "withdraw",
        args: [parseUnits(amount, DECIMALS), address],
      });

      // 2. WAIT FOR WITHDRAW CONFIRMATION
      setStatusText("Confirming Withdraw...");
      await waitForTransactionReceipt(config, { 
        hash: withdrawHash, 
        confirmations: 1 
      });

      // 3. CALL BACKEND TO UPDATE DATABASE RECORD
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
        setStatusText("Withdraw Complete!");
      }
    } catch (err: any) {
      console.error("Withdraw error:", err);
      if (err?.message?.includes("User rejected")) {
        setErrorMsg("Transaction rejected by user.");
      } else if (err?.message?.includes("insufficient")) {
        setErrorMsg("Insufficient LP token balance.");
      } else {
        setErrorMsg(err?.shortMessage || err?.message || "Unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#0F1222] border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in">
        {/* Header */}
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">Withdraw</h3>
          <p className="text-sm text-white/60 mt-1">
            Withdraw funds from your position
          </p>
        </div>

        {/* Balance Info */}
        {currentAmount > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-white/5 flex justify-between items-center">
            <span className="text-sm text-white/70">Available Balance:</span>
            <span className="text-sm font-semibold text-white">
              {currentAmount.toFixed(2)} {tokenSymbol}
            </span>
          </div>
        )}

        {/* Amount */}
        <div className="mb-4">
          <label className="text-sm text-white/70 mb-2 block">
            Amount
          </label>
          <div className="relative">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-xl bg-white/5 px-4 py-3 pr-16 text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleMax}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-purple-400 hover:text-purple-300"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Status */}
        {isLoading && statusText && (
          <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2 text-sm text-blue-300 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {statusText}
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <SecondaryButton onClick={onClose} className="flex-1">
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleConfirm}
            disabled={isLoading || !address}
            className="flex-1"
          >
            {isLoading ? "Processing..." : "Confirm Withdraw"}
          </PrimaryButton>
        </div>

        {/* Result */}
        {result && result.status === "success" && (
          <div className="mt-5 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-white">
            <div className="font-semibold text-green-400 mb-1">✓ Withdraw Successful!</div>
            {result.tx_hash && (
              <div className="break-all text-xs text-white/60 mt-1">
                Tx: {result.tx_hash}
              </div>
            )}
            {result.explorer_url && (
              <a 
                href={result.explorer_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-1 block"
              >
                View on Explorer →
              </a>
            )}
            {result.message && (
              <div className="text-xs text-white/70 mt-1">
                {result.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
