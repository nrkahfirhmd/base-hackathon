"use client";

import React, { useState, useEffect } from "react";
import { ProjectItem, DepositResponse } from "@/app/hooks/useLending";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import { useAccount } from "wagmi";

interface Props {
  open: boolean;
  onClose: () => void;
  project: ProjectItem | null;
  onDeposited?: (res: DepositResponse | null) => void;
  defaultAmount?: number;
  onConfirmDeposit: (payload: {
    protocol: string;
    token: string;
    amount: number;
    wallet_address: string;
  }) => Promise<DepositResponse | null>;
}

export default function DepositModal({
  open,
  onClose,
  project,
  onDeposited,
  defaultAmount = 1,
  onConfirmDeposit,
}: Props) {
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DepositResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [token, setToken] = useState<string>("USDC");
  const { address } = useAccount();

  useEffect(() => {
    if (project) {
      setToken(
        ((project as any).tokens ?? [project.symbol.split("-")[0]])[0]
      );
    }
  }, [project]);

  if (!open || !project) return null;

  const validateAmount = (v: string) => {
    const n = Number(v);
    return !isNaN(n) && n > 0;
  };

  const handleConfirm = async () => {
    setErrorMsg(null);

    if (!acceptTerms) {
      setErrorMsg("Please accept the terms before continuing.");
      return;
    }

    if (!validateAmount(amount)) {
      setErrorMsg("Amount must be greater than 0.");
      return;
    }

    setIsLoading(true);

    // Map user-facing token to backend token identifiers (case-insensitive)
    const tokenMap: Record<string, string> = {
      idrx: "mIDRX",
      eth: "wETH",
      usdc: "mUSDC",
    };
    const mappedToken = tokenMap[token.toLowerCase()] ?? token;

    try {
      const res = await onConfirmDeposit({
        protocol: project.protocol,
        token: mappedToken,
        amount: Number(amount),
        wallet_address: address || "",
      });

      setResult(res);
      onDeposited?.(res);

      if (!res || res.status !== "success") {
        setErrorMsg(res?.message || "Deposit failed.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Unexpected error occurred.");
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
          <h3 className="text-xl font-bold text-white">Deposit</h3>
          <p className="text-sm text-white/60 mt-1">
            {project.symbol} · {project.protocol}
          </p>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-sm text-white/70 mb-2 block">Amount</label>

          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
            />

            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="rounded-xl bg-white/5 px-3 py-3 text-white outline-none"
            >
              {((project as any).tokens ??
                [project.symbol.split("-")[0], "USDC", "IDRX"]
              ).map((t: string) => {
                const display = /^[wm]/i.test(t) && t.length > 1 ? t.slice(1) : t;
                return (
                  <option key={t} value={t} className="bg-[#252A42] text-white">
                    {display.toUpperCase()}
                  </option>
                );
              })}
            </select>
          </div>

          <p className="text-xs text-white/50 mt-2">
            Make sure your wallet balance is sufficient.
          </p>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 text-sm text-white/80 mb-4">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            I understand the risks associated with decentralized lending.
          </span>
        </label>

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
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Processing..." : "Confirm"}
          </PrimaryButton>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-5 rounded-lg bg-white/5 p-3 text-sm text-white">
            <div>Status: {result.status}</div>
            {result.tx_hash && (
              <div className="break-all text-xs text-white/60 mt-1">
                Tx: {result.tx_hash}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
