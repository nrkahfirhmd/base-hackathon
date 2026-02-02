"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useConfig } from "wagmi";
import { parseUnits, parseAbi, isAddress } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
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

  // Get the lending pool address based on token
  const getLendingPoolAddress = (token: string): `0x${string}` => {
    const normalizedToken = token.toUpperCase();
    if (normalizedToken === "USDC" || normalizedToken === "MUSDC") {
      return LENDING_POOL_MUSDC as `0x${string}`;
    }
    if (normalizedToken === "IDRX" || normalizedToken === "MIDRX") {
      return LENDING_POOL_MIDRX as `0x${string}`;
    }
    // Default to USDC pool
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
      
      // Validate pool address
      if (!lendingPoolAddress || lendingPoolAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`Lending pool untuk ${tokenName} belum dikonfigurasi. Silakan hubungi admin.`);
      }

      // 1. APPROVE (On-Chain) - Approve to Lending Pool
      setStatusText("Approve Token...");
      const approveHash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: parseAbi(ERC20_ABI),
        functionName: "approve",
        args: [lendingPoolAddress, parseUnits(amount, DECIMALS)],
      });

      // 2. WAIT FOR APPROVE CONFIRMATION
      setStatusText("Confirming Approve...");
      await waitForTransactionReceipt(config, { hash: approveHash, confirmations: 1 });

      // 3. DEPOSIT TO LENDING POOL (On-Chain via User Wallet)
      setStatusText("Depositing...");
      const depositHash = await writeContractAsync({
        address: lendingPoolAddress,
        abi: parseAbi(LENDING_POOL_ABI),
        functionName: "deposit",
        args: [parseUnits(amount, DECIMALS), address],
      });

      // 4. WAIT FOR DEPOSIT CONFIRMATION
      setStatusText("Confirming Deposit...");
      await waitForTransactionReceipt(config, { hash: depositHash, confirmations: 1 });

      // 5. MAPPING TOKEN & CALL BACKEND TO RECORD DATA ONLY
      let mappedToken = tokenName.toLowerCase();
      if (mappedToken === "usdc") mappedToken = "mUSDC";
      if (mappedToken === "idrx") mappedToken = "mIDRX";

      setStatusText("Recording Data...");
      const res = await onConfirmDeposit({
        protocol: project.protocol,
        token: mappedToken,
        amount: Number(amount),
        wallet_address: address,
        tx_hash: depositHash, // Send tx_hash to backend for record only
      });

      if (res && (res.status === "success" || res.tx_hash)) {
        setResult(res);
        onDeposited?.(res);
      } else {
        // Even if backend fails, the deposit was successful on-chain
        console.warn("Backend recording failed, but on-chain deposit succeeded:", depositHash);
        setResult({
          status: "success",
          tx_hash: depositHash,
          message: "Deposit berhasil! (Data belum tercatat di server)"
        });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-[#0F1222] border border-white/10 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold text-white mb-1">
          Konfirmasi Deposit
        </h3>
        <p className="text-sm text-white/50 mb-6">{project.protocol}</p>

        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-center">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-xl text-white outline-none w-full"
            />
            <span className="text-white font-bold ml-2">{tokenName}</span>
          </div>

          <label className="flex items-start gap-3 p-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1"
            />
            <span className="text-xs text-white/60">
              Setujui izin akses token dan deposit langsung ke lending pool.
            </span>
          </label>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-[10px] break-all">
              {errorMsg}
            </div>
          )}
          {result && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-xs text-center">
              Deposit Berhasil! TX: {result.tx_hash?.slice(0, 10)}...
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <SecondaryButton onClick={onClose} className="flex-1">
              Batal
            </SecondaryButton>
            <PrimaryButton
              onClick={result ? onClose : handleConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-[10px] uppercase font-bold">
                    {statusText}
                  </span>
                </div>
              ) : result ? (
                "Tutup"
              ) : (
                "Deposit Sekarang"
              )}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
