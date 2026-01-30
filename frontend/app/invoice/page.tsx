"use client";

import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import InvoiceCard from "@/components/ui/cards/InvoiceCard";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useInvoice, FormattedInvoice } from "@/app/hooks/useInvoice";
import { useAccount } from "wagmi";

export default function Invoice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const invoiceIdParam = searchParams.get("invoiceId") || "";

  const { 
    getFormattedInvoice, 
    payInvoice, 
    approveIDRX, 
    checkAllowance, 
    isLoading, 
    error 
  } = useInvoice();

  const [invoice, setInvoice] = useState<FormattedInvoice | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"idle" | "approving" | "paying">("idle");

  // Fetch invoice data dari blockchain
  useEffect(() => {
    if (!invoiceIdParam) return;

    getFormattedInvoice(invoiceIdParam).then((data) => {
      if (data) {
        setInvoice(data);
        if (data.status === "Paid") {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 1500);
        }
      }
    });
  }, [invoiceIdParam, getFormattedInvoice]);

  // Handler untuk bayar invoice (dengan auto-approve jika perlu)
  const handlePayInvoice = async () => {
    if (!invoiceIdParam || !invoice || !address || isPaying) return;

    setIsPaying(true);

    try {
      // 1. Cek allowance
      const currentAllowance = await checkAllowance(address);
      const requiredAmount = parseFloat(invoice.total);

      // 2. Jika allowance kurang, approve dulu
      if (parseFloat(currentAllowance) < requiredAmount) {
        setPaymentStep("approving");
        const approveResult = await approveIDRX(invoice.total);
        
        if (!approveResult.success) {
          alert(`Approve gagal: ${approveResult.error}`);
          setIsPaying(false);
          setPaymentStep("idle");
          return;
        }
      }

      // 3. Bayar invoice
      setPaymentStep("paying");
      const result = await payInvoice(invoiceIdParam);

      if (result.success) {
        setShowSuccess(true);
        const updated = await getFormattedInvoice(invoiceIdParam);
        if (updated) setInvoice(updated);
        setTimeout(() => setShowSuccess(false), 1500);
      } else {
        alert(`Pembayaran gagal: ${result.error}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    setIsPaying(false);
    setPaymentStep("idle");
  };

  // Handler share invoice
  const handleShare = async () => {
    if (navigator.share && invoice) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice ${invoice.invoiceNumber} - ${invoice.total} ${invoice.tokenSymbol}`,
          url: window.location.href,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Get button text based on payment step
  const getPayButtonText = () => {
    if (paymentStep === "approving") return "Approving...";
    if (paymentStep === "paying") return "Paying...";
    return "Pay Now";
  };

  // Loading state
  if (!invoice && !error) {
    return (
      <div className="min-h-screen bg-[#1B1E34] text-white flex items-center justify-center">
        <p className="animate-pulse">Loading invoice...</p>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#1B1E34] text-white flex flex-col items-center justify-center p-6">
        <p className="text-red-400 mb-4">Invoice tidak ditemukan</p>
        <SecondaryButton onClick={() => router.push("/")}>
          Kembali ke Home
        </SecondaryButton>
      </div>
    );
  }

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
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex flex-col min-h-screen pt-8 px-6">
            <div className="pb-4">
              <button
                onClick={() => router.back()}
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
            <div className="max-w-2xl mx-auto grow w-full">
              {/* Invoice Card */}
              <InvoiceCard
                invoiceNumber={invoice.invoiceNumber}
                date={invoice.date}
                transferMethod={invoice.tokenSymbol}
                from={invoice.payer !== "0x0000000000000000000000000000000000000000" 
                  ? `${invoice.payer.slice(0, 6)}...${invoice.payer.slice(-4)}`
                  : "Pending..."
                }
                to={`${invoice.merchant.slice(0, 6)}...${invoice.merchant.slice(-4)}`}
                gasFee={`${invoice.tokenSymbol} ${invoice.fee}`}
                transferAmount={`${invoice.tokenSymbol} ${invoice.amount}`}
                total={`${invoice.tokenSymbol} ${invoice.total}`}
              />

              {/* Status Badge */}
              <div className="text-center mt-4">
                {invoice.status === "Pending" && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm">
                    ⏳ Menunggu Pembayaran
                  </span>
                )}
                {invoice.status === "Paid" && (
                  <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm">
                    ✅ Sudah Dibayar
                  </span>
                )}
                {invoice.status === "Cancelled" && (
                  <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm">
                    ❌ Dibatalkan
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 max-w-2xl mx-auto w-full pb-4">
              <SecondaryButton onClick={handleShare}>
                Share Invoice
              </SecondaryButton>

              {invoice.status === "Pending" && (
                <PrimaryButton
                  onClick={handlePayInvoice}
                  disabled={isLoading || isPaying}
                >
                  {getPayButtonText()}
                </PrimaryButton>
              )}

              {invoice.status === "Paid" && (
                <PrimaryButton onClick={() => router.push("/")}>
                  Done
                </PrimaryButton>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
