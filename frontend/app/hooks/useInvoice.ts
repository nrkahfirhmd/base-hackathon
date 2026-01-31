"use client";
import { useCallback, useState } from "react";
import { useEthersSigner } from "./useEthers";
import { Contract, parseUnits, formatUnits } from "ethers";

// 1. ALAMAT KONTRAK UTAMA
const INVOICE_CONTRACT_ADDRESS = "0x3d025AF3c832f477467149739D5aEedF28C90f6C";

// 2. ALAMAT TOKEN (Pastikan keduanya 6 desimal di Base Sepolia)
const USDC_ADDRESS = "0x453f6011493c1Cb55a7cB3182B48931654490bE3";
const IDRX_ADDRESS = "0x1d094171C5c56692c602DcF4580385eeeFEd0A5d";

const INVOICE_ABI = [
  "event InvoiceCreated(uint256 indexed invoiceId, address indexed merchant, address tokenIn, uint256 amountIn)",
  "event InvoicePaid(uint256 indexed invoiceId, address indexed payer)",
  "event InvoiceCancelled(uint256 indexed invoiceId)",
  "function createInvoice(address merchant, address tokenIn, uint256 amountIn, string metadata) returns (uint256)",
  "function payInvoice(uint256 invoiceId)",
  "function getInvoice(uint256 invoiceId) view returns (tuple(uint256 invoiceId, address merchant, address tokenIn, uint256 amountIn, uint8 status, string metadata))",
  "function cancelInvoice(uint256 invoiceId)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

export function useInvoice() {
  const signer = useEthersSigner();
  const [isLoading, setIsLoading] = useState(false);

  const getContract = useCallback(() => {
    if (!signer || !INVOICE_CONTRACT_ADDRESS) return null;
    return new Contract(INVOICE_CONTRACT_ADDRESS, INVOICE_ABI, signer);
  }, [signer]);

  // MERCHANT: Membuat Invoice
  const createInvoice = useCallback(
    async ({ merchant, amount, tokenType = "USDC", metadata = {} }: any) => {
      const contract = getContract();
      if (!contract) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      try {
        const tokenAddress = tokenType === "IDRX" ? IDRX_ADDRESS : USDC_ADDRESS;

        // DISESUAIKAN: Keduanya sekarang menggunakan 6 desimal
        const decimals = 6;
        const amountWei = parseUnits(amount, decimals);

        const tx = await contract.createInvoice(
          merchant,
          tokenAddress,
          amountWei,
          JSON.stringify(metadata),
        );
        const receipt = await tx.wait();

        const event = receipt?.logs?.find((log: any) => {
          try {
            return contract.interface.parseLog(log)?.name === "InvoiceCreated";
          } catch {
            return false;
          }
        });

        if (!event) throw new Error("Event InvoiceCreated tidak ditemukan");

        const parsedLog = contract.interface.parseLog(event);
        const invoiceId = parsedLog?.args?.invoiceId?.toString();

        setIsLoading(false);
        return { success: true, invoiceId, txHash: receipt.hash };
      } catch (err: any) {
        setIsLoading(false);
        console.error("Create Error:", err);
        return { success: false, error: err.message };
      }
    },
    [getContract],
  );

  // FETCH DATA: Mengambil detail Invoice
  const getInvoice = useCallback(
    async (invoiceId: string) => {
      const contract = getContract();
      if (!contract) return null;

      try {
        const data = await contract.getInvoice(invoiceId);
        let metadata = {};
        try {
          metadata = JSON.parse(data.metadata || "{}");
        } catch {
          metadata = {};
        }

        // DISESUAIKAN: Gunakan 6 desimal untuk formatting
        const decimals = 6;

        return {
          invoiceId: data.invoiceId.toString(),
          merchant: data.merchant,
          tokenIn: data.tokenIn,
          amountIn: formatUnits(data.amountIn, decimals),
          status: Number(data.status),
          metadata: metadata as any,
        };
      } catch (err) {
        console.error("Gagal fetch invoice:", err);
        return null;
      }
    },
    [getContract],
  );

  // PAYER: Membayar Invoice
  const payInvoice = useCallback(
    async (invoiceId: string) => {
      setIsLoading(true);

      try {
        const contract = getContract();
        if (!contract || !signer) throw new Error("Wallet tidak terhubung");

        // 1. Ambil info invoice langsung dari blockchain
        const invData = await contract.getInvoice(invoiceId);
        const tokenAddress = invData.tokenIn;
        const amountWei = invData.amountIn;

        // 2. APPROVE Token
        const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

        const appTx = await tokenContract.approve(
          INVOICE_CONTRACT_ADDRESS,
          amountWei,
        );
        await appTx.wait();

        // 3. Eksekusi Pembayaran
        const tx = await contract.payInvoice(invoiceId);
        const receipt = await tx.wait();

        setIsLoading(false);
        return { success: true, txHash: receipt.hash };
      } catch (err: any) {
        console.error("[Payer] Error Detail:", err);
        setIsLoading(false);
        return { success: false, error: err.message };
      }
    },
    [getContract, signer],
  );

  // MONITOR: Polling Status untuk Merchant
  const watchInvoiceStatus = useCallback(
    (invoiceId: string, options: any) => {
      let stopped = false;
      const poll = async () => {
        if (stopped) return;
        try {
          const contract = getContract();
          if (!contract) return;

          const data = await contract.getInvoice(invoiceId);

          if (Number(data.status) === 1) {
            // 1 = PAID

            // MENCARI ALAMAT PAYER: Cari event 'InvoicePaid' di blockchain
            const filter = contract.filters.InvoicePaid(invoiceId);
            const events = await contract.queryFilter(filter, -1000); // Cek 1000 blok terakhir

            const payerAddress =
              events.length > 0
                ? (events[events.length - 1] as any).args.payer
                : "Unknown Payer";

            stopped = true;
            const lastEvent = events.length > 0 ? events[events.length - 1] as any : null;
            const txHash = lastEvent ? lastEvent.transactionHash : undefined;
            options.onPaid?.({ invoiceId, payer: payerAddress, txHash }); // Kirim payer ke UI
            return;
          }

          setTimeout(poll, 3000); // Cek lagi tiap 3 detik
        } catch (err) {
          console.error("[Poll] Error:", err);
          setTimeout(poll, 3000);
        }
      };
      poll();
      return {
        stop: () => {
          stopped = true;
        },
      };
    },
    [getContract],
  );

  return {
    createInvoice,
    payInvoice,
    getInvoice,
    watchInvoiceStatus,
    isLoading,
  };
}
