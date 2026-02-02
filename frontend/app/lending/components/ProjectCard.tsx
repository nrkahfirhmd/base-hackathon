"use client";

import React from "react";
import { motion } from "framer-motion";
import { ProjectItem } from "@/app/hooks/useLending";

interface Props {
  project: ProjectItem;
  onDeposit: (project: ProjectItem) => void;
}

export default function ProjectCard({ project, onDeposit }: Props) {
  // Logic perhitungan lingkaran (radius 18, keliling ~113)
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.min(project.apy, 100) / 100) * circumference;

  return (
    <div className="flex items-center justify-between p-5 mb-3 rounded-2xl bg-gradient-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-lg transition-all hover:border-white/10 group">
      {/* Left Section: Info Protokol */}
      <div className="flex flex-col gap-1">
        <h3 className="text-white font-bold text-sm uppercase tracking-tight">
          {typeof project.protocol === "string"
            ? project.protocol.split("-").join(" ")
            : project.protocol}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
            {typeof project.symbol === "string"
              ? project.symbol.split("-").join(", ")
              : project.symbol}
          </span>
          <span className="text-white/20 text-[10px] hidden sm:block">•</span>
          <span className="text-white/20 text-[10px] font-bold hidden sm:block tracking-tighter">
            TVL ${project.tvl.toLocaleString()}
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
              {Math.floor(project.apy)}%
            </span>
          </div>

          <div className="hidden xs:flex flex-col">
            <span className="text-white font-bold text-xs leading-none">
              {project.apy}%
            </span>
            <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest">
              APY
            </span>
          </div>
        </div>

        {/* Action Button: Design disamakan dengan DepositModal */}
        <button
          onClick={() => onDeposit(project)}
          className="h-[42px] px-6 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-xl shadow-inner"
        >
          <span className="text-white/40 font-bold tracking-[0.2em] text-[10px] uppercase">
            DEPOSIT
          </span>
        </button>
      </div>
    </div>
  );
}
