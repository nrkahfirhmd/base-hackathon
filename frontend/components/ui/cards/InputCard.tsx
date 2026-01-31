"use client";

import React from "react";

// Konfigurasi batas per token
const TOKEN_LIMITS = {
  USDC: { min: "0.01", max: "10,000" },
  IDRX: { min: "100", max: "1,000,000" }, // Sesuaikan dengan kebutuhan Anda
};

interface InputCardProps {
  amount: string;
  currency: "USDC" | "IDRX"; // Tambahkan prop currency
  isError?: boolean;
}

const InputCard: React.FC<InputCardProps> = ({ amount, currency, isError }) => {
  const limits = TOKEN_LIMITS[currency];

  return (
    <div
      className="
      bg-linear-to-b from-white/10 from-0% to-[#999999]/3 to-100% 
      backdrop-blur-md 
      rounded-t-[2rem] 
      rounded-b-[1rem] 
      pt-20 
      pb-16 
      px-10 
      flex flex-col items-center 
      w-full max-w-sm mx-auto 
      shadow-[0_4px_4px_0_#996BFA]
      mb-10
      border border-white/10
    "
    >
      {/* Teks Instruksi Dinamis */}
      <p className="text-white text-xl italic font-medium mb-12 opacity-90 text-center">
        Enter Amount in {currency}
      </p>

      <div className="flex flex-col items-center w-full">
        {/* Simbol Koin Dinamis */}
        <h1 className="text-white text-4xl font-bold mb-8 tracking-tight text-center italic">
          {currency} {amount || "0"}
        </h1>

        <div className="w-full h-[1px] bg-white/10 mb-10"></div>

        {/* Batas Dinamis */}
        <p className="text-white/40 text-[13px] font-medium text-center tracking-wide">
          Min {currency} {limits.min} - Max {currency} {limits.max}
        </p>
      </div>
    </div>
  );
};

export default InputCard;
