"use client";

import Header from '../components/ui/Header';
import BalanceCard from '../components/ui/cards/BalanceCard';
import CryptoItem from '../components/ui/cards/CryptoItemCard';
import BottomNav from '../components/ui/BottonNav';
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";
import { useWalletGuard } from './hooks/useWalletGuard';

const cryptoAssets = [
  { id: 1, name: "Ethereum", symbol: "ETH", price: "5.092,92", change: "+11.02%", color: "bg-blue-500" },
  { id: 2, name: "Bitcoin", symbol: "BTC", price: "1.092,92", change: "+21.02%", color: "bg-orange-500" },
  { id: 3, name: "Ethereum", symbol: "ETH", price: "5.092,92", change: "+11.02%", color: "bg-blue-500" },
  { id: 4, name: "Bitcoin", symbol: "BTC", price: "1.092,92", change: "+21.02%", color: "bg-orange-500" },
  { id: 5, name: "Bitcoin", symbol: "BTC", price: "1.092,92", change: "+21.02%", color: "bg-orange-500" },
];

export default function Home() {
  const { isConnected } = useWalletGuard();
  
  useEffect(() => {
    sdk.actions.ready();
  }, []);
  
  if (!isConnected) {
    return null; // Show nothing while redirecting
  }
  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">

      <Header />
      <BalanceCard />
      {/* List Container */}
      <div className="mt-4">
        {cryptoAssets.map((asset) => (
          <CryptoItem key={asset.id} asset={asset} />
        ))}
        {cryptoAssets.map((asset) => (
          <CryptoItem key={`dup-${asset.id}`} asset={asset} />
        ))}
      </div>
      <BottomNav />
    </main>
  );
}

