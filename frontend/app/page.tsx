"use client";

import Header from "../components/ui/Header";
import BalanceCard from "../components/ui/cards/BalanceCard";
import CryptoItem from "../components/ui/cards/CryptoItemCard";
import BottomNav from "../components/ui/BottonNav";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useMemo } from "react";
import { useWalletGuard } from "./hooks/useWalletGuard";
import { useProfile } from "./hooks/useProfile";
import { useCryptoBalances, toCryptoAsset } from "./hooks/useCryptoBalances";
import { useTokenRates } from "./hooks/useTokenRates";

export default function Home() {
  const { isConnected } = useWalletGuard();
  const { profile } = useProfile();
  const {
    cryptoAssets,
    assetsWithBalance,
    isLoading: isBalanceLoading,
  } = useCryptoBalances();

  // 1. Ambil daftar simbol unik untuk di-fetch harganya
  const allSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          [...cryptoAssets, ...assetsWithBalance].map((a) =>
            a.symbol.toUpperCase(),
          ),
        ),
      ),
    [cryptoAssets, assetsWithBalance],
  );

  // 2. Gunakan hook rates (mengambil data sekarang dan data 5 menit lalu)
  const {
    rates,
    prevRates,
    isLoading: isRatesLoading,
  } = useTokenRates(allSymbols);

  const portfolioStats = useMemo(() => {
    let totalNow = 0;
    let totalBefore = 0;

    assetsWithBalance.forEach((rawAsset) => {
      const assetData = toCryptoAsset(rawAsset);
      const sym = assetData.symbol.toUpperCase();
      const amount = Number(assetData.price) || 0;

      // Harga Sekarang vs Harga 5 Menit Lalu
      const priceNow = sym === "IDRX" ? 1 : rates[sym]?.price_idr || 0;
      const priceBefore =
        sym === "IDRX" ? 1 : prevRates[sym]?.price_idr || priceNow;

      totalNow += amount * priceNow;
      totalBefore += amount * priceBefore;
    });

    const totalProfit = totalNow - totalBefore;

    // Hitung persentase pertumbuhan dalam 5 menit terakhir
    const growthPercentage =
      totalBefore > 0 ? (totalProfit / totalBefore) * 100 : 0;

    const formatter = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      balance: formatter.format(totalNow),

      profit:
        (totalProfit >= 0 ? "+ " : "- ") +
        "IDRX " +
        formatter.format(Math.abs(totalProfit)),
      // Gunakan 4 desimal untuk growth karena perubahan 5 menit biasanya sangat kecil
      growth: growthPercentage.toFixed(4) + "%",
      rawGrowth: growthPercentage,
    };
  }, [assetsWithBalance, rates, prevRates]);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">
      <Header
        avatar="/profile-pic.svg"
        username={profile?.username || "Anonymous"}
      />

      {/* Balance Card menampilkan total portfolio & profit selisih 5 menit */}
      <BalanceCard
        balance={"IDRX " + portfolioStats.balance}
        profit={portfolioStats.profit}
        growthRate={portfolioStats.growth}
        balanceGrowth={portfolioStats.growth}
      />

      {(isBalanceLoading || isRatesLoading) && (
        <div className="text-center text-gray-400 py-4 italic animate-pulse">
          Syncing market data...
        </div>
      )}

      {/* Assets with Balance */}
      {assetsWithBalance.length > 0 && (
        <div className="mt-4">
          <h2 className="text-gray-400 text-sm mb-2">Your Assets</h2>
          {assetsWithBalance.map((asset) => {
            const assetData = toCryptoAsset(asset);
            return (
              <CryptoItem
                key={asset.id}
                asset={assetData}
                rate={rates[assetData.symbol.toUpperCase()]}
              />
            );
          })}
        </div>
      )}

      {/* All Available Assets (Market Rates) */}
      <div className="mt-4">
        <h2 className="text-gray-400 text-sm mb-2">Market Rates</h2>
        {cryptoAssets.map((asset) => {
          const assetData = toCryptoAsset(asset);
          return (
            <CryptoItem
              key={`all-${asset.id}`}
              asset={assetData}
              rate={rates[assetData.symbol.toUpperCase()]}
            />
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
}
