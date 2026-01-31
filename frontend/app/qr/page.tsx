"use client";

import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import ScanQrOverlay from "@/components/ui/ScanQrOverlay";
import ShowQrNavigation from "../../components/ui/ShowQrNav";
export default function Qr() {
  const router = useRouter();

  const handleScan = (result: any) => {
    const rawValue = result?.[0]?.rawValue;
    if (!rawValue) return;

    try {
      const url = new URL(rawValue);
      const invoiceId = url.searchParams.get("invoiceId");
      const amount = url.searchParams.get("amount");
      const recipient =
        url.searchParams.get("recipient") || url.searchParams.get("merchant");

      // SEKARANG: Semua lempar ke /payment
      // Kita bawa semua parameter yang mungkin ada
      let targetPath = `/payment?`;
      if (invoiceId) targetPath += `invoiceId=${invoiceId}&`;
      if (amount) targetPath += `amount=${amount}&`;
      if (recipient) targetPath += `recipient=${recipient}&`;

      router.push(targetPath);
    } catch {
      // Parsing manual jika format bukan URL lengkap
      if (rawValue.includes("invoiceId=")) {
        const id = rawValue.match(/invoiceId=(\d+)/)?.[1];
        router.push(`/payment?invoiceId=${id}`);
      } else {
        router.push(`/payment?recipient=${rawValue}`);
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
