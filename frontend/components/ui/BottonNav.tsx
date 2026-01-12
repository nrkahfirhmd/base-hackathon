"use client";

import Link from 'next/link';

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto z-50">
      <div className="relative h-28 flex items-end">
        <svg
          viewBox="0 0 375 95"
          className="absolute bottom-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient Background */}
            <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5b21b6" />
              <stop offset="50%" stopColor="#3b2a6e" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            {/* Border Gradient */}
            <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
          </defs>
          {/* Border stroke - setengah lingkaran dengan arc */}
          <path
            fill="none"
            stroke="url(#borderGradient)"
            strokeWidth="1.5"
            d="M0,25 L143,25 A45,45 0 0,0 232,25 L375,25"
          />
          {/* Background Fill - setengah lingkaran dengan arc */}
          <path
            fill="url(#navGradient)"
            d="M0,25 L143,25 A45,45 0 0,0 232,25 L375,25 L375,95 L0,95 Z"
          />
        </svg>

        {/* --- 2. KONTEN & TOMBOL --- */}
        <div className="relative w-full h-full flex justify-between items-end px-14 pb-6">

          {/* KIRI: History Icon */}
          <button className="text-white/80 hover:text-white transition mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M12 7v5l4 2"/>
            </svg>
          </button>

          {/* tombol scan */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1">
             <Link href="/qr">
                <div className="group relative">
                    {/* Lingkaran Glow di belakang */}
                    <div className="absolute inset-0 bg-purple-600/40 rounded-full blur-2xl scale-150"></div>

                    {/* Tombol Utama */}
                    <div className="relative w-17 h-17 rounded-full bg-linear-to-b from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] flex items-center justify-center transform group-hover:scale-105 transition-transform">

                        {/* Icon Scan */}
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                            <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                            <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                            <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
                            <line x1="7" y1="12" x2="17" y2="12" strokeOpacity="0.5" />
                        </svg>

                    </div>
                </div>
             </Link>
          </div>

          {/* icon user */}
          <button className="text-white/80 hover:text-white transition mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="12" cy="8" r="4"/>
               <path d="M6 21v-2a6 6 0 0 1 12 0v2"/>
            </svg>
          </button>

        </div>
      </div>
    </div>
  );
};

export default BottomNav;