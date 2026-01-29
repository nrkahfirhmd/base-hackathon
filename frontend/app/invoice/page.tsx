"use client";

import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import InvoiceCard from "@/components/ui/cards/InvoiceCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Invoice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(true);

  // 1. Ambil data dari URL Parameter (Data On-Chain)
  const amountOut = searchParams.get("amountOut") || "0";
  const amountIn = searchParams.get("amountIn") || "0";
  const referenceId = searchParams.get("ref") || "UNKNOWN";
  const payer = searchParams.get("from") || "0x000...000";
  const recipient = searchParams.get("to") || "0x000...000";
  const tokenSymbol = searchParams.get("token") || "USDC";

  // 2. Format data untuk ditampilkan di InvoiceCard
  const dynamicInvoice = {
    invoiceNumber: `#${referenceId}`,
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    transferMethod: tokenSymbol,
    // Shorten address untuk tampilan UI yang bersih
    from: `${payer.slice(0, 6)}...${payer.slice(-4)}`,
    to: `${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
    gasFee: "Paid by Network", // Gas fee biasanya sudah terpotong di pengirim
    transferAmount: `${tokenSymbol} ${amountIn}`,
    total: `IDRX ${amountOut}`,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 1500); // Sedikit lebih lama agar animasi sukses terasa

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#1B1E34] text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
            >
              <Image
                src="/success-logo.svg"
                alt="Success"
                width={200}
                height={200}
              />
              <h2 className="text-center mt-4 text-xl font-bold">
                Payment Received!
              </h2>
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex flex-col min-h-screen pt-8 px-6 max-w-2xl mx-auto">
            <div className="pb-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
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

            {/* Main Content */}
            <div className="grow w-full">
              <InvoiceCard
                invoiceNumber={dynamicInvoice.invoiceNumber}
                date={dynamicInvoice.date}
                transferMethod={dynamicInvoice.transferMethod}
                from={dynamicInvoice.from}
                to={dynamicInvoice.to}
                gasFee={dynamicInvoice.gasFee}
                transferAmount={dynamicInvoice.transferAmount}
                total={dynamicInvoice.total}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 w-full pb-8 mt-6">
              <SecondaryButton onClick={() => window.print()}>
                Download Invoice
              </SecondaryButton>
              <PrimaryButton onClick={() => router.push("/dashboard")}>
                Done
              </PrimaryButton>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
