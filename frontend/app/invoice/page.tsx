"use client";

import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import InvoiceCard from "@/components/ui/cards/InvoiceCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAddHistory } from '@/app/hooks/useTransactionHistory';

export default function Invoice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(true);
  const { addHistory, isAdding, error } = useAddHistory();

  // 1. AMBIL DATA DINAMIS DARI URL
  const invId = searchParams.get("invoiceId") || "N/A";
  const amount = searchParams.get("idr") || "0";
  const currency = searchParams.get("coin") || "USDC";
  const recipient = searchParams.get("to") || "0x000...000";
  const sender = searchParams.get("from") || "Customer Wallet"; // Bisa dikirim dari payer side
  const txHash = searchParams.get('tx') || searchParams.get('txHash') || '';

  // 2. FORMATA ALAMAT AGAR TIDAK TERLALU PANJANG
  const formatAddr = (addr: string) =>
    addr.length > 15 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const invoiceData = {
    invoiceNumber: `#${invId}`,
    date: new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    transferMethod: currency, // Menampilkan USDC atau IDRX sesuai pilihan
    from: formatAddr(sender),
    to: formatAddr(recipient),
    gasFee: `${currency} 0.00`,
    // Gunakan nominal asli yang dilempar dari page sebelumnya
    transferAmount: `${currency} ${parseFloat(amount).toLocaleString("id-ID")}`,
    total: `${currency} ${parseFloat(amount).toLocaleString("id-ID")}`,
  };

    const handleRecord = async () => {
    if (!sender) return;
    const res = await addHistory({
      sender: sender,
      receiver: recipient,
      amount: parseFloat(amount),
      token: currency,
      tx_hash: txHash,
    });

    if (res.success) {
      console.log('History berhasil disimpan:', res.data);
    } else {
      console.error('Gagal menyimpan history:', res.message);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
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
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <Image
                src="/success-logo.svg"
                alt="Success"
                width={200}
                height={200}
              />
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex flex-col min-h-screen pt-8 px-6">
            <div className="pb-4">
              <button
                onClick={() => router.push("/")}
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

            <div className="max-w-2xl mx-auto grow w-full">
              <InvoiceCard
                invoiceNumber={invoiceData.invoiceNumber}
                date={invoiceData.date}
                transferMethod={invoiceData.transferMethod}
                from={invoiceData.from}
                to={invoiceData.to}
                gasFee={invoiceData.gasFee}
                transferAmount={invoiceData.transferAmount}
                total={invoiceData.total}
              />
            </div>

            <div className="space-y-3 max-w-2xl mx-auto w-full pb-4">
              <SecondaryButton
                onClick={() => alert("Invoice Copied to Clipboard!")}
              >
                Share Invoice
              </SecondaryButton>
              <PrimaryButton onClick={() => {
                router.push("/");
                handleRecord();
              }}>
                Done
              </PrimaryButton>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
