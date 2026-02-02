"use client";

import React from "react";
import { motion } from "framer-motion";

interface Props {
  position: any;
  onWithdraw: (position: any) => void;
}

export default function PortfolioCard({ position, onWithdraw }: Props) {
  // Parsing data
  const parsed = typeof position === "string" ? JSON.parse(position) : position;

  // PERBAIKAN: Menambahkan 'amount_deposited' ke dalam pengecekan
  const apy = parsed.apy || 0;
  const amount =
    parsed.amount_deposited || parsed.principal || parsed.amount || 0;

  // Logic Chart Lingkaran
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.min(apy, 100) / 100) * circumference;

  return (
    <div className="flex items-center justify-between p-5 mb-3 rounded-2xl bg-gradient-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-lg transition-all hover:border-white/10 group">
      {/* Left Section: Info Protokol & Amount */}
      <div className="flex flex-col gap-1">
        <h3 className="text-white font-bold text-sm uppercase tracking-tight">
          {parsed.token || parsed.symbol} {parsed.protocol}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
            DEPOSIT: {amount}
          </span>
        </div>
      </div>

      {/* Right Section: APY Chart & Button */}
      <div className="flex items-center gap-6">
        {/* Mini Circular APY Chart */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="20"
                cy="20"
                r={radius}
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - progress }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-[#4ade80]"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[8px] font-black text-white">
              {Math.floor(apy)}%
            </span>
          </div>

          <div className="hidden xs:flex flex-col">
            <span className="text-white font-bold text-xs leading-none">
              {apy}%
            </span>
            <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest">
              APY
            </span>
          </div>
        </div>

        {/* Withdraw Button */}
        <button
          onClick={() => onWithdraw(parsed)}
          className="h-[42px] w-[120px] flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-xl shadow-inner"
        >
          <span className="text-white/40 font-bold tracking-[0.2em] text-[10px] uppercase">
            WITHDRAW
          </span>
        </button>
      </div>
    </div>
  );
}
