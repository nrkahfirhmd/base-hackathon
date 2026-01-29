"use client";

import { useRouter } from "next/navigation";
import { useFetchOnChainInvoice } from "../hooks/useFetchOnChainInvoice";
import { useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import ScanQrOverlay from "@/components/ui/ScanQrOverlay";
import ShowQrNavigation from "../../components/ui/ShowQrNav";

export default function Qr() {
  const router = useRouter();
  const { fetchInvoice } = useFetchOnChainInvoice();

  const handleScan = (result: any) => {
    const rawValue = result?.[0]?.rawValue;

    if (!rawValue) return;
    console.log("QR Terdeteksi:", rawValue);

    // Cek apakah QR mengandung invoiceId (dalam URL ?invoiceId=...)
    let invoiceId = "";
    try {
      const url = new URL(rawValue);
      invoiceId = url.searchParams.get("invoiceId") || "";
    } catch {
      // Fallback: jika QR hanya invoiceId mentah
      if (/^0x[0-9a-fA-F]{64}$/.test(rawValue)) invoiceId = rawValue;
    }

    if (invoiceId) {
      // Fetch invoice dari blockchain
      try {
        const invoice = await fetchInvoice(invoiceId);
        if (invoice && invoice.invoiceId) {
          // Redirect ke halaman invoice dengan id
          router.push(`/invoice?invoiceId=${invoiceId}`);
          return;
        } else {
          alert("Invoice tidak ditemukan di blockchain.");
        }
      } catch (e) {
        alert("Gagal mengambil data invoice dari blockchain.");
      }
    } else {
      alert("QR tidak mengandung invoiceId yang valid.");
    }
  };

  return (
    <div className="relative flex flex-col font-sans w-full bg-qr-pattern bg-cover min-h-screen overflow-hidden">
      {/* Tombol Back */}
      <div className="absolute top-8 left-6 z-50">
        <button
          onClick={() => router.push("/")}
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

      {/* Area Kamera Scanner */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        <Scanner
          onScan={handleScan}
          allowMultiple={false}
          scanDelay={2000}
          styles={{
            container: { width: "100%", height: "100%" },
            video: { width: "100%", height: "100%", objectFit: "cover" },
          }}
          components={{
            audio: false,
            finder: false,
          }}
        />
      </div>

      {/* Overlay Kustom */}
      <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
        <ScanQrOverlay />
      </div>

      {/* Navigasi Bawah */}
      <div className="absolute bottom-0 w-full z-50">
        <ShowQrNavigation />
      </div>
    </div>
  );
}
