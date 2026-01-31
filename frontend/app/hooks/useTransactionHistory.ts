import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface Transaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: string | number;
  token: string;
  counterparty: string;
  tx_hash: string;
  explorer: string;
  date: string;
}

interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchTransactionHistory = async () => {
    if (!address) {
      setTransactions([]);
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/history/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: address,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction history: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.data)) {
        // Normalize returned items to our Transaction shape so components can rely on fields
        const normalized = data.data.map((t: any) => ({
          id: String(t.id ?? t.tx_hash ?? t.tx ?? ''),
          type: (t.type || 'OUT') as 'IN' | 'OUT',
          amount: t.amount ?? 0,
          token: t.token ?? t.transfer_method ?? '',
          counterparty: t.counterparty ?? t.to ?? t.from ?? '',
          tx_hash: t.tx_hash ?? t.tx ?? '',
          explorer: t.explorer ?? (t.tx_hash ? `${process.env.NEXT_PUBLIC_EXPLORER_BASE || ''}${t.tx_hash}` : ''),
          date: t.date ?? t.created_at ?? new Date().toISOString(),
        }));

        setTransactions(normalized);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Transaction history error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchTransactionHistory();
    }
  }, [address]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactionHistory,
  };
  
}

export interface AddHistoryParams {
  sender: string;
  receiver: string;
  amount: number;
  token: string;
  tx_hash: string;
}

export function useAddHistory() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addHistory = async (params: AddHistoryParams): Promise<{ success: boolean; data?: any; message?: string }> => {
    setError(null);
    setIsAdding(true);

    try {
      const response = await fetch(`${API_URL}/api/history/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAdding(false);
        return { success: true, data };
      } else {
        const message = data?.detail || data?.message || 'Failed to add history';
        setError(message);
        setIsAdding(false);
        return { success: false, message };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      setIsAdding(false);
      return { success: false, message };
    }
  };

  return { addHistory, isAdding, error, setError };
}
