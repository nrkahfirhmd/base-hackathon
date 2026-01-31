"use client";

import React from "react";
import { useRouter } from "next/navigation"; // Tambahkan ini
import { useAccount } from "wagmi"; // Tambahkan ini untuk identifikasi address
import { Transaction as Tx } from "@/app/hooks/useTransactionHistory";

const TransactionHistoryCard = ({ transaction }: { transaction: Tx }) => {
  const router = useRouter();
  const { address } = useAccount();
  const isOut = transaction.type === "OUT";

  // Fungsi navigasi ke Invoice
  const handleCardClick = () => {
    // Kita petakan data dari transaction ke query params invoice
    const params = new URLSearchParams({
      invoiceId: transaction.id,
      idr: String(transaction.amount),
      coin: transaction.token,
      txHash: transaction.tx_hash,
      // Jika OUT: kita adalah pengirim, counterparty adalah penerima
      // Jika IN: counterparty adalah pengirim, kita adalah penerima
      from: isOut ? address || "" : transaction.counterparty,
      to: isOut ? transaction.counterparty : address || "",
      status: "success",
      fromHistory: "true", // Flag tambahan untuk skip animasi sukses
    });

    router.push(`/invoice?${params.toString()}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex items-center justify-between p-4 mb-3 rounded-2xl bg-[#1B1E34]/50 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-[#3b2a6e] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            {isOut ? (
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M17 7L7 17M7 17H17M7 17V7" />
                </svg>
              </div>
            )}
          </div>
          <span
            className={`text-[10px] font-bold ${isOut ? "text-red-400" : "text-green-400"}`}
          >
            {isOut ? "OUT" : "IN"}
          </span>
        </div>

        <div>
          <h4 className="text-white font-medium text-base">
            {transaction.counterparty
              ? transaction.counterparty.length > 12
                ? `${transaction.counterparty.slice(0, 6)}...${transaction.counterparty.slice(-4)}`
                : transaction.counterparty
              : "Unknown"}
          </h4>
          <p className="text-gray-400 text-xs">
            {new Date(transaction.date).toLocaleDateString("id-ID")} |{" "}
            {new Date(transaction.date).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="text-right flex flex-col items-end">
        <p className="text-white font-bold text-lg">
          {transaction.amount.toLocaleString("id-ID")}
          <span className="text-[10px] ml-1 text-white/50">
            {transaction.token}
          </span>
        </p>

        {/* Gunakan e.stopPropagation agar klik tombol copy/view tidak memicu navigasi card */}
        <div
          className="flex items-center gap-2 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {transaction.tx_hash && (
            <>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(transaction.tx_hash);
                  alert("Tx copied");
                }}
                className="text-white/40 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
              >
                Copy Hash
              </button>
              <a
                href={transaction.explorer}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 text-[10px] uppercase tracking-widest font-bold"
              >
                View
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryCard;
