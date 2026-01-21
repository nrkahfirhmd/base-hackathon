"use client"; // Wajib karena menggunakan useRouter

import { useRouter } from "next/navigation";
import ScanQrOverlay from "@/components/ui/ScanQrOverlay";
import ShowQrNavigation from "../../components/ui/ShowQrNav";

export default function Qr() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col font-sans w-full bg-qr-pattern bg-cover min-h-screen">
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

      {/* Overlay dan Navigasi */}
      <ScanQrOverlay />
      <ShowQrNavigation />
    </div>
  );
}
