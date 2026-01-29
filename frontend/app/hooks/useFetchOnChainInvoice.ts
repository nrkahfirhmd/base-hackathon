//  buat fetch data invoice dari smart contract

import { useCallback } from "react";
import { useEthersSigner } from "../hooks/useEthers";
import { Contract } from "ethers";

declare const INVOICE_CONTRACT_ADDRESS: string;
declare const INVOICE_ABI: any[];

export function useFetchOnChainInvoice() {
  const signer = useEthersSigner();

  const fetchInvoice = useCallback(
    async (invoiceId: string) => {
      if (!signer) throw new Error("Wallet not connected");
      const contract = new Contract(INVOICE_CONTRACT_ADDRESS, INVOICE_ABI, signer);
      const data = await contract.getInvoice(invoiceId);
      return data;
    },
    [signer]
  );

  return { fetchInvoice };
}
