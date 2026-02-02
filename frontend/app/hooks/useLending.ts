"use client";

import { useCallback, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types sesuai contoh respons dari backend
export interface RecommendResponse {
  protocol: string;
  token: string;
  apy: number;
  reason: string;
  is_safe: boolean;
  amount: number;
  profit_2months: number;
  profit_6months: number;
  profit_1year: number;
  tvl?: number;
}

export interface ProjectItem {
  protocol: string;
  apy: number;
  tvl: number;
  symbol: string;
  pool_id: string;
}

export interface DepositPayload {
  protocol: string;
  token: string;
  amount: number;
  wallet_address: string;
  tx_hash?: string; // Transaction hash from client-side deposit
}


export interface DepositResponse {
  status: string;
  protocol: string;
  amount: number;
  tx_hash?: string;
  explorer_url?: string;
  message?: string;
}

export interface InfoResponse {
  wallet_address: string;
  positions: string[];
  total_deposited: number;
  total_current_profit: number;
}

export interface WithdrawPayload {
  id: number;
  token: string;
  amount: number;
  tx_hash?: string; // Transaction hash from client-side execution
  wallet_address?: string; // User wallet address
}


export interface WithdrawResponse {
  status: string;
  protocol: string;
  tx_hash?: string;
  explorer_url?: string;
  withdraw_time?: string;
  principal?: number;
  current_profit?: number;
  current_profit_pct?: number;
  withdrawn?: number;
  total_received?: number;
  remaining_amount?: number;
  message?: string;
}


export interface SyncResponse {
  status: string;
  synced_count: number;
  data: InfoResponse;
}

export function useLending() {
  const [isLoadingRecommend, setIsLoadingRecommend] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingDeposit, setIsLoadingDeposit] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommend = useCallback(
    async ({ amount, token }: { amount: number; token: string }) => {
      if (!API_URL) throw new Error("API URL not configured");

      setIsLoadingRecommend(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/lending/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, token }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Gagal mengambil rekomendasi");
        return data as RecommendResponse;
      } catch (err: any) {
        setError(err?.message || String(err));
        return null;
      } finally {
        setIsLoadingRecommend(false);
      }
    },
    [],
  );

  const fetchProjects = useCallback(async () => {
    if (!API_URL) throw new Error("API URL not configured");

    setIsLoadingProjects(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/lending/project`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Gagal mengambil project lending");
      return data as ProjectItem[];
    } catch (err: any) {
      setError(err?.message || String(err));
      return [] as ProjectItem[];
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  // useLending.ts
  // useLending.ts (Potongan fungsi deposit)

  const deposit = useCallback(async (payload: DepositPayload) => {
    setIsLoadingDeposit(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/lending/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Jika backend mengirimkan Error 524 atau 400 (Unsupported Token)
      if (!res.ok) {
        throw new Error(data.detail || data.message || `Error ${res.status}`);
      }

      return data as DepositResponse;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoadingDeposit(false);
    }
  }, []);
  const getInfo = useCallback(async (address: string) => {
    if (!API_URL) throw new Error("API URL not configured");
    if (!address) throw new Error("Address is required");

    setIsLoadingInfo(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/lending/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Gagal mengambil info lending");
      return data as InfoResponse;
    } catch (err: any) {
      setError(err?.message || String(err));
      return null;
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  const withdraw = useCallback(async (payload: WithdrawPayload) => {
    if (!API_URL) throw new Error("API URL not configured");

    setIsLoadingWithdraw(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/lending/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal withdraw");
      return data as WithdrawResponse;
    } catch (err: any) {
      setError(err?.message || String(err));
      return null;
    } finally {
      setIsLoadingWithdraw(false);
    }
  }, []);

  const syncPositions = useCallback(async (walletAddress: string) => {
    if (!API_URL) throw new Error("API URL not configured");
    if (!walletAddress) throw new Error("Wallet address is required");

    setIsLoadingSync(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/lending/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Gagal sync posisi lending");
      return data as SyncResponse;
    } catch (err: any) {
      setError(err?.message || String(err));
      return null;
    } finally {
      setIsLoadingSync(false);
    }
  }, []);

  return {
    // Actions
    recommend,
    fetchProjects,
    deposit,
    getInfo,
    withdraw,
    syncPositions,

    // States
    isLoadingRecommend,
    isLoadingProjects,
    isLoadingDeposit,
    isLoadingInfo,
    isLoadingWithdraw,
    isLoadingSync,
    error,
  };
}
