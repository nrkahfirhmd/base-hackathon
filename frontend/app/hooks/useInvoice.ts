'use client';

import { useCallback, useState } from 'react';
import { useEthersSigner } from './useEthers';
import { Contract, formatEther, parseEther } from 'ethers';

// Contract address - deployed on Base Sepolia
const INVOICE_CONTRACT_ADDRESS = '0xcE52545F8C6e30B4eE54185074029D54f65F5897';

const INVOICE_ABI = [
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed merchant, uint256 amount, uint256 fee)',
  'event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount)',
  'event InvoiceCancelled(uint256 indexed invoiceId)',
  'function getInvoice(uint256 invoiceId) view returns (tuple(uint256 invoiceId, address merchant, address payer, uint256 amount, uint256 fee, uint256 createdAt, uint256 paidAt, uint8 status, string metadata))',
  'function totalInvoices() view returns (uint256)',
  'function createInvoice(address merchant, uint256 amount, uint256 fee, string metadata) returns (uint256)',
  'function payInvoice(uint256 invoiceId) payable',
  'function cancelInvoice(uint256 invoiceId)',
];

export enum InvoiceStatus {
  Pending = 0,
  Paid = 1,
  Cancelled = 2,
}

export interface InvoiceData {
  invoiceId: string;
  merchant: string;
  payer: string;
  amount: string; // dalam ETH (string)
  fee: string;
  createdAt: Date;
  paidAt: Date | null;
  status: InvoiceStatus;
  metadata: Record<string, unknown>;
}

export interface FormattedInvoice {
  invoiceNumber: string;
  date: string;
  merchant: string;
  payer: string;
  amount: string;
  fee: string;
  total: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  tokenSymbol: string;
  fiatAmount: string;
  fiatSymbol: string;
}

/**
 * Hook untuk mengelola invoice on-chain dengan native ETH
 * Tidak perlu approval - user langsung kirim ETH!
 */
