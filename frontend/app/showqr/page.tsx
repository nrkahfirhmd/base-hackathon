"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image"; // Tambahkan ini
import ShowQrOverlay from "@/components/ui/ShowQrOverlay";
import { useCreateOnChainInvoice } from "../hooks/useCreateOnChainInvoice";
import ScanQrNavigation from "../../components/ui/ScanQrNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import { useProfile } from "@/app/hooks/useProfile";

export default function ShowQrPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { profile } = useProfile();

  // Ref untuk menangkap elemen kartu QR
  const qrRef = useRef<HTMLDivElement>(null);

  const amount = searchParams.get("amount") || "0";
  const fee = "0"; // Atur fee jika perlu
  const [invoiceId, setInvoiceId] = useState<string>("");
  const { createInvoice } = useCreateOnChainInvoice();

  // Buat invoice di blockchain saat komponen mount (sekali saja)
  useState(() => {
    if (!address || invoiceId) return;
    createInvoice({
      merchant: address,
      amount,
      fee,
      metadata: { tokenSymbol: "USDC", fiatSymbol: "IDRX", fiatAmount: amount },
    })
      .then((res) => {
        if (res?.invoiceId) setInvoiceId(res.invoiceId);
      })
      .catch(console.error);
  });

  // Fungsi untuk mendownload gambar
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
      {/* Tombol Back tetap sama */}
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
          {/* Bungkus komponen dengan div ref */}
          <div ref={qrRef} className="bg-[#1B1E34]">
            <ShowQrOverlay
              amount={amount}
              paymentUrl={invoiceId ? `${window.location.origin}/invoice?invoiceId=${invoiceId}` : ""}
              merchantName={profile.username || "DeQRypt Merchant"}
            />
          </div>

          <div className="w-full">
            <SecondaryButton onClick={handleDownload}>
              Save To Gallery
            </SecondaryButton>
          </div>
        </div>
      </div>

      <ScanQrNavigation />
    </div>
  );
}
