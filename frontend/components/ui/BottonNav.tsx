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
            <linearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2f1f4f" />
              <stop offset="50%" stopColor="#422c76" />
              <stop offset="100%" stopColor="#6a3eb7" />
            </linearGradient>
          </defs>
          <path
            fill="url(#navGradient)"
            d="M0,25 L143,25 A45,45 0 0,0 232,25 L375,25 L375,95 L0,95 Z"
          />
        </svg>

        <div className="relative w-full h-full flex justify-between items-end px-14 pb-6">
          {/* History Icon */}
          <Link
            href="/transaction"
            className="text-white/70 cursor-pointer "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </Link>

          {/* Scan Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <Link href="/qr">
              {/* Main Button */}
              <div className="relative w-20 h-20 rounded-full bg-linear-to-b from-[#281a45] via-[#3b2a6e] to-[#6a3eb7] flex items-center justify-center">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                  <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                  <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" strokeOpacity="0.5" />
                </svg>
              </div>
            </Link>
          </div>

          {/* User Icon */}
          <Link href="/profile" className="text-white/70 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;