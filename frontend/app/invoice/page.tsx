"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ethers } from "ethers"; // Pastikan sudah: npm install ethers

// UI Components
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import InvoiceCard from "@/components/ui/cards/InvoiceCard";

// Hooks
import { useAddHistory } from "@/app/hooks/useTransactionHistory";

export default function Invoice() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State Management
  const [showSuccess, setShowSuccess] = useState(true);
  const [realGasFee, setRealGasFee] = useState<string>("0.00");
  const [isFetchingGas, setIsFetchingGas] = useState(false);

  const { addHistory } = useAddHistory();

  // 1. EXTRAK DATA DARI URL
  const invId = searchParams.get("invoiceId") || "N/A";
  const amount = searchParams.get("idr") || "0";
  const currency = searchParams.get("coin") || "USDC";
  const recipient = searchParams.get("to") || "0x000...000";
  const sender = searchParams.get("from") || "";
  const txHash = searchParams.get("txHash") || searchParams.get("tx") || "";

  // 2. FUNGSI AMBIL GAS FEE LANGSUNG DARI BASE SEPOLIA
  const fetchGasFeeOnChain = useCallback(async () => {
    if (!txHash) return;

    setIsFetchingGas(true);
    try {
      const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
      const receipt = await provider.getTransactionReceipt(txHash);

      if (receipt) {
        const gasUsed = receipt.gasUsed;

        // Di ethers v6, gunakan receipt.gasPrice
        // Jika TS masih error, kita cast ke 'any' sebentar untuk mengambil nilainya
        const gasPrice = receipt.gasPrice;

        if (gasPrice) {
          // BigInt multiplication
          const totalFeeWei = gasUsed * gasPrice;

          // Format ke ETH (18 desimal)
          const totalFeeEth = ethers.formatUnits(totalFeeWei, 18);
          setRealGasFee(totalFeeEth);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil gas fee on-chain:", err);
    } finally {
      setIsFetchingGas(false);
    }
  }, [txHash]);

  const handleRecord = useCallback(async () => {
    if (!sender || !txHash) return;

    await addHistory({
      sender: sender,
      receiver: recipient,
      amount: parseFloat(amount),
      token: currency,
      tx_hash: txHash,
    });
  }, [sender, txHash, recipient, amount, currency, addHistory]);

  useEffect(() => {
    // Jalankan kedua proses secara paralel
    fetchGasFeeOnChain();
    handleRecord();

    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [fetchGasFeeOnChain, handleRecord]);

  const formatAddr = (addr: string) =>
    addr.length > 15 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  // 5. DATA UNTUK DITAMPILKAN DI CARD
  const invoiceData = {
    invoiceNumber: `#${invId}`,
    date: new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    transferMethod: currency,
    from: formatAddr(sender),
    to: formatAddr(recipient),
    // Menampilkan Gas Fee asli dengan presisi 8 desimal
    gasFee: `ETH ${parseFloat(realGasFee).toFixed(8)}`,
    transferAmount: `${currency} ${parseFloat(amount).toLocaleString("id-ID")}`,
    total: `${currency} ${parseFloat(amount).toLocaleString("id-ID")}`,
  };

  return (
    <div className="min-h-screen bg-[#1B1E34] text-white overflow-hidden font-sans">
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
              <InvoiceCard {...invoiceData} />

              {/* Tanda Loading saat mengambil data dari Chain */}
              {isFetchingGas && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold animate-pulse">
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 max-w-2xl mx-auto w-full pb-8">
              <SecondaryButton
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Invoice ${invoiceData.invoiceNumber} - Success`,
                  );
                  alert("Invoice copied!");
                }}
              >
                Share Invoice
              </SecondaryButton>
              <PrimaryButton onClick={() => router.push("/")}>
                Done
              </PrimaryButton>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
