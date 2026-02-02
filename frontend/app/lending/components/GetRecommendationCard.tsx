"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useCryptoBalances } from "@/app/hooks/useCryptoBalances";

interface Props {
  onSearch?: (symbol: string) => void;
  isLoading?: boolean; // Tambahkan prop ini
}

export default function GetRecommendationCard({ onSearch, isLoading }: Props) {
  const { cryptoAssets } = useCryptoBalances();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter aset hanya IDRX dan USDC
  const availableTokens = cryptoAssets.filter(
    (asset) => asset.symbol === "IDRX" || asset.symbol === "USDC",
  );

  const [selectedToken, setSelectedToken] = useState(
    availableTokens.find((t) => t.symbol === "USDC") || availableTokens[0],
  );

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

  return (
    <div className="w-full p-6 rounded-t-2xl bg-gradient-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-xl">
      <div className="mb-6">
        <h2 className="text-white text-lg font-bold leading-tight opacity-90">
          Let the AI Agents search best lending position for you!
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Dropdown Token - Disabled saat loading */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
            className={`h-[42px] flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all px-4 rounded-xl min-w-[145px] ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white/5 border border-white/10">
              <Image
                src={getIconUrl(selectedToken?.symbol || "USDC")}
                alt={selectedToken?.symbol || "Token"}
                width={32}
                height={32}
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-white font-bold flex-1 text-left text-sm">
              {selectedToken?.symbol || "USDC"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-3xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
              {availableTokens.map((token) => (
                <button
                  key={token.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                  onClick={() => {
                    setSelectedToken(token);
                    setIsOpen(false);
                  }}
                >
                  <div className="w-6 h-6 rounded-xl overflow-hidden bg-white/5">
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
              ))}
            </div>
          )}
        </div>

        {/* Search Button - Mengubah teks saat loading */}
        <button
          onClick={() => onSearch?.(selectedToken.symbol)}
          disabled={isLoading}
          className={`h-[42px] flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all px-8 rounded-xl ${isLoading ? "opacity-70 cursor-wait" : ""}`}
        >
          <span className="text-white/40 font-bold tracking-[0.2em] text-xs uppercase">
            {isLoading ? "SEARCHING..." : "SEARCH"}
          </span>
          {!isLoading && <Search className="w-4 h-4 text-white/40" />}
        </button>
      </div>
    </div>
  );
}
