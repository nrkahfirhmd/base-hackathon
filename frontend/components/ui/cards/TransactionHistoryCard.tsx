"use client";

import React from "react";
import Image from "next/image";

export interface Transaction {
  id: string;
  name: string;
  date: string;
  time: string;
  amountIdr: string;
  amountCrypto: string;
  currency: "BTC" | "ETH";
  type: "in" | "out";
  status: "Succeed" | "Pending" | "Failed";
}

const TransactionHistoryCard = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  // Logika warna status
  const statusColors = {
    Succeed: "text-green-500",
    Pending: "text-yellow-400",
    Failed: "text-red-500",
  };

  return (
    <div className="flex items-center justify-between p-4 mb-3 rounded-2xl bg-[#1B1E34]/50 border border-white/5 hover:bg-white/5 transition-all">
      <div className="flex items-center gap-4">
        {/* Ikon Transaksi dengan Status */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-12 h-12 rounded-full bg-[#3b2a6e] flex items-center justify-center shadow-lg`}
          >
            {transaction.type === "out" ? (
              /* Panah Serong Kanan Atas (Uang Keluar) */
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
              /* Panah Serong Kiri Bawah (Uang Masuk) */
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
            className={`text-[10px] font-bold ${statusColors[transaction.status]}`}
          >
            {transaction.status}
          </span>
        </div>

        {/* Info Nama dan Waktu */}
        <div>
          <h4 className="text-white font-medium text-base">
            {transaction.name}
          </h4>
          <p className="text-gray-400 text-xs">
            {transaction.date} | {transaction.time}
          </p>
        </div>
      </div>

      {/* Info Nominal */}
      <div className="text-right flex flex-col items-end">
        <p className="text-gray-400 text-xs font-medium">
          IDRX {transaction.amountIdr}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-white text-sm font-bold">
            {transaction.amountCrypto}
          </span>
          <Image
            src={transaction.currency === "BTC" ? "/btc.svg" : "/eth.svg"}
            alt={transaction.currency}
            width={16}
            height={16}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryCard;
