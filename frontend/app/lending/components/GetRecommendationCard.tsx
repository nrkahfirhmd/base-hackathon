"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useCryptoBalances } from "@/app/hooks/useCryptoBalances";

interface Props {
  onSearch?: (symbol: string) => void;
  isLoading?: boolean;
}

export default function GetRecommendationCard({ onSearch, isLoading }: Props) {
  const { cryptoAssets } = useCryptoBalances();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableTokens = cryptoAssets.filter(
    (asset) => asset.symbol === "IDRX" || asset.symbol === "USDC",
  );

  const [selectedToken, setSelectedToken] = useState(
    availableTokens.find((t) => t.symbol === "USDC") || availableTokens[0],
  );

  useEffect(() => {
    if (!selectedToken && availableTokens.length > 0) {
      setSelectedToken(
        availableTokens.find((t) => t.symbol === "USDC") || availableTokens[0],
      );
    }
  }, [cryptoAssets, selectedToken, availableTokens]);

  const getIconUrl = (symbol: string) => {
    if (symbol.toUpperCase() === "IDRX") return "/IDRX-Logo.png";
    const iconSymbol = symbol.toLowerCase();
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${iconSymbol}.png`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Safe fallback values
  const currentSymbol = selectedToken?.symbol || "USDC";

  return (
    <div className="w-full p-6 rounded-t-2xl bg-gradient-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-xl overflow-hidden">
      <div className="mb-6">
        <h2 className="text-white text-lg font-bold leading-tight opacity-90">
          Let the AI Agents search best lending position for you!
        </h2>
      </div>

      {/* Container Flex dengan max-w-full agar tidak overflow */}
      <div className="flex items-center gap-3 w-full max-w-full">
        {/* Dropdown Token - Ukuran tetap di mobile, sedikit fleksibel */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
            // Ubah min-w-[145px] jadi w-[110px] di mobile, 145px di desktop agar muat di layar kecil
            className={`h-[42px] flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all px-3 sm:px-4 rounded-xl w-[110px] sm:w-[145px] ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
              <Image
                src={getIconUrl(currentSymbol)}
                alt={currentSymbol}
                width={32}
                height={32}
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-white font-bold flex-1 text-left text-xs sm:text-sm truncate">
              {currentSymbol}
            </span>
            <ChevronDown
              className={`w-3 h-3 sm:w-4 sm:h-4 text-white/40 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-[140px] sm:w-full bg-[#1a1a24] border border-white/10 rounded-3xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
              {availableTokens.length > 0 ? (
                availableTokens.map((token) => (
                  <button
                    key={token.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                    onClick={() => {
                      setSelectedToken(token);
                      setIsOpen(false);
                    }}
                  >
                    <div className="w-6 h-6 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      <Image
                        src={getIconUrl(token.symbol)}
                        alt={token.symbol}
                        width={24}
                        height={24}
                        unoptimized
                      />
                    </div>
                    <span className="text-white text-sm font-bold">
                      {token.symbol}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-white/40 text-xs italic">
                  Loading...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={() => selectedToken && onSearch?.(selectedToken.symbol)}
          disabled={isLoading || !selectedToken}
          // PERUBAHAN UTAMA:
          // 1. min-w-0: Mencegah overflow flex item
          // 2. px-4 sm:px-8: Padding lebih kecil di mobile
          // 3. text-[10px] sm:text-xs: Font size responsif agar teks muat
          className={`h-[42px] flex-1 flex items-center justify-center gap-2 sm:gap-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all px-4 sm:px-8 rounded-xl min-w-0 ${isLoading || !selectedToken ? "opacity-70 cursor-wait" : ""}`}
        >
          <span className="text-white/40 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase truncate">
            {isLoading ? "SEARCHING..." : "SEARCH"}
          </span>
          {!isLoading && (
            <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white/40 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
}
