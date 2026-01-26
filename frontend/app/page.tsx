"use client";

import Header from '../components/ui/Header';
import BalanceCard from '../components/ui/cards/BalanceCard';
import CryptoItem from '../components/ui/cards/CryptoItemCard';
import BottomNav from '../components/ui/BottonNav';
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";
import { useWalletGuard } from './hooks/useWalletGuard';


const cryptoAssets = [
  { id: 1, name: "Ethereum", symbol: "ETH", price: "5.092,92", change: "+11.02%"},
  { id: 2, name: "Bitcoin", symbol: "BTC", price: "1.092,92", change: "+21.02%" },
  { id: 3, name: "Ethereum", symbol: "ETH", price: "5.092,92", change: "+11.02%" },
  { id: 4, name: "Bitcoin", symbol: "BTC", price: "1.092,92", change: "+21.02%" },
  { id: 5, name: "Bitcoin", symbol: "BTC", price: "1.092,92", change: "+21.02%" },
];

const info = {
  username: "dzikribm",
  avatar: "/profile-pic.svg",
};

const balanceInfo = {
  balance: "IDRX 452.57",
  profit: "IDRX 123.13",
  growthRate: "5.7%",
  balanceGrowth: "+15%",
};

export default function Home() {
  const { isConnected } = useWalletGuard();

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  if (!isConnected) {
    return null;
  }
  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">

      <Header avatar={info.avatar} username={info.username} />
      <BalanceCard
        balance={balanceInfo.balance}
        profit={balanceInfo.profit}
        growthRate={balanceInfo.growthRate}
        balanceGrowth={balanceInfo.balanceGrowth}
      />
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

