"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useRef, useCallback, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import ShowQrOverlay from "@/components/ui/ShowQrOverlay";
import ScanQrNavigation from "../../components/ui/ScanQrNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import { useProfile } from "@/app/hooks/useProfile";
import { useInvoice } from "@/app/hooks/useInvoice";

export default function ShowQrPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { profile } = useProfile();
  const { createInvoice, watchInvoiceStatus, isLoading } = useInvoice();

  const qrRef = useRef<HTMLDivElement>(null);
  const amount = searchParams.get("amount") || "0";

  const [invoiceId, setInvoiceId] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "waiting" | "paid">("loading");

  // 1. Buat invoice on-chain saat pertama kali mount
  useEffect(() => {
    if (!address || invoiceId) return;

    createInvoice({
      merchant: address,
      amount,
      fee: "0",
      metadata: { tokenSymbol: "IDRX", fiatSymbol: "IDR", fiatAmount: amount },
    }).then((res) => {
      if (res.success && res.invoiceId) {
        setInvoiceId(res.invoiceId);
        setStatus("waiting");
      } else {
        console.error("Gagal membuat invoice:", res.error);
      }
    });
  }, [address, amount, invoiceId, createInvoice]);

  // 2. Mulai polling status invoice setelah invoice dibuat
  useEffect(() => {
    if (!invoiceId || status !== "waiting") return;

    const { stop } = watchInvoiceStatus(invoiceId, {
      onPaid: (invoice) => {
        setStatus("paid");
        // Redirect ke halaman sukses setelah 2 detik
        setTimeout(() => {
          router.push(`/invoice?invoiceId=${invoice.invoiceId}`);
        }, 2000);
      },
      onCancelled: () => {
        alert("Invoice dibatalkan");
        router.push("/input");
      },
      onError: (err) => {
        console.error("Polling error:", err);
      },
      intervalMs: 3000,
    });

    return () => stop();
  }, [invoiceId, status, watchInvoiceStatus, router]);

  // URL yang akan di-encode ke QR
  const paymentUrl = invoiceId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invoice?invoiceId=${invoiceId}`
    : "";

  const handleDownload = useCallback(() => {
    if (qrRef.current === null) return;

    toPng(qrRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `DeQRypt-Invoice-${invoiceId || amount}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Gagal mendownload gambar:", err);
      });
  }, [qrRef, amount, invoiceId]);

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-y-auto">
      {/* Tombol Back */}
      <div className="absolute top-8 left-6 z-50">
        <button
          onClick={() => router.push("/input")}
          className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-lg transition-colors text-white shadow-lg"
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

      <div className="flex flex-col items-center justify-center p-6 pt-24 pb-32">
        <div className="w-full max-w-sm flex flex-col">
          {/* Status Loading */}
          {status === "loading" && (
            <div className="text-center text-white py-10">
              <p className="animate-pulse">Membuat invoice...</p>
            </div>
          )}

          {/* QR Code Display */}
          {status === "waiting" && paymentUrl && (
            <>
              <div ref={qrRef} className="bg-[#1B1E34]">
                <ShowQrOverlay
                  amount={amount}
                  paymentUrl={paymentUrl}
                  merchantName={profile.username || "DeQRypt Merchant"}
                />
              </div>
              <p className="text-center text-gray-400 text-sm mt-2 animate-pulse">
                Menunggu pembayaran...
              </p>
            </>
          )}

          {/* Success State */}
          {status === "paid" && (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-green-400 text-xl font-bold">Pembayaran Diterima!</p>
              <p className="text-gray-400 mt-2">Redirecting...</p>
            </div>
          )}

          {/* Download Button */}
          {status === "waiting" && (
            <div className="w-full mt-4">
              <SecondaryButton onClick={handleDownload} disabled={isLoading}>
                Save To Gallery
              </SecondaryButton>
            </div>
          )}
        </div>
      </div>

      <ScanQrNavigation />
    </div>
  );
}
