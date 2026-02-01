"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ethers } from "ethers";

import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import InvoiceCard from "@/components/ui/cards/InvoiceCard";
import { useAddHistory } from "@/app/hooks/useTransactionHistory";

function InvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ref untuk memastikan handleRecord hanya dipanggil SEKALI
  const hasRecorded = useRef(false);

  const fromHistory = searchParams.get("fromHistory") === "true";
  const [showSuccess, setShowSuccess] = useState(!fromHistory);
  const [realGasFee, setRealGasFee] = useState<string>("0.00");
  const [isFetchingGas, setIsFetchingGas] = useState(false);

  const { addHistory } = useAddHistory();

  // EXTRAK DATA
  const invId = searchParams.get("invoiceId") || "N/A";
  const amountStr = searchParams.get("idr") || "0";
  const currency = searchParams.get("coin") || "USDC";
  const recipient = searchParams.get("to") || "";
  const sender = searchParams.get("from") || "";
  const txHash = searchParams.get("txHash") || searchParams.get("tx") || "";

  // 1. FIX RPC: Gunakan Static Network agar tidak gagal deteksi
  const fetchGasFeeOnChain = useCallback(async () => {
    if (!txHash || txHash === "" || realGasFee !== "0.00") return;

    setIsFetchingGas(true);
    try {
      // Masukkan Chain ID Base Sepolia (84532) agar Ethers tidak perlu deteksi otomatis
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia.base.org",
        84532,
        { staticNetwork: true },
      );

      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        const gasPrice =
          (receipt as any).gasPrice || (receipt as any).effectiveGasPrice;
        if (gasPrice) {
          const totalFeeWei = receipt.gasUsed * gasPrice;
          setRealGasFee(ethers.formatUnits(totalFeeWei, 18));
        }
      }
    } catch (err) {
      console.error("RPC Error:", err);
    } finally {
      setIsFetchingGas(false);
    }
  }, [txHash, realGasFee]);

  // 2. FIX 400 ERROR: Validasi Payload sebelum dikirim
  const handleRecord = useCallback(async () => {
    // Jangan kirim jika data tidak lengkap atau sudah pernah direcord
    if (!sender || !txHash || hasRecorded.current || fromHistory) return;

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error("Invalid amount for history:", amountStr);
      return;
    }

    hasRecorded.current = true; // Kunci agar tidak double post

    console.log("Sending to Backend:", {
      sender,
      recipient,
      parsedAmount,
      currency,
      txHash,
    });

    const res = await addHistory({
      sender: sender,
      receiver: recipient,
      amount: parsedAmount,
      token: currency,
      tx_hash: txHash,
    });

    if (!res.success) {
      console.error("Backend Rejected:", res.message);
      hasRecorded.current = false; // Buka kunci jika gagal agar bisa retry
    }
  }, [sender, txHash, recipient, amountStr, currency, addHistory, fromHistory]);

  useEffect(() => {
    if (txHash) {
      fetchGasFeeOnChain();
    }

    // Pastikan handleRecord dipanggil
    handleRecord();

    if (!fromHistory) {
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [fetchGasFeeOnChain, handleRecord, fromHistory, txHash]);

  const formatAddr = (addr: string) =>
    addr && addr.length > 15
      ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
      : addr || "N/A";

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
    gasFee: `ETH ${parseFloat(realGasFee).toFixed(8)}`,
    transferAmount: `${currency} ${parseFloat(amountStr).toLocaleString("id-ID")}`,
    total: `${currency} ${parseFloat(amountStr).toLocaleString("id-ID")}`,
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
            className="min-h-screen flex items-center justify-center"
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
                className="p-2 hover:bg-white/10 rounded-lg"
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
              {isFetchingGas && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold animate-pulse">
                    Verifying Gas Fee...
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 max-w-2xl mx-auto w-full pb-8">
              <SecondaryButton
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Invoice ${invoiceData.invoiceNumber}`,
                  );
                  alert("Copied!");
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

export default function Invoice() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1B1E34] flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <InvoiceContent />
    </Suspense>
  );
}
