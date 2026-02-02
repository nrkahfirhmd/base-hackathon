"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { RecommendResponse } from "@/app/hooks/useLending";

interface Props {
  rec: RecommendResponse | null;
  onDeposit: (project: any) => void;
}

export default function RecommendationResult({ rec, onDeposit }: Props) {
  return (
    <AnimatePresence mode="wait">
      {rec && (
        <motion.div
          key="recommendation-result"
          // Muncul dari koordinat negatif agar seolah di bawah card sebelumnya
          initial={{ height: 0, opacity: 0, y: -100 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -100 }}
          transition={{ duration: 0.7, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="overflow-hidden relative z-10 -mt-4" // z-10 agar di bawah z-20 (Parent Card)
        >
          {/* Background Gradient: Opacity 20% di atas ke 80% di bawah */}
          <div className=" rounded-b-2xl bg-gradient-to-b from-[#2b2b3d]/20 to-[#1a1a24]/80 border border-gray-800 p-8 shadow-2xl flex flex-col items-center mb-6 backdrop-blur-sm ">
            {/* Protocol & Token Name */}
            <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">
              {rec.protocol}
            </h3>
            <p className="text-lg font-bold text-white/70 mb-8 uppercase tracking-widest">
              {rec.token}
            </p>

            {/* Circular Progress APY */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="75"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="88"
                  cy="88"
                  r="75"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="471"
                  initial={{ strokeDashoffset: 471 }}
                  animate={{
                    strokeDashoffset:
                      471 - 471 * (Math.min(rec.apy, 100) / 100),
                  }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  className="text-[#4ade80]"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">
                  TVL{" "}
                  {rec.tvl ? `$${Number(rec.tvl).toLocaleString()}` : "$53M"}
                </span>
                <span className="text-2xl font-black text-white leading-none">
                  {rec.apy}%
                </span>
                <span className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                  APY
                </span>
              </div>
            </div>

            {/* DEPOSIT BUTTON */}
            <button
              onClick={() =>
                onDeposit({
                  protocol: rec.protocol,
                  apy: rec.apy,
                  tvl: rec.tvl || 0,
                  symbol: rec.token,
                  pool_id: "recommend",
                })
              }
              className="h-[42px] w-full max-w-[140px] flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all px-8 rounded-xl mb-10"
            >
              <span className="text-white/40 font-bold tracking-[0.2em] text-xs uppercase">
                DEPOSIT
              </span>
            </button>

            {/* Reason Description */}
            <div className="w-full text-center px-2">
              <p className="text-sm text-white/40 leading-relaxed font-medium">
                {rec.reason}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
