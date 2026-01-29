// untuk ngebuat invoice di blockchain

import { useCallback } from "react";
import { useEthersSigner } from "../hooks/useEthers";
import { Contract, parseUnits } from "ethers";

// Ganti sama alamat dan ABI contract Invoice nya sesuai blockchain
declare const INVOICE_CONTRACT_ADDRESS: string;
declare const INVOICE_ABI: any[];

export function useCreateOnChainInvoice() {
  const signer = useEthersSigner();

  // Membuat invoice di blockchain
  const createInvoice = useCallback(
    async ({ merchant, amount, fee, metadata }: { merchant: string; amount: string; fee: string; metadata: any }) => {
      if (!signer) throw new Error("Wallet not connected");
      const contract = new Contract(INVOICE_CONTRACT_ADDRESS, INVOICE_ABI, signer);
      const tx = await contract.createInvoice(
        merchant,
        parseUnits(amount, 6), // asumsikan 6 desimal (USDC)
        parseUnits(fee, 6),
        JSON.stringify(metadata)
      );
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "InvoiceCreated");
      const invoiceId = event?.args?.invoiceId;
      return { invoiceId, txHash: receipt.hash };
    },
    [signer]
  );

  return { createInvoice };
}
