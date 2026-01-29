// buat ngambil data invoice dari smart contract di blockchain

import { useCallback } from "react";
import { useEthersSigner } from "../hooks/useEthers";
import { Contract, formatUnits } from "ethers";

// Ganti dengan alamat dan ABI contract Invoice di blockchain Anda
declare const INVOICE_CONTRACT_ADDRESS: string;
declare const INVOICE_ABI: any[];

export function useOnChainInvoice() {
  const signer = useEthersSigner();

  const getInvoice = useCallback(
    async (invoiceId: string) => {
      if (!signer) throw new Error("Wallet not connected");
      const contract = new Contract(INVOICE_CONTRACT_ADDRESS, INVOICE_ABI, signer);
      const data = await contract.getInvoice(invoiceId);
      return {
        invoiceNumber: `#${data.invoiceId}`,
        date: new Date(Number(data.createdAt) * 1000).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric"
        }),
        transferMethod: data.metadata?.tokenSymbol || "USDC",
        from: data.payer,
        to: data.merchant,
        gasFee: "Paid by Network",
        transferAmount: `${data.metadata?.tokenSymbol || "USDC"} ${formatUnits(data.amount, 6)}`,
        total: `${data.metadata?.fiatSymbol || "IDRX"} ${formatUnits(data.metadata?.fiatAmount || 0, 6)}`,
        status: data.status,
      };
    },
    [signer]
  );

  return { getInvoice };
}
