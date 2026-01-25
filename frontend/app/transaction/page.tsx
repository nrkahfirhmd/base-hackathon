"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TransactionHistoryCard, {
  Transaction,
} from "@/components/ui/cards/TransactionHistoryCard";

const mockTransactions: Transaction[] = [
  {
    id: "1",
    name: "Dzikri Basyril Muminin",
    date: "28 January 2026",
    time: "19:37",
    amountIdr: "5.092,92",
    amountCrypto: "0,023",
    currency: "BTC",
    type: "out",
    status: "Failed",
  },
  {
    id: "2",
    name: "Dzikri Basyril Muminin",
    date: "28 January 2026",
    time: "19:37",
    amountIdr: "5.092,92",
    amountCrypto: "0,023",
    currency: "BTC",
    type: "out",
    status: "Succeed",
  },
  {
    id: "3",
    name: "Dzikri Basyril Muminin",
    date: "28 January 2026",
    time: "19:37",
    amountIdr: "5.092,92",
    amountCrypto: "0,023",
    currency: "ETH",
    type: "out",
    status: "Pending",
  },
  {
    id: "4",
    name: "Dzikri Basyril Muminin",
    date: "28 January 2026",
    time: "19:37",
    amountIdr: "5.092,92",
    amountCrypto: "0,023",
    currency: "BTC",
    type: "in",
    status: "Succeed",
  },
];

export default function TransactionPage() {
  const router = useRouter();

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
        {mockTransactions.map((tx) => (
          <TransactionHistoryCard key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  );
}
