"use client";

import React from "react";
import { Transaction as Tx } from "@/app/hooks/useTransactionHistory";

const TransactionHistoryCard = ({ transaction }: { transaction: Tx }) => {
  const isOut = transaction.type === 'OUT';

  const d = new Date(transaction.date);
  const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const explorerUrl = transaction.explorer || (transaction.tx_hash ? `${process.env.NEXT_PUBLIC_EXPLORER_BASE || ''}${transaction.tx_hash}` : '');
  const shortAddr = (addr: string) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transaction.tx_hash || '');
      alert('Tx hash copied');
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 mb-3 rounded-2xl bg-[#1B1E34]/50 border border-white/5 hover:bg-white/5 transition-all">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className={`w-12 h-12 rounded-full bg-[#3b2a6e] flex items-center justify-center shadow-lg`}>
            {isOut ? (
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 7L7 17M7 17H17M7 17V7" /></svg>
              </div>
            )}
          </div>
          <span className={`text-[10px] font-bold ${isOut ? 'text-red-400' : 'text-green-400'}`}>{isOut ? 'OUT' : 'IN'}</span>
        </div>

        {/* Info Nama dan Waktu */}
        <div>
          <h4 className="text-white font-medium text-base">{transaction.counterparty ? (transaction.counterparty.length > 12 ? `${transaction.counterparty.slice(0,6)}...${transaction.counterparty.slice(-4)}` : transaction.counterparty) : 'Unknown'}</h4>
          <p className="text-gray-400 text-xs">{(new Date(transaction.date)).toLocaleDateString('id-ID')} | {(new Date(transaction.date)).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Info Nominal */}
      <div className="text-right flex flex-col items-end">
        <p className="text-gray-400 text-xs font-medium">{transaction.token} {transaction.amount}</p>
        <div className="flex items-center gap-2 mt-1">
          {transaction.tx_hash ? (
            <>
              <button onClick={async () => { await navigator.clipboard.writeText(transaction.tx_hash); alert('Tx copied'); }} className="text-white/60 text-xs mr-2">Copy</button>
              {transaction.explorer ? (
                <a href={transaction.explorer} target="_blank" rel="noreferrer" className="text-blue-400 text-xs">View</a>
              ) : (
                <span className="text-xs text-white/30">No tx</span>
              )}
            </>
          ) : (
            <span className="text-xs text-white/30">No tx</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryCard;
