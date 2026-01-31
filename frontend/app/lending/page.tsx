"use client";

import React, { useEffect, useState } from "react";
import { useLending, ProjectItem, RecommendResponse } from "@/app/hooks/useLending";
import BalanceCard from "@/components/ui/cards/BalanceCard";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import ProjectCard from "./components/ProjectCard";
import DepositModal from "./components/DepositModal";
import WithdrawModal from "./components/WithdrawModal";
import { useRouter } from "next/navigation";
import { useCryptoBalances, toCryptoAsset } from "@/app/hooks/useCryptoBalances";
import { useTokenRates } from "@/app/hooks/useTokenRates";
import { useMemo } from "react";

export default function LendingPage() {
  const {
    recommend,
    fetchProjects,
    deposit,
    withdraw,
    isLoadingRecommend,
    error: lendingError,
  } = useLending();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [rec, setRec] = useState<RecommendResponse | null>(null);

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);

  const router = useRouter();

  const [amountInput, setAmountInput] = useState("1");
  const [token, setToken] = useState("eth");

  // Reuse portfolio hooks to populate BalanceCard
  const { cryptoAssets, assetsWithBalance, isLoading: isBalanceLoading } = useCryptoBalances();

  const allSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          [...cryptoAssets, ...assetsWithBalance].map((a) => a.symbol.toUpperCase()),
        ),
      ),
    [cryptoAssets, assetsWithBalance],
  );

  const { rates, prevRates, isLoading: isRatesLoading } = useTokenRates(allSymbols);

  const portfolioStats = useMemo(() => {
    let totalNow = 0;
    let totalBefore = 0;

    assetsWithBalance.forEach((rawAsset) => {
      const assetData = toCryptoAsset(rawAsset as any);
      const sym = assetData.symbol.toUpperCase();
      const amount = Number(assetData.price) || 0;

      const priceNow = sym === "IDRX" ? 1 : rates[sym]?.price_idr || 0;
      const priceBefore = sym === "IDRX" ? 1 : prevRates[sym]?.price_idr || priceNow;

      totalNow += amount * priceNow;
      totalBefore += amount * priceBefore;
    });

    const totalProfit = totalNow - totalBefore;
    const growthPercentage = totalBefore > 0 ? (totalProfit / totalBefore) * 100 : 0;

    const formatter = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return {
      balance: formatter.format(totalNow),
      profit: (totalProfit >= 0 ? "+ " : "- ") + "IDRX " + formatter.format(Math.abs(totalProfit)),
      growth: growthPercentage.toFixed(2) + "%",
      rawGrowth: growthPercentage,
      isLoss: totalProfit < 0,
    };
  }, [assetsWithBalance, rates, prevRates]);

  useEffect(() => {
    fetchProjects().then((res) => setProjects(res || []));
  }, [fetchProjects]);

  const handleGetRecommendation = async () => {
    const r = await recommend({ amount: Number(amountInput), token });
    setRec(r);
  };

  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Lending</h1>
        <div className="w-8"></div>
      </div>

      {/* Top Section */}
      <section className="grid grid-cols-1 gap-2 mb-6">
        <BalanceCard
          balance={"IDRX " + portfolioStats.balance}
          profit={portfolioStats.profit}
          growthRate={portfolioStats.growth}
          balanceGrowth={portfolioStats.growth}
          isLoss={portfolioStats.isLoss}
        />

        <h2 className="text-gray-400 text-sm mb-4">Quick recommend</h2>

        <div className="relative w-full p-4 rounded-2xl bg-linear-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-lg overflow-hidden">
          <div className="flex gap-3 mb-4">
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-white outline-none border border-white/10"
              placeholder="Amount"
            />

            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              /* Tambahkan bg-[#252A42] supaya select utama terlihat jelas */
              className="w-28 rounded-xl bg-[#252A42] px-3 py-3 text-white outline-none border border-white/10 cursor-pointer"
            >
              {/* Paksa background option jadi gelap agar teks putih terbaca */}
              <option value="eth" className="bg-[#252A42] text-white">
                ETH
              </option>
              <option value="usdc" className="bg-[#252A42] text-white">
                USDC
              </option>
              <option value="idrx" className="bg-[#252A42] text-white">
                IDRX
              </option>
            </select>
          </div>

          <div className="flex gap-3">
            <SecondaryButton
              className="flex-1"
              onClick={() => {
                setAmountInput("1");
                setToken("eth");
                setRec(null);
              }}
            >
              Reset
            </SecondaryButton>

            <PrimaryButton
              onClick={handleGetRecommendation}
              className="flex-1"
              disabled={!!isLoadingRecommend}
            >
              {isLoadingRecommend ? "Loading..." : "Get"}
            </PrimaryButton>
          </div>

          {/* Error / Result */}
          {lendingError && (
            <div className="mt-3 text-sm text-red-400">{lendingError}</div>
          )}

          {rec && (
            <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-semibold text-lg">
                    {rec.protocol} · {rec.token}
                  </div>
                  <div className="text-green-400 font-semibold text-sm mt-1">
                    {rec.apy}% APY
                  </div>
                  {/* TVL display (prefer structured tvl, fallback to parsing reason) */}
                  <div className="text-white/60 text-sm mt-1">
                    {rec.tvl
                      ? `TVL: $${Number(rec.tvl).toLocaleString()}`
                      : (() => {
                          const match = (rec.reason || "").match(/\$[0-9,]+/);
                          return match ? `TVL: ${match[0]}` : null;
                        })()}
                  </div>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    rec.is_safe
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}
                >
                  {rec.is_safe ? "Safe" : "Moderate Risk"}
                </span>
              </div>

              {/* Reason */}
              <p className="text-xs text-white/70 leading-relaxed">
                {rec.reason}
              </p>

              {/* Profit Projection */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "2 mo", value: rec.profit_2months, digit: 6 },
                  { label: "6 mo", value: rec.profit_6months, digit: 6 },
                  { label: "1 yr", value: rec.profit_1year, digit: 4 },
                ].map((p) => (
                  <div key={p.label} className="rounded-lg bg-black/20 p-2">
                    <div className="text-[10px] text-white/50">{p.label}</div>
                    <div className="text-sm font-semibold mt-1">
                      {Number(p.value).toFixed(p.digit)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning */}
              {rec.amount > 1 && (
                <div className="mt-4 rounded-lg bg-yellow-900/30 border border-yellow-700 px-3 py-2 text-xs text-yellow-200">
                  Deposit amount exceeds recommended safe limit.
                </div>
              )}

              {/* CTA */}
              <div className="mt-4 flex gap-3">
                <PrimaryButton
                  className="flex-1"
                  onClick={() => {
                    setSelectedProject({
                      protocol: rec.protocol as any,
                      apy: rec.apy,
                      tvl: rec.tvl || 0,
                      symbol: rec.token as any,
                      pool_id: "recommend",
                    });
                    setShowDepositModal(true);
                  }}
                >
                  Deposit
                </PrimaryButton>

                <SecondaryButton
                  className="flex-1"
                  onClick={() =>
                    navigator.clipboard?.writeText(JSON.stringify(rec))
                  }
                >
                  Copy
                </SecondaryButton>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Positions */}
      <section>
        <h2 className="text-gray-400 text-sm mb-4">Your Lending Positions</h2>

        <div className="grid gap-3 mb-4">
          <div className="flex items-center justify-between rounded-xl border bg-linear-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-lg p-4">
            <div>
              <div className="text-white font-semibold">WETH · Compound V3</div>
              <div className="text-white/60 text-sm">
                Principal: 100 ETH · Profit: 1.93 ETH
              </div>
            </div>

            <PrimaryButton
              onClick={() => {
                setSelectedPositionId(1);
                setShowWithdrawModal(true);
              }}
              fullWidth={false}
            >
              Withdraw
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mb-2">
        <h2 className="text-gray-400 text-sm mb-4">
          Available Lending Projects
        </h2>

        <div className="grid gap-1">
          {projects.map((p) => (
            <ProjectCard
              key={p.pool_id}
              project={p}
              onDeposit={(proj) => {
                setSelectedProject(proj);
                setShowDepositModal(true);
              }}
            />
          ))}
        </div>
      </section>

      {/* Modals */}
      <DepositModal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        project={selectedProject}
        onConfirmDeposit={deposit}
      />

      <WithdrawModal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        positionId={selectedPositionId || undefined}
        onConfirmWithdraw={withdraw}
      />
    </main>
  );
}
