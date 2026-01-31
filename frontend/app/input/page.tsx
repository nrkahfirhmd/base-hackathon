"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useEthersSigner } from "@/app/hooks/useEthers";
import ShowQrConfirmationButton from "@/components/ui/buttons/ShowQrConfirmationButton";
import Numpad from "@/components/ui/buttons/NumpadButton";
import InputCard from "@/components/ui/cards/InputCard";

// KONFIGURASI LIMIT
const TOKEN_LIMITS = {
  USDC: { min: 0.01, max: 10000 },
  IDRX: { min: 100, max: 1000000 },
};

export default function Input() {
  const router = useRouter();
  const { address } = useAccount();
  const signer = useEthersSigner();

  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<"USDC" | "IDRX">(
    "USDC",
  );

  const handleInput = (val: string) => {
    if (val === "." && amount.includes(".")) return;
    if (amount.length >= 12) return;
    setAmount((prev) => prev + val);
  };

  const handleDelete = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  // LOGIKA VALIDASI
  const currentAmount = parseFloat(amount) || 0;
  const limits = TOKEN_LIMITS[selectedCurrency];
  const isValidAmount =
    currentAmount >= limits.min && currentAmount <= limits.max;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-hidden">
      <div className="absolute top-8 left-6 z-50">
        <button
          onClick={() => router.push("/")}
          className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-lg transition-colors text-white shadow-lg"
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
        <div className="mt-16 w-full">
          {/* Card akan menampilkan error warna merah jika diluar batas */}
          <InputCard
            amount={amount}
            currency={selectedCurrency}
            isError={amount.length > 0 && !isValidAmount}
          />
        </div>

        <div className="mb-6 w-full max-w-sm mx-auto">
          <Numpad onInput={handleInput} onDelete={handleDelete} />
        </div>

        <div className="w-full max-w-md mx-auto">
          <ShowQrConfirmationButton
            amount={amount || "0"}
            merchant={address}
            signer={signer}
            currency={selectedCurrency}
            onCurrencyChange={(coin) => {
              setSelectedCurrency(coin);
            }}
            // KIRIM STATUS VALIDASI KE TOMBOL
            disabled={amount.length === 0 || !isValidAmount}
            onSuccess={(invoiceId) => {
              router.push(
                `/showqr?invoiceId=${invoiceId}&amount=${amount}&currency=${selectedCurrency}`,
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
