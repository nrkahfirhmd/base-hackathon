"use client";

import React, { useState } from "react";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import { WithdrawResponse } from "@/app/hooks/useLending";

interface Props {
  open: boolean;
  onClose: () => void;
  positionId?: number | null;
  onConfirmWithdraw: (payload: {
    id: number;
    token: string;
    amount: number;
  }) => Promise<WithdrawResponse | null>;
}

export default function WithdrawModal({
  open,
  onClose,
  positionId,
  onConfirmWithdraw,
}: Props) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WithdrawResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open || !positionId) return null;

  const isValidAmount = (v: string) => {
    const n = Number(v);
    return !isNaN(n) && n > 0;
  };

  const handleConfirm = async () => {
    setErrorMsg(null);

    if (!isValidAmount(amount)) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await onConfirmWithdraw({
        id: positionId,
        token: "eth",
        amount: Number(amount),
      });
      setResult(res);

      if (!res || res.status !== "success") {
        setErrorMsg(res?.message || "Withdraw failed.");
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
          <h3 className="text-xl font-bold text-white">Withdraw</h3>
          <p className="text-sm text-white/60 mt-1">
            Withdraw funds from your position
          </p>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-sm text-white/70 mb-2 block">
            Amount
          </label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

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
            {isLoading ? "Processing..." : "Confirm Withdraw"}
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
