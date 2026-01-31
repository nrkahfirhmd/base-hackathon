"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TransactionHistoryCard from "@/components/ui/cards/TransactionHistoryCard";
import { useTransactionHistory } from "@/app/hooks/useTransactionHistory";

export default function TransactionPage() {
  const router = useRouter();
  // Use real data from API via hook (must be inside component)
  const { transactions, isLoading, error, refetch } = useTransactionHistory();

  return (
    <div className="min-h-screen bg-[#1B1E34] p-6 font-sans">
      {/* Header Halaman */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white/5 rounded-lg text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Transaction History
        </h1>
      </div>

      {/* Daftar Transaksi */}
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <p className="text-white/60">Loading transactions...</p>
        ) : error ? (
          <div className="text-red-400">{error} <button onClick={() => refetch()} className="underline ml-2">Retry</button></div>
        ) : transactions.length === 0 ? (
          <p className="text-white/60">No transactions found.</p>
        ) : (
          transactions.map((tx) => <TransactionHistoryCard key={tx.id} transaction={tx} />)
        )}
      </div>
    </div>
  );
}
