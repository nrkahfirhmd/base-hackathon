"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useConfig } from "wagmi";
import { parseUnits, parseAbi } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { X } from "lucide-react";
import {
  USDC,
  IDRX,
  ERC20_ABI,
  DECIMALS,
  LENDING_POOL_MUSDC,
  LENDING_POOL_MIDRX,
  LENDING_POOL_ABI,
} from "@/app/constant/smartContract";

export default function DepositModal({
  open,
  onClose,
  project,
  onDeposited,
  onConfirmDeposit,
}: any) {
  const [amount, setAmount] = useState("1");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const config = useConfig();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [tokenName, setTokenName] = useState("USDC");

  useEffect(() => {
    if (project) {
      const sym = project.symbol || project.token || "USDC";
      setTokenName(sym.split("-")[0].toUpperCase());
    }
  }, [project]);

  if (!open || !project) return null;

  const getLendingPoolAddress = (token: string): `0x${string}` => {
    const normalizedToken = token.toUpperCase();
    if (normalizedToken === "USDC" || normalizedToken === "MUSDC") {
      return LENDING_POOL_MUSDC as `0x${string}`;
    }
    if (normalizedToken === "IDRX" || normalizedToken === "MIDRX") {
      return LENDING_POOL_MIDRX as `0x${string}`;
    }
    return LENDING_POOL_MUSDC as `0x${string}`;
  };

  const handleConfirm = async () => {
    setErrorMsg(null);
    if (!acceptTerms) return setErrorMsg("Harap setujui risiko.");
    if (!address) return setErrorMsg("Wallet tidak terhubung.");

    setIsLoading(true);
    try {
      const tokenAddress = tokenName === "IDRX" ? IDRX : USDC;
      const lendingPoolAddress = getLendingPoolAddress(tokenName);

      if (
        !lendingPoolAddress ||
        lendingPoolAddress === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error(`Lending pool untuk ${tokenName} belum dikonfigurasi.`);
      }

      setStatusText("Approve...");
      const approveHash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: parseAbi(ERC20_ABI),
        functionName: "approve",
        args: [lendingPoolAddress, parseUnits(amount, DECIMALS)],
      });

      await waitForTransactionReceipt(config, {
        hash: approveHash,
        confirmations: 1,
      });

      setStatusText("Depositing...");
      const depositHash = await writeContractAsync({
        address: lendingPoolAddress,
        abi: parseAbi(LENDING_POOL_ABI),
        functionName: "deposit",
        args: [parseUnits(amount, DECIMALS), address],
      });

      await waitForTransactionReceipt(config, {
        hash: depositHash,
        confirmations: 1,
      });

      let mappedToken = tokenName.toLowerCase();
      if (mappedToken === "usdc") mappedToken = "mUSDC";
      if (mappedToken === "idrx") mappedToken = "mIDRX";

      setStatusText("Recording...");
      const res = await onConfirmDeposit({
        protocol: project.protocol,
        token: mappedToken,
        amount: Number(amount),
        wallet_address: address,
        tx_hash: depositHash,
      });

      if (res && (res.status === "success" || res.tx_hash)) {
        setResult(res);
        onDeposited?.(res);
      } else {
        setResult({ status: "success", tx_hash: depositHash });
        onDeposited?.({ tx_hash: depositHash, status: "success" });
      }
    } catch (err: any) {
      console.error("Error Detail:", err);
      setErrorMsg(err.shortMessage || err.message || "Transaksi gagal.");
    } finally {
      setIsLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F1222] border border-white/10 p-8 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter text-center">
          Confirm Deposit
        </h3>

        <div className="space-y-6">
          {/* --- INPUT AMOUNT (TENGAH & NO SPINNERS) --- */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center gap-2">
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              Enter Amount
            </span>
            <div className="flex flex-col items-center w-full">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                // Menambahkan [appearance:textfield] dan selector untuk webkit agar spinner hilang
                className="bg-transparent text-5xl font-black text-white outline-none w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
                onWheel={(e) => (e.target as HTMLInputElement).blur()} // Mencegah scroll mengganti angka
              />
              <span className="text-xs font-bold text-white/40 mt-2 tracking-widest uppercase italic">
                {tokenName}
              </span>
            </div>
          </div>

          {/* Terms Checklist */}
          <label className="flex items-start gap-3 px-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 accent-indigo-500 w-4 h-4"
            />
            <span className="text-[11px] text-white/40 leading-relaxed group-hover:text-white/60 transition-colors text-center px-2">
              I agree to grant token access and deposit funds into the{" "}
              {project.protocol} lending pool.
            </span>
          </label>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] text-center leading-tight">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs text-center font-bold uppercase tracking-widest">
              Success
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={result ? onClose : handleConfirm}
              disabled={isLoading}
              className="h-[52px] w-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-2xl disabled:opacity-50 shadow-lg"
            >
              <span className="text-white/40 font-bold tracking-[0.2em] text-xs uppercase">
                {isLoading ? statusText : result ? "CLOSE" : "CONFIRM DEPOSIT"}
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
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
