"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InputConfimationButton from "@/components/ui/buttons/InputConfimationButton";
import Numpad from "@/components/ui/buttons/NumpadButton";
import InputCard from "@/components/ui/cards/InputCard";

export default function Input() {
  const router = useRouter();
  const [amount, setAmount] = useState("");

  const handleInput = (val: string) => {
    if (val === "." && amount.includes(".")) return;

    // Limit input 12 digit agar tidak overflow dari kartu
    if (amount.length >= 12) return;

    setAmount((prev) => prev + val);
  };

  const handleDelete = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-hidden">
      {/* 1. Tombol Back */}
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

      {/* 2. Area Konten Utama */}
      <div className="flex-1 flex flex-col justify-end p-6 pb-12">
        {/* Input Card*/}
        <div className=" mt-16 w-full">
          <InputCard amount={amount} />
        </div>

        {/* 3. Numpad  */}
        <div className="mb-6 w-full max-w-sm mx-auto">
          <Numpad onInput={handleInput} onDelete={handleDelete} />
        </div>

        {/* 4. Tombol Swipe  */}
        <div className="w-full max-w-md mx-auto">
          <InputConfimationButton
            onSuccess={() => {
              // Kirim amount ke URL, misal: /showqr?amount=10
              router.push(`/showqr?amount=${amount}`);
            }}
            text="Swipe to Show QR Code"
          />
        </div>
      </div>
    </div>
  );
}
