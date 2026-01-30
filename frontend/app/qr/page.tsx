"use client";

import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import ScanQrOverlay from "@/components/ui/ScanQrOverlay";
import ShowQrNavigation from "../../components/ui/ShowQrNav";

export default function Qr() {
  const router = useRouter();

  /**
   * Handler saat QR berhasil di-scan
   * QR bisa berisi:
   * 1. URL dengan invoiceId: https://app.com/invoice?invoiceId=5
   * 2. URL dengan payment params: https://app.com/payment?amount=1000&recipient=0x...
   */
  const handleScan = (result: any) => {
    const rawValue = result?.[0]?.rawValue;
    if (!rawValue) return;

    console.log("QR Terdeteksi:", rawValue);

    try {
      const url = new URL(rawValue);
      const invoiceId = url.searchParams.get("invoiceId");

      // Jika QR mengandung invoiceId → redirect ke halaman invoice
      if (invoiceId) {
        router.push(`/invoice?invoiceId=${invoiceId}`);
        return;
      }

      // Fallback: redirect ke payment dengan params yang ada
      const searchParams = url.search;
      if (searchParams) {
        router.push(`/payment${searchParams}`);
      } else {
        router.push(`/payment`);
      }
    } catch {
      // Fallback jika QR bukan format URL
      console.error("Format QR tidak valid sebagai URL, mencoba parsing manual...");

      if (rawValue.includes("invoiceId=")) {
        const match = rawValue.match(/invoiceId=(\d+)/);
        if (match) {
          router.push(`/invoice?invoiceId=${match[1]}`);
          return;
        }
      }

      if (rawValue.includes("?")) {
        const manualParams = rawValue.substring(rawValue.indexOf("?"));
        router.push(`/payment${manualParams}`);
      } else {
        console.error("QR tidak mengandung parameter data.");
      }
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
