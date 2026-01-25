"use client";

import { useRouter } from "next/navigation";
import ShowQrOverlay from "@/components/ui/ShowQrOverlay";
import ScanQrNavigation from "../../components/ui/ScanQrNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";

export default function ShowQrPage() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-y-auto">
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

      {/* Kontainer Utama Konten */}
      <div className="flex flex flex-col items-center justify-center p-6 pt-24 pb-32">
        {/* Wrapper ini yang menentukan lebar Card dan Button secara bersamaan */}
        <div className="w-full max-w-sm flex flex-col">
          {/* Komponen Card */}
          <ShowQrOverlay />

          {/* Tombol Save  */}
          <div className="w-full">
            <SecondaryButton onClick={() => {}}>
              Save To Gallery
            </SecondaryButton>
          </div>
        </div>
      </div>

      {/* Navigasi Bawah */}
      <ScanQrNavigation />
    </div>
  );
}
