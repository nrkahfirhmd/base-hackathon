"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Numpad from "@/components/ui/buttons/NumpadButton";
import InputCard from "@/components/ui/cards/InputCard";
import PaymentConfirmationButton from "@/components/ui/buttons/PaymentConfirmationButton";

export default function PaymentPage() {
  const router = useRouter();
  const [amountIdr, setAmountIdr] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<"BTC" | "ETH">("BTC");

  // Logika Konversi dengan pembatasan 2 angka di belakang koma
  const cryptoAmount = useMemo(() => {
    const val = parseFloat(amountIdr) || 0;
    let result = 0;

    if (selectedCoin === "BTC") {
      result = val * 0.00000000065; // Rate contoh
    } else {
      result = val * 0.000000012; // Rate contoh
    }

    // Menggunakan .toFixed(2) untuk membatasi desimal
    return result.toFixed(2);
  }, [amountIdr, selectedCoin]);

  const handleInput = (val: string) => {
    if (val === "." && amountIdr.includes(".")) return;
    if (amountIdr.length >= 12) return;
    setAmountIdr((prev) => prev + val);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-hidden">
      {/* Tombol Back */}
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
        <div className="mb-auto mt-16 w-full">
          {/* Input Card Utama */}
          <InputCard amount={amountIdr} />
        </div>

        {/* Numpad */}
        <div className="mb-8 w-full max-w-sm mx-auto">
          <Numpad
            onInput={handleInput}
            onDelete={() => setAmountIdr((prev) => prev.slice(0, -1))}
          />
        </div>

        {/* Tombol Swipe dengan Teks Instruksi Baru */}
        <div className="w-full max-w-md mx-auto">
          <PaymentConfirmationButton
            currency={selectedCoin}
            amount={cryptoAmount}
            onCurrencyChange={(coin) => setSelectedCoin(coin)}
            onSuccess={() => router.push("/invoice")}
          />
        </div>
      </div>
    </div>
  );
}