export function useInvoice() {
  const signer = useEthersSigner();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    return new Contract(INVOICE_CONTRACT_ADDRESS, INVOICE_ABI, signer);
  }, [signer]);

  /**
   * Membuat invoice baru
   * @param merchant - Alamat wallet penerima pembayaran
   * @param amount - Jumlah dalam ETH (string, contoh: "0.01" = 0.01 ETH)
   * @param fee - Platform fee dalam ETH (opsional, default "0")
   * @param metadata - Data tambahan dalam format object (opsional)
   */
  const createInvoice = useCallback(
    async ({
      merchant,
      amount,
      fee = '0',
      metadata = {},
    }: {
      merchant: string;
      amount: string;
      fee?: string;
      metadata?: Record<string, unknown>;
    }) => {
      setIsLoading(true);
      setError(null);

      console.log('[createInvoice] Input:', { merchant, amount, fee, metadata });

      try {
        const contract = getContract();
        
        // HACKATHON DEMO: Treat input as IDR and convert to small ETH
        // Rate: 1 IDR = 0.0000001 ETH
        // Example: 10,000 IDR -> 0.001 ETH
        // Example: 10 IDR -> 0.000001 ETH
        const scaledAmount = (parseFloat(amount) * 0.0000001).toFixed(18);
        const amountWei = parseEther(scaledAmount);
        const feeWei = parseEther(fee);
        
        console.log('[createInvoice] Scaled for Demo:', { 
          original: amount, 
          scaled: scaledAmount,
          wei: amountWei.toString() 
        });

        const tx = await contract.createInvoice(
          merchant,
          amountWei,
          feeWei,
          JSON.stringify(metadata)
        );
        console.log('[createInvoice] TX sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('[createInvoice] TX confirmed:', receipt.hash);

        const event = receipt.logs
          .map((log: unknown) => {
            try {
              return contract.interface.parseLog(log as { topics: string[]; data: string });
            } catch {
              return null;
            }
          })
          .find((e: { name: string } | null) => e && e.name === 'InvoiceCreated');

        const invoiceId = event?.args?.invoiceId?.toString();
        console.log('[createInvoice] SUCCESS! InvoiceId:', invoiceId);

        setIsLoading(false);
        return { success: true, invoiceId, txHash: receipt.hash };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create invoice';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [getContract]
  );

  /**
   * Mengambil data invoice dari blockchain
   */
  const getInvoice = useCallback(
    async (invoiceId: string): Promise<InvoiceData | null> => {
      setIsLoading(true);
      setError(null);

      console.log('[getInvoice] Fetching invoiceId:', invoiceId);

      try {
        const contract = getContract();
        const data = await contract.getInvoice(invoiceId);
        console.log('[getInvoice] Raw data from blockchain:', {
          invoiceId: data.invoiceId.toString(),
          merchant: data.merchant,
          payer: data.payer,
          amount: data.amount.toString(),
          fee: data.fee.toString(),
          status: data.status,
          metadata: data.metadata,
        });

        let parsedMetadata = {};
        try {
          parsedMetadata = JSON.parse(data.metadata || '{}');
        } catch {
          parsedMetadata = {};
        }

        const invoice: InvoiceData = {
          invoiceId: data.invoiceId.toString(),
          merchant: data.merchant,
          payer: data.payer,
          amount: formatEther(data.amount), // 18 decimals
          fee: formatEther(data.fee),
          createdAt: new Date(Number(data.createdAt) * 1000),
          paidAt: data.paidAt > 0 ? new Date(Number(data.paidAt) * 1000) : null,
          status: Number(data.status) as InvoiceStatus,
          metadata: parsedMetadata,
        };

        console.log('[getInvoice] Parsed invoice:', invoice);
        setIsLoading(false);
        return invoice;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch invoice';
        setError(errorMsg);
        setIsLoading(false);
        return null;
      }
    },
    [getContract]
  );

  /**
   * Mengambil data invoice dalam format siap tampil untuk UI
   */
  const getFormattedInvoice = useCallback(
    async (invoiceId: string): Promise<FormattedInvoice | null> => {
      const invoice = await getInvoice(invoiceId);
      if (!invoice) return null;

      const metadata = invoice.metadata as {
        tokenSymbol?: string;
        fiatSymbol?: string;
        fiatAmount?: string;
      };

      const statusMap = {
        [InvoiceStatus.Pending]: 'Pending' as const,
        [InvoiceStatus.Paid]: 'Paid' as const,
        [InvoiceStatus.Cancelled]: 'Cancelled' as const,
      };

      return {
        invoiceNumber: `#${invoice.invoiceId}`,
        date: invoice.createdAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        merchant: invoice.merchant,
        payer: invoice.payer,
        amount: invoice.amount,
        fee: invoice.fee,
        total: (parseFloat(invoice.amount) + parseFloat(invoice.fee)).toString(),
        status: statusMap[invoice.status],
        tokenSymbol: metadata.tokenSymbol || 'ETH',
        fiatAmount: metadata.fiatAmount || invoice.amount,
        fiatSymbol: metadata.fiatSymbol || 'USD',
      };
    },
    [getInvoice]
  );

  /**
   * Membayar invoice dengan ETH (TANPA APPROVAL!)
   * User langsung kirim ETH dalam satu transaksi
   */
  const payInvoice = useCallback(
    async (invoiceId: string) => {
      setIsLoading(true);
      setError(null);

      console.log('[payInvoice] Paying invoiceId:', invoiceId);

      try {
        const contract = getContract();
        
        // Ambil data invoice untuk tahu jumlah yang harus dibayar
        const invoiceData = await contract.getInvoice(invoiceId);
        const totalAmount = invoiceData.amount + invoiceData.fee;
        console.log('[payInvoice] Invoice data:', {
          amount: invoiceData.amount.toString(),
          fee: invoiceData.fee.toString(),
          totalAmount: totalAmount.toString(),
          totalAmountETH: formatEther(totalAmount),
        });

        // Bayar dengan mengirim ETH langsung
        console.log('[payInvoice] Sending TX with value:', totalAmount.toString());
        const tx = await contract.payInvoice(invoiceId, {
          value: totalAmount,
        });
        console.log('[payInvoice] TX sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('[payInvoice] TX confirmed:', receipt.hash);

        setIsLoading(false);
        return { success: true, txHash: receipt.hash };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to pay invoice';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [getContract]
  );

  /**
   * Membatalkan invoice (hanya merchant)
   */
  const cancelInvoice = useCallback(
    async (invoiceId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract();
        const tx = await contract.cancelInvoice(invoiceId);
        const receipt = await tx.wait();

        setIsLoading(false);
        return { success: true, txHash: receipt.hash };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to cancel invoice';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [getContract]
  );

  /**
   * Mengambil total jumlah invoice
   */
  const getTotalInvoices = useCallback(async () => {
    try {
      const contract = getContract();
      const total = await contract.totalInvoices();
      return Number(total);
    } catch {
      return 0;
    }
  }, [getContract]);

  /**
   * Monitor status invoice secara berkala (polling)
   */
  const watchInvoiceStatus = useCallback(
    (
      invoiceId: string,
      options: {
        onPaid?: (invoice: InvoiceData) => void;
        onCancelled?: (invoice: InvoiceData) => void;
        onError?: (error: string) => void;
        intervalMs?: number;
        maxAttempts?: number;
      } = {}
    ) => {
      const { onPaid, onCancelled, onError, intervalMs = 3000, maxAttempts = 100 } = options;
      let attempts = 0;
      let stopped = false;

      const poll = async () => {
        if (stopped) return;

        try {
          const contract = getContract();
          const data = await contract.getInvoice(invoiceId);
          const status = Number(data.status) as InvoiceStatus;

          if (status === InvoiceStatus.Paid) {
            stopped = true;
            const invoice: InvoiceData = {
              invoiceId: data.invoiceId.toString(),
              merchant: data.merchant,
              payer: data.payer,
              amount: formatEther(data.amount),
              fee: formatEther(data.fee),
              createdAt: new Date(Number(data.createdAt) * 1000),
              paidAt: new Date(Number(data.paidAt) * 1000),
              status,
              metadata: JSON.parse(data.metadata || '{}'),
            };
            onPaid?.(invoice);
            return;
          }

          if (status === InvoiceStatus.Cancelled) {
            stopped = true;
            const invoice: InvoiceData = {
              invoiceId: data.invoiceId.toString(),
              merchant: data.merchant,
              payer: data.payer,
              amount: formatEther(data.amount),
              fee: formatEther(data.fee),
              createdAt: new Date(Number(data.createdAt) * 1000),
              paidAt: null,
              status,
              metadata: JSON.parse(data.metadata || '{}'),
            };
            onCancelled?.(invoice);
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            stopped = true;
            onError?.('Polling timeout: max attempts reached');
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (err) {
          if (!stopped) {
            onError?.(err instanceof Error ? err.message : 'Failed to fetch invoice status');
          }
        }
      };

      poll();

      return {
        stop: () => {
          stopped = true;
        },
      };
    },
    [getContract]
  );

  return {
    isLoading,
    error,
    setError,

    createInvoice,
    getInvoice,
    getFormattedInvoice,
    payInvoice,
    cancelInvoice,
    getTotalInvoices,
    watchInvoiceStatus,

    contractAddress: INVOICE_CONTRACT_ADDRESS,
  };
}
