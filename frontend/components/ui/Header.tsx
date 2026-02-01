"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDisconnect } from "wagmi"; // Import hook disconnect

type HeaderProps = {
  avatar?: string;
  username: string;
};

const Header = ({ avatar, username }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { disconnect } = useDisconnect();

  // Logika Logout: Putus koneksi wallet lalu pindah ke /connect
  const handleLogout = () => {
    disconnect();
    router.push("/connect");
  };

  return (
    <header className="relative flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        {/* Avatar Placeholder */}
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
          <img
            src={avatar || "/default-avatar.png"}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-gray-400 text-xs">Good Morning!</p>
          <h2 className="text-white text-sm font-bold">
            {username || "Anonymous"}
          </h2>
        </div>
      </div>

      {/* Settings Container */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition relative z-50 shadow-lg"
        >
          {/* Gear Icon Animation */}
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </motion.div>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Invisible Backdrop to close menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 8, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 w-48 bg-[#252A42] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="py-2">
                  {/* Link ke Lending */}
                  <Link
                    href="/lending"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
                    </svg>
                    Lending Market
                  </Link>

                  <div className="h-[1px] bg-white/5 mx-2" />

                  {/* Tombol Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Logout
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
