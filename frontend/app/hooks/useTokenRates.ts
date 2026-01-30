"use client";

import { useState, useEffect, useCallback } from "react";

// Interface sesuai dengan response body dari API DeQRypt
export interface TokenRate {
  symbol: string;
  name: string;
  price_idr: number;
  price_usd: number;
  change_24h: number;
  icon: string;
  last_updated: number;
}

export interface RatesData {
  [symbol: string]: TokenRate;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useTokenRates(symbols: string[] = ["ETH", "USDC", "IDRX"]) {
  const [rates, setRates] = useState<RatesData>({});
  const [prevRates, setPrevRates] = useState<RatesData>({}); // Snapshot harga 5 menit lalu
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    if (!symbols || symbols.length === 0 || !API_URL) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/tokens/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });

      const data = await response.json();

      if (data.status === "success" && data.data) {
        const ratesMap: RatesData = {};
        data.data.forEach((item: TokenRate) => {
          ratesMap[item.symbol.toUpperCase()] = item;
        });

        setRates((currentState) => {
          if (Object.keys(currentState).length > 0) {
            // Jika sudah ada data sebelumnya, simpan ke prevRates
            setPrevRates(currentState);
          } else {
            // Jika ini fetch pertama (Inisialisasi), prevRates = rates baru
            setPrevRates(ratesMap);
          }
          return ratesMap;
        });

        setError(null);
      } else {
        setError(data.message || "Gagal mengambil data rates");
      }
    } catch (err: any) {
      console.error("Fetch rates error:", err.message);
      setError("Network error: Cek koneksi backend");
    } finally {
      setIsLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchRates();

    const interval = setInterval(fetchRates, 60000);

    return () => clearInterval(interval);
  }, [fetchRates]);

  return { rates, prevRates, isLoading, error, refetch: fetchRates };
}
