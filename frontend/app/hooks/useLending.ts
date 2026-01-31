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
  total_received?: number;
  message?: string;
}

export function useLending() {
  const [isLoadingRecommend, setIsLoadingRecommend] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingDeposit, setIsLoadingDeposit] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false);
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
        if (!res.ok) throw new Error(data.message || "Gagal mengambil rekomendasi");
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
      if (!res.ok) throw new Error(data.message || "Gagal mengambil project lending");
      return data as ProjectItem[];
    } catch (err: any) {
      setError(err?.message || String(err));
      return [] as ProjectItem[];
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const deposit = useCallback(
    async (payload: DepositPayload) => {
      if (!API_URL) {
        const msg = "API URL not configured. Set NEXT_PUBLIC_API_URL in .env.local";
        setError(msg);
        console.error("useLending.deposit:", msg);
        return null;
      }

      setIsLoadingDeposit(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/lending/deposit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get("content-type") || "";

        // If success, try to parse JSON (or fallback to text)
        if (res.ok) {
          try {
            const data = await res.json();
            return data as DepositResponse;
          } catch {
            const text = await res.text();
            return { status: "success", protocol: payload.protocol, amount: payload.amount, tx_hash: undefined, explorer_url: undefined, message: text } as DepositResponse;
          }
        }

        // Non-OK response: parse JSON if available, otherwise read text
        let errMessage = `HTTP ${res.status}`;
        try {
          if (contentType.includes("application/json")) {
            const data = await res.json();
            errMessage = data.message || JSON.stringify(data);
          } else {
            const text = await res.text();
            errMessage = text || errMessage;
          }
        } catch (parseErr) {
          console.error("Failed to parse error body:", parseErr);
        }

        console.error("Deposit failed:", res.status, errMessage);
        setError(`Deposit failed: ${errMessage}`);

        return {
          status: "failed",
          protocol: payload.protocol,
          amount: payload.amount,
          message: errMessage,
        } as DepositResponse;
      } catch (err: any) {
        console.error("Deposit failed (network):", err);
        setError(err?.message || String(err));
        return null;
      } finally {
        setIsLoadingDeposit(false);
      }
    },
    [],
  );

  const getInfo = useCallback(async (address: string) => {
    if (!API_URL) throw new Error("API URL not configured");
    if (!address) throw new Error("Address is required");

    setIsLoadingInfo(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/lending/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengambil info lending");
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

  return {
    // Actions
    recommend,
    fetchProjects,
    deposit,
    getInfo,
    withdraw,

    // States
    isLoadingRecommend,
    isLoadingProjects,
    isLoadingDeposit,
    isLoadingInfo,
    isLoadingWithdraw,
    error,
  };
}
