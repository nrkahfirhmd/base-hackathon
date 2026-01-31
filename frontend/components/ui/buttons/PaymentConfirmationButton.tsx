"use client";

import React, { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import { JsonRpcSigner } from "ethers";
import { useInvoice } from "@/app/hooks/useInvoice";

interface PaymentConfirmationButtonProps {
  onSuccess: () => void;
  amount: string;
  recipient: string;
  signer: JsonRpcSigner | undefined;
  invoiceId: string | null;
  currency: "USDC" | "IDRX";
  onCurrencyChange: (coin: "USDC" | "IDRX") => void;
  className?: string;
  disabled?: boolean; // Prop baru untuk validasi koin
}

const PaymentConfirmationButton: React.FC<PaymentConfirmationButtonProps> = ({
  onSuccess,
  amount,
  recipient,
  signer,
  invoiceId,
  currency,
  onCurrencyChange,
  className = "",
  disabled = false, // Default false
}) => {
  const [isComplete, setIsComplete] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { payInvoice, isLoading: isBlockchainLoading } = useInvoice();
  const [isInternalLoading, setIsInternalLoading] = useState(false);

  const isLoading = isInternalLoading || isBlockchainLoading;

  const x = useMotionValue(0);
  const textOpacity = useTransform(x, [0, 140], [1, 0]);

  // --- LOGIKA IKON ---
  const getIconUrl = (symbol: string) => {
    if (symbol.toUpperCase() === "IDRX") {
      return "/IDRX-Logo.png";
    }
    const iconSymbol = symbol.toLowerCase();
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${iconSymbol}.png`;
  };

  const handleDragEnd = async (_: any, info: any) => {
    // JANGAN PROSES jika tombol dalam keadaan disabled (mismatch currency)
    if (disabled) {
      x.set(0);
      return;
    }

    if (Math.abs(info.offset.x) > 5) {
      setIsMenuOpen(false);
    }

    if (info.offset.x > 180 && !isLoading && signer && recipient) {
      setIsInternalLoading(true);

      try {
        if (invoiceId) {
          const result = await payInvoice(invoiceId);

          if (result.success) {
            setIsComplete(true);
            onSuccess();
          } else {
            throw new Error(result.error);
          }
        } else {
          setIsComplete(true);
          onSuccess();
        }
      } catch (err: any) {
        console.error("Payment Failed:", err);
        alert("Pembayaran Gagal: " + err.message);
        x.set(0);
      } finally {
        setIsInternalLoading(false);
      }
    } else {
      x.set(0);
    }
  };

  return (
    <div
      className={`relative w-full max-w-md h-[72px] rounded-2xl p-2 flex items-center shadow-2xl border border-white/10 transition-all duration-300 ${className} 
        ${disabled ? "bg-gray-800 opacity-60 grayscale cursor-not-allowed" : "bg-linear-to-b from-[#281a45] via-[#3b2a6e] to-[#6a3eb7]"} 
        ${isLoading ? "opacity-70 pointer-events-none" : ""}`}
    >
      <motion.div
        style={{ opacity: textOpacity }}
        className="absolute inset-0 flex items-center justify-end pr-10 text-white font-semibold text-lg pointer-events-none tracking-wide"
      >
        {disabled
          ? "Currency Mismatch"
          : isLoading
            ? "Processing..."
            : ""}
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-2 mb-2 w-35 bg-[#281a45]/95 backdrop-blur-2xl rounded-2xl border border-white/10 p-2 shadow-2xl z-50"
          >
            {(["USDC", "IDRX"] as const).map((coin) => (
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
                <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 flex items-center justify-center border border-white/10">
                  <Image
                    src={getIconUrl(coin)}
                    alt={coin}
                    width={24}
                    height={24}
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-white font-bold">{coin}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        drag={isLoading || disabled ? false : "x"} // Matikan drag jika loading atau disabled
        dragConstraints={{ left: 0, right: 230 }}
        dragElastic={0.02}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onTap={() => !isLoading && setIsMenuOpen(!isMenuOpen)}
        animate={isComplete ? { x: 300, opacity: 0 } : {}}
        className={`relative z-10 h-14 pl-4 pr-3 backdrop-blur-xl rounded-2xl flex items-center gap-2 shadow-lg border border-white/20 transition-colors
          ${disabled ? "bg-white/5 cursor-not-allowed" : "bg-white/10 cursor-grab active:cursor-grabbing hover:bg-white/20"}`}
      >
        <div className="w-8 h-8 relative flex items-center justify-center pointer-events-none">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <div
              className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${disabled ? "bg-gray-700" : "bg-gray-800/30"}`}
            >
              <Image
                src={getIconUrl(currency)}
                alt={currency}
                width={32}
                height={32}
                className={`object-cover ${disabled ? "opacity-30" : ""}`}
                unoptimized
              />
            </div>
          )}
        </div>

        <div className="flex flex-col leading-tight pointer-events-none">
          <span
            className={`font-bold text-lg tracking-tight ${disabled ? "text-white/30" : "text-white"}`}
          >
            {amount}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${disabled ? "text-white/20" : "text-white/50"}`}
          >
            {currency}
            {!disabled && (
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
            )}
          </span>
        </div>

        {!disabled && (
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
        )}
      </motion.div>
    </div>
  );
};

export default PaymentConfirmationButton;
