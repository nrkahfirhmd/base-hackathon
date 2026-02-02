"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  useLending,
  ProjectItem,
  RecommendResponse,
  InfoResponse,
} from "@/app/hooks/useLending";
import { useAccount } from "wagmi";
import BalanceCard from "@/components/ui/cards/BalanceCard";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import ProjectCard from "./components/ProjectCard";
import DepositModal from "./components/DepositModal";
import WithdrawModal from "./components/WithdrawModal";
import { useRouter } from "next/navigation";
import {
  useCryptoBalances,
  toCryptoAsset,
} from "@/app/hooks/useCryptoBalances";
import { useTokenRates } from "@/app/hooks/useTokenRates";

// Import Komponen UI Baru
import RecommendationResult from "./components/RecommendationResult";
import GetRecommendationCard from "./components/GetRecommendationCard";

export default function LendingPage() {
  const {
    recommend,
    fetchProjects,
    deposit,
    getInfo,
    withdraw,
    isLoadingRecommend,
    isLoadingInfo,
  } = useLending();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [rec, setRec] = useState<RecommendResponse | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [selectedPositionToken, setSelectedPositionToken] = useState<string>("mUSDC");
  const [selectedPositionAmount, setSelectedPositionAmount] = useState<number>(0);

  const router = useRouter();

  // State untuk logic pencarian
  const [amountInput, setAmountInput] = useState("1");
  const [token, setToken] = useState("eth");
  const [projectFilter, setProjectFilter] = useState<"all" | "usdc" | "eth">("all");

  const [info, setInfo] = useState<InfoResponse | null>(null);
  const { address } = useAccount();

  // Fetch data posisi lending user
  useEffect(() => {
    if (!address) {
      setInfo(null);
      return;
    }
    (async () => {
      const res = await getInfo(address as string);
      setInfo(res);
    })();
  }, [address, getInfo]);

  const { cryptoAssets, assetsWithBalance } = useCryptoBalances();

  const allSymbols = useMemo(
    () => Array.from(new Set([...cryptoAssets, ...assetsWithBalance].map((a) => a.symbol.toUpperCase()))),
    [cryptoAssets, assetsWithBalance]
  );

  const { rates, prevRates } = useTokenRates(allSymbols);

  // Kalkulasi statistik portfolio untuk BalanceCard
  const portfolioStats = useMemo(() => {
    let totalNow = 0;
    let totalBefore = 0;

    assetsWithBalance.forEach((rawAsset) => {
      const assetData = toCryptoAsset(rawAsset);
      const sym = assetData.symbol.toUpperCase();
      const amount = Number(assetData.price) || 0;
      const priceNow = sym === "IDRX" ? 1 : rates[sym]?.price_idr || 0;
      const priceBefore = sym === "IDRX" ? 1 : prevRates[sym]?.price_idr || priceNow;

      totalNow += amount * priceNow;
      totalBefore += amount * priceBefore;
    });

    const totalProfit = totalNow - totalBefore;
    const growthPercentage = totalBefore > 0 ? (totalProfit / totalBefore) * 100 : 0;
    const formatter = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      balance: formatter.format(totalNow),
      profit: (totalProfit >= 0 ? "+ " : "- ") + "IDRX " + formatter.format(Math.abs(totalProfit)),
      growth: growthPercentage.toFixed(2) + "%",
      isLoss: totalProfit < 0,
    };
  }, [assetsWithBalance, rates, prevRates]);

  useEffect(() => {
    fetchProjects().then((res) => setProjects(res || []));
  }, [fetchProjects]);

  // Handler pencarian AI
  const handleGetRecommendation = async (symbolFromCard?: string) => {
    const selectedToken = symbolFromCard ? symbolFromCard.toLowerCase() : token;
    if (symbolFromCard) setToken(selectedToken);

    const r = await recommend({
      amount: Number(amountInput),
      token: selectedToken,
    });
    setRec(r);
  };

  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 active:opacity-50 transition-opacity"
        >
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
        <h1 className="text-xl font-bold uppercase tracking-tight">Lending</h1>
        <div className="w-8"></div>
      </div>

      {/* Top Section: Balance & AI Search */}
      <section className="flex flex-col gap-6 mb-8">
        <BalanceCard
          balance={"IDRX " + portfolioStats.balance}
          profit={portfolioStats.profit}
          growthRate={portfolioStats.growth}
          balanceGrowth={portfolioStats.growth}
          isLoss={portfolioStats.isLoss}
        />

        {/* --- UI BARU DENGAN EFEK SLIDE DARI BALIK CARD --- */}
        <section className="flex flex-col">
          {/* Card Input (Lapisan Atas) */}
          <div className="relative z-20">
            <GetRecommendationCard
              onSearch={handleGetRecommendation}
              isLoading={isLoadingRecommend} // Tambahkan baris ini
            />
          </div>

          {/* Card Result (Lapisan Bawah / Slide Out) */}
          <RecommendationResult
            rec={rec}
            onDeposit={(proj) => {
              setSelectedProject(proj);
              setShowDepositModal(true);
            }}
          />
        </section>
      </section>

      {/* Your Positions Section */}
      <section className="mb-8">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
          Your Lending Positions
        </h2>
        {isLoadingInfo ? (
          <div className="text-center text-gray-500 py-4 animate-pulse italic">
            Syncing positions...
          </div>
        ) : info?.positions?.length ? (
          <div className="grid gap-3">
            {info.positions.map((pos, idx) => {
              const parsed = typeof pos === "string" ? JSON.parse(pos) : pos;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-gradient-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 p-4 shadow-lg"
                >
                  <div>
                    <div className="text-white font-bold">
                      {parsed.token || parsed.symbol} · {parsed.protocol}
                    </div>
                    <div className="text-white/40 text-xs mt-1 italic">
                      Principal: {parsed.principal || 0} · Profit:{" "}
                      {parsed.profit || 0}
                    </div>
                  </div>
                  <PrimaryButton
                    onClick={() => {
                      setSelectedPositionId(parsed.id || idx);
                      setSelectedPositionToken(parsed.token || "mUSDC");
                      setSelectedPositionAmount(parsed.principal || 0);
                      setShowWithdrawModal(true);
                    }}
                    fullWidth={false}
                    className="h-10 text-xs"
                  >
                    Withdraw
                  </PrimaryButton>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-white/20 italic">
            No active positions found
          </div>
        )}
      </section>

      {/* Available Projects Section */}
      <section className="mb-2">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
          Market Opportunities
        </h2>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {["all", "usdc", "eth"].map((f) => (
            <button
              key={f}
              onClick={() => setProjectFilter(f as any)}
              className={`py-2 px-6 rounded-2xl text-xs font-bold transition-all border ${projectFilter === f ? "bg-gradient-to-b from-[#4338ca] to-[#7c3aed] border-transparent shadow-lg shadow-indigo-500/20" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-2">
          {projects
            .filter((p) => {
              if (projectFilter === "all") return true;
              const syms = p.symbol
                .toLowerCase()
                .split("-")
                .map((s) => s.trim());
              return projectFilter === "usdc"
                ? syms.includes("usdc")
                : syms.includes("eth") || syms.includes("weth");
            })
            .map((p) => (
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
        tokenSymbol={selectedPositionToken}
        currentAmount={selectedPositionAmount}
        onConfirmWithdraw={withdraw}
      />
    </main>
  );
}