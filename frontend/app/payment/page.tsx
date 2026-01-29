"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEthersSigner } from "@/app/hooks/useEthers"; // Pastikan path benar
import { CHAIN_ID } from "../constant/smartContract";
import Numpad from "@/components/ui/buttons/NumpadButton";
import InputCard from "@/components/ui/cards/InputCard";
import PaymentConfirmationButton from "@/components/ui/buttons/PaymentConfirmationButton";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signer = useEthersSigner({ chainId: CHAIN_ID }); // Ambil signer

  const qrAmount = searchParams.get("amount") || "";
  const merchantAddress = searchParams.get("recipient") || "";

  const [amountIdr, setAmountIdr] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<"BTC" | "ETH">("BTC");

  useEffect(() => {
    if (qrAmount) setAmountIdr(qrAmount);
  }, [qrAmount]);

  // Hitung jumlah USDC yang harus dibayar berdasarkan IDR
  // Rumus: USDC = IDR / 15000 (sesuai rate di smartContract.ts)
  const usdcAmount = useMemo(() => {
    const val = parseFloat(amountIdr) || 0;
    return (val / 15000).toFixed(6); 
  }, [amountIdr]);

  const handleInput = (val: string) => {
    if (val === "." && amountIdr.includes(".")) return;
    if (amountIdr.length >= 12) return;
    setAmountIdr((prev) => prev + val);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-hidden">
      {/* ... Tomb  ol Back tetap sama ... */}
      <div className="absolute top-8 left-6 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 bg-black/20 backdrop-blur-md rounded-lg text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-end p-6 pb-12">
        <div className="mb-auto mt-16 w-full text-center">
          {merchantAddress && (
            <p className="text-blue-400 text-[10px] mb-2 font-mono opacity-70">
              Recipient: {merchantAddress.slice(0, 6)}...
              {merchantAddress.slice(-4)}
            </p>
          )}
          <InputCard amount={amountIdr} />
        </div>

        <div className="mb-8 w-full max-w-sm mx-auto">
          <Numpad
            onInput={handleInput}
            onDelete={() => setAmountIdr((p) => p.slice(0, -1))}
          />
        </div>

        <div className="w-full max-w-md mx-auto">
          <PaymentConfirmationButton
            currency={selectedCoin}
            amount={usdcAmount} // Kirim nominal USDC ke blockchain
            recipient={merchantAddress}
            onCurrencyChange={(coin) => setSelectedCoin(coin)}
            signer={signer} // Berikan kunci transaksi
            onSuccess={() => router.push("/invoice")}
          />
        </div>
      </div>
    </div>
  );
}