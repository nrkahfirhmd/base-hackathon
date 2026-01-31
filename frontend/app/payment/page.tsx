"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useEthersSigner } from "@/app/hooks/useEthers";
import { CHAIN_ID } from "../constant/smartContract";
import { useInvoice } from "@/app/hooks/useInvoice";
import Numpad from "@/components/ui/buttons/NumpadButton";
import InputCard from "@/components/ui/cards/InputCard";
import PaymentConfirmationButton from "@/components/ui/buttons/PaymentConfirmationButton";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signer = useEthersSigner({ chainId: CHAIN_ID });
  const { address: payerAddress } = useAccount();
  const { getInvoice } = useInvoice();

  const invoiceId = searchParams.get("invoiceId");
  const qrAmount = searchParams.get("amount") || "";
  const merchantFromUrl = searchParams.get("recipient") || "";

  const [amountIdr, setAmountIdr] = useState("");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<"USDC" | "IDRX">("USDC");

  // State baru untuk validasi koin yang diminta blockchain
  const [requiredCoin, setRequiredCoin] = useState<"USDC" | "IDRX" | null>(
    null,
  );

  // Efek untuk fetch data jika ini adalah On-Chain Invoice
  useEffect(() => {
    if (invoiceId) {
      getInvoice(invoiceId).then((data) => {
        if (data) {
          setAmountIdr(data.amountIn.toString());
          setMerchantAddress(data.merchant);

          // Deteksi koin yang diminta merchant di blockchain
          // Alamat USDC (testnet/mainnet sesuai contract Anda)
          const isUsdc = data.tokenIn.toLowerCase().includes("0x453f");
          const merchantReq = isUsdc ? "USDC" : "IDRX";

          setRequiredCoin(merchantReq);
          setSelectedCoin(merchantReq); // Set awal agar sinkron dengan invoice
        }
      });
    } else {
      if (qrAmount) setAmountIdr(qrAmount);
      if (merchantFromUrl) setMerchantAddress(merchantFromUrl);
    }
  }, [invoiceId, qrAmount, merchantFromUrl, getInvoice]);

  // Logika Mismatch: Jika ada invoiceId tapi koin pilihan user beda dengan blockchain
  const isMismatch =
    !!invoiceId && !!requiredCoin && selectedCoin !== requiredCoin;

  // Nominal tampil (simulasi konversi sederhana untuk UI)
  const displayAmount = useMemo(() => {
    const val = parseFloat(amountIdr) || 0;
    return selectedCoin === "USDC" ? (val / 15000).toFixed(2) : val.toString();
  }, [amountIdr, selectedCoin]);

  const handleInput = (val: string) => {
    if (val === "." && amountIdr.includes(".")) return;
    if (amountIdr.length >= 12) return;
    setAmountIdr((prev) => prev + val);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-hidden">
      {/* Tombol Back */}
      <div className="absolute top-8 left-6 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-lg transition-colors text-white shadow-lg"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-end p-6 pb-12">
        <div className="mb-auto mt-16 w-full text-center">
          {merchantAddress && (
            <p className="text-blue-400 text-[10px] mb-2 font-mono opacity-70">
              {/* Recipient: {merchantAddress.slice(0, 6)}... */}
              {merchantAddress.slice(-4)}
            </p>
          )}

          <InputCard amount={amountIdr} currency={selectedCoin} />

          {invoiceId && (
            <p className="text-[10px] text-gray-500 mt-1">
              {/* Invoice ID: #{invoiceId} */}
            </p>
          )}
        </div>

        <div className="mb-8 w-full max-w-sm mx-auto">
          <Numpad
            onInput={handleInput}
            onDelete={() => setAmountIdr((p) => p.slice(0, -1))}
          />
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Notifikasi Error jika Currency tidak sesuai */}
          {isMismatch && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl animate-pulse">
              <p className="text-red-400 text-center text-[11px] font-bold">
                Currency Mismatch: Merchant requested {requiredCoin}. Please
                switch back to {requiredCoin} to pay.
              </p>
            </div>
          )}

          <PaymentConfirmationButton
            currency={selectedCoin}
            amount={amountIdr}
            recipient={merchantAddress}
            invoiceId={invoiceId}
            onCurrencyChange={(coin) => setSelectedCoin(coin)}
            signer={signer}
            // Kirim status disabled ke tombol
            disabled={isMismatch}
            onSuccess={() =>
              router.push(
                `/invoice?invoiceId=${invoiceId || ""}&idr=${amountIdr}&coin=${selectedCoin}&to=${merchantAddress}&from=${payerAddress || ""}&status=success`,
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
