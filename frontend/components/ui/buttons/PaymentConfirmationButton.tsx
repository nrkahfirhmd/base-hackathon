"use client";

import React, { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";

interface PaymentConfirmationButtonProps {
  onSuccess: () => void;
  amount: string;
  currency: "BTC" | "ETH";
  onCurrencyChange: (coin: "BTC" | "ETH") => void;
  className?: string;
}

const PaymentConfirmationButton: React.FC<PaymentConfirmationButtonProps> = ({
  onSuccess,
  amount,
  currency,
  onCurrencyChange,
  className = "",
}) => {
  const [isComplete, setIsComplete] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const x = useMotionValue(0);

  // Opacity teks akan menghilang saat pill digeser mendekati area kanan
  const textOpacity = useTransform(x, [0, 140], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 5) {
      setIsMenuOpen(false);
    }

    if (info.offset.x > 180) {
      setIsComplete(true);
      onSuccess();
    } else {
      x.set(0);
    }
  };

  return (
    <div
      className={`relative w-full max-w-md h-[72px] rounded-2xl 
        bg-linear-to-b from-[#281a45] via-[#3b2a6e] to-[#6a3eb7]
        p-2 flex items-center shadow-2xl border border-white/10 ${className}`}
    >
    
      <motion.div
        style={{ opacity: textOpacity }}
        className="absolute inset-0 flex items-center justify-end pr-10 text-white font-semibold text-lg pointer-events-none tracking-wide"
      >
        Swipe to Confirm
      </motion.div>


      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-2 mb-2 w-35 bg-[#281a45]/95 backdrop-blur-2xl rounded-2xl border border-white/10 p-2 shadow-2xl z-50"
          >
            {(["BTC", "ETH"] as const).map((coin) => (
              <button
                key={coin}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCurrencyChange(coin);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-colors ${
                  currency === coin ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <Image
                  src={`/${coin.toLowerCase()}.svg`}
                  alt={coin}
                  width={24}
                  height={24}
                />
                <span className="text-white font-bold">{coin}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Handle Geser */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 230 }}
        dragElastic={0.02}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onTap={() => setIsMenuOpen(!isMenuOpen)}
        animate={isComplete ? { x: 300, opacity: 0 } : {}}
        /* Hapus transition-all jika masih terasa berat saat digeser */
        className="relative z-10 h-14 pl-4 pr-3 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center gap-2 cursor-grab active:cursor-grabbing shadow-lg border border-white/20 hover:bg-white/20 transition-colors"
      >
        {/* Ikon Koin */}
        <div className="w-8 h-8 relative flex items-center justify-center pointer-events-none">
          <Image
            src={`/${currency.toLowerCase()}.svg`}
            alt={currency}
            width={32}
            height={32}
          />
        </div>

        {/* Informasi Nominal */}
        <div className="flex flex-col leading-tight pointer-events-none">
          <span className="text-white font-bold text-lg tracking-tight">
            {amount}
          </span>
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            {currency}
            <svg
              className={`w-2 h-2 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </span>
        </div>

        {/* 4. Ikon Panah */}
        <div className="ml-1 text-white/80 pointer-events-none flex items-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentConfirmationButton;