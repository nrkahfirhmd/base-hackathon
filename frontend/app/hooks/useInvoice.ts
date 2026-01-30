'use client';

import { useCallback, useState } from 'react';
import { useEthersSigner } from './useEthers';
import { Contract, formatUnits, parseUnits } from 'ethers';

const INVOICE_CONTRACT_ADDRESS = '0x9C70555B2582B051Ae2a5F537c7217185E6Be329';
const IDRX_ADDRESS = '0xA62B99a9B85429F5d20dc8E48288f0Cf72aae63B';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const INVOICE_ABI = [
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed merchant, uint256 amount, uint256 fee)',
  'event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount)',
  'event InvoiceCancelled(uint256 indexed invoiceId)',
  'function getInvoice(uint256 invoiceId) view returns (tuple(uint256 invoiceId, address merchant, address payer, uint256 amount, uint256 fee, uint256 createdAt, uint256 paidAt, uint8 status, string metadata))',
  'function totalInvoices() view returns (uint256)',
  'function createInvoice(address merchant, uint256 amount, uint256 fee, string metadata) returns (uint256)',
  'function payInvoice(uint256 invoiceId)',
  'function payInvoiceViaRouter(uint256 invoiceId, address tokenIn, uint256 amountIn, uint256 minOut, uint256 deadline)',
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
  amount: string;
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
 * Hook untuk mengelola invoice on-chain
 * @returns Object berisi state dan fungsi-fungsi untuk invoice
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
   * @param amount - Jumlah dalam IDRX (string, contoh: "1000" = 1000 IDRX)
   * @param fee - Platform fee dalam IDRX (opsional, default "0")
   * @param metadata - Data tambahan dalam format object (opsional)
   * @returns { success: boolean, invoiceId?: string, txHash?: string, error?: string }
   * @example
   * const result = await createInvoice({
   *   merchant: '0x123...',
   *   amount: '15000',
   *   fee: '100',
   *   metadata: { tokenSymbol: 'IDRX', fiatSymbol: 'IDR' }
   * });
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

      try {
        const contract = getContract();
        const tx = await contract.createInvoice(
          merchant,
          parseUnits(amount, 6),
          parseUnits(fee, 6),
          JSON.stringify(metadata)
        );
        const receipt = await tx.wait();

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
   * @param invoiceId - ID invoice (string)
   * @returns InvoiceData | null
   * @example
   * const invoice = await getInvoice('5');
   * console.log(invoice?.amount); // "1000"
   */
  const getInvoice = useCallback(
    async (invoiceId: string): Promise<InvoiceData | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract();
        const data = await contract.getInvoice(invoiceId);

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
          amount: formatUnits(data.amount, 6),
          fee: formatUnits(data.fee, 6),
          createdAt: new Date(Number(data.createdAt) * 1000),
          paidAt: data.paidAt > 0 ? new Date(Number(data.paidAt) * 1000) : null,
          status: Number(data.status) as InvoiceStatus,
          metadata: parsedMetadata,
        };

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
   * @param invoiceId - ID invoice (string)
   * @returns FormattedInvoice | null
   * @example
   * const invoice = await getFormattedInvoice('5');
   * console.log(invoice?.invoiceNumber); // "#5"
   * console.log(invoice?.status); // "Pending" | "Paid" | "Cancelled"
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
        tokenSymbol: metadata.tokenSymbol || 'IDRX',
        fiatAmount: metadata.fiatAmount || invoice.amount,
        fiatSymbol: metadata.fiatSymbol || 'IDR',
      };
    },
    [getInvoice]
  );

  /**
   * Membayar invoice dengan IDRX langsung
   * @param invoiceId - ID invoice yang akan dibayar
   * @returns { success: boolean, txHash?: string, error?: string }
   * @note Pastikan sudah approve IDRX terlebih dahulu dengan approveIDRX()
   * @example
   * await approveIDRX('10000'); // Approve dulu
   * const result = await payInvoice('5');
   */
  const payInvoice = useCallback(
    async (invoiceId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract();
        const tx = await contract.payInvoice(invoiceId);
        const receipt = await tx.wait();

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
   * Membayar invoice menggunakan token lain (swap ke IDRX via router)
   * @param invoiceId - ID invoice
   * @param tokenIn - Alamat token yang digunakan untuk membayar (misal: USDC)
   * @param amountIn - Jumlah token input
   * @param minOut - Minimum IDRX yang diterima (slippage protection)
   * @param deadlineMinutes - Batas waktu transaksi dalam menit (default: 60)
   * @returns { success: boolean, txHash?: string, error?: string }
   * @example
   * const result = await payInvoiceViaRouter({
   *   invoiceId: '5',
   *   tokenIn: '0xUSDC...',
   *   amountIn: '1',
   *   minOut: '15000'
   * });
   */
  const payInvoiceViaRouter = useCallback(
    async ({
      invoiceId,
      tokenIn,
      amountIn,
      minOut,
      deadlineMinutes = 60,
    }: {
      invoiceId: string;
      tokenIn: string;
      amountIn: string;
      minOut: string;
      deadlineMinutes?: number;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const contract = getContract();
        const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

        const tx = await contract.payInvoiceViaRouter(
          invoiceId,
          tokenIn,
          parseUnits(amountIn, 6),
          parseUnits(minOut, 6),
          deadline
        );
        const receipt = await tx.wait();

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
   * Membatalkan invoice (hanya bisa dilakukan oleh merchant)
   * @param invoiceId - ID invoice yang akan dibatalkan
   * @returns { success: boolean, txHash?: string, error?: string }
   * @note Hanya invoice dengan status Pending yang bisa dibatalkan
   * @example
   * const result = await cancelInvoice('5');
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
   * Mengambil total jumlah invoice yang sudah dibuat
   * @returns number - Total invoice
   * @example
   * const total = await getTotalInvoices(); // 5
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
   * @param invoiceId - ID invoice yang akan dimonitor
   * @param options - Opsi polling
   * @param options.onPaid - Callback ketika invoice sudah dibayar
   * @param options.onCancelled - Callback ketika invoice dibatalkan
   * @param options.onError - Callback ketika terjadi error
   * @param options.intervalMs - Interval polling dalam ms (default: 3000)
   * @param options.maxAttempts - Maksimum percobaan polling (default: 100 = 5 menit)
   * @returns { stop: () => void } - Fungsi untuk menghentikan polling
   * @example
   * const { stop } = watchInvoiceStatus('5', {
   *   onPaid: (invoice) => {
   *     console.log('Paid by:', invoice.payer);
   *     router.push('/success');
   *   },
   *   intervalMs: 3000,
   * });
   * // Untuk stop manual: stop();
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
              amount: formatUnits(data.amount, 6),
              fee: formatUnits(data.fee, 6),
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
              amount: formatUnits(data.amount, 6),
              fee: formatUnits(data.fee, 6),
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

  /**
   * Approve IDRX token untuk Invoice contract
   * @param amount - Jumlah IDRX yang diizinkan
   * @returns { success: boolean, txHash?: string, error?: string }
   */
  const approveIDRX = useCallback(
    async (amount: string) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!signer) throw new Error('Wallet not connected');
        const idrxContract = new Contract(IDRX_ADDRESS, ERC20_ABI, signer);
        const tx = await idrxContract.approve(
          INVOICE_CONTRACT_ADDRESS,
          parseUnits(amount, 6)
        );
        const receipt = await tx.wait();

        setIsLoading(false);
        return { success: true, txHash: receipt.hash };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to approve IDRX';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }
    },
    [signer]
  );

  /**
   * Cek allowance IDRX untuk Invoice contract
   * @param owner - Alamat wallet pemilik token
   * @returns string - Jumlah allowance
   */
  const checkAllowance = useCallback(
    async (owner: string) => {
      try {
        if (!signer) throw new Error('Wallet not connected');
        const idrxContract = new Contract(IDRX_ADDRESS, ERC20_ABI, signer);
        const allowance = await idrxContract.allowance(owner, INVOICE_CONTRACT_ADDRESS);
        return formatUnits(allowance, 6);
      } catch {
        return '0';
      }
    },
    [signer]
  );

  return {
    isLoading,
    error,
    setError,

    createInvoice,
    getInvoice,
    getFormattedInvoice,
    payInvoice,
    payInvoiceViaRouter,
    cancelInvoice,
    getTotalInvoices,
    watchInvoiceStatus,
    approveIDRX,
    checkAllowance,

    contractAddress: INVOICE_CONTRACT_ADDRESS,
    idrxAddress: IDRX_ADDRESS,
  };
}
