"use client";

import Header from '../components/ui/Header';
import BalanceCard from '../components/ui/cards/BalanceCard';
import CryptoItem from '../components/ui/cards/CryptoItemCard';
import BottomNav from '../components/ui/BottonNav';
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";
import { useWalletGuard } from './hooks/useWalletGuard';
import { useProfile } from './hooks/useProfile';
import { useCryptoBalances, toCryptoAsset } from './hooks/useCryptoBalances';

const balanceInfo = {
  profit: "IDRX 123.13",
  growthRate: "5.7%",
  balanceGrowth: "+15%",
};

export default function Home() {
  const { isConnected } = useWalletGuard();
  const { profile } = useProfile();
  const { cryptoAssets, assetsWithBalance, idrxBalance, isLoading } = useCryptoBalances();

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">
      <Header avatar="/profile-pic.svg" username={profile?.username || "Anonymous"} />
      <BalanceCard
        balance={"IDRX " + idrxBalance}
        profit={balanceInfo.profit}
        growthRate={balanceInfo.growthRate}
        balanceGrowth={balanceInfo.balanceGrowth}
      />
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-gray-400 py-4">Loading balances...</div>
      )}

      {/* Assets with Balance */}
      {assetsWithBalance.length > 0 && (
        <div className="mt-4">
          <h2 className="text-gray-400 text-sm mb-2">Your Assets</h2>
          {assetsWithBalance.map((asset) => (
            <CryptoItem key={asset.id} asset={toCryptoAsset(asset)} />
          ))}
        </div>
      )}

      {/* All Available Assets */}
      <div className="mt-4">
        <h2 className="text-gray-400 text-sm mb-2">All Tokens</h2>
        {cryptoAssets.map((asset) => (
          <CryptoItem key={`all-${asset.id}`} asset={toCryptoAsset(asset)} />
        ))}
      </div>
      
      <BottomNav />
    </main>
  );
}

