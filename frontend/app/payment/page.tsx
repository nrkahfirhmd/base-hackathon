"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi"; // 1. Import useAccount
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
  const { address: payerAddress } = useAccount(); // 2. Ambil alamat Payer (Pengirim)
  const { getInvoice } = useInvoice();

  const invoiceId = searchParams.get("invoiceId");
  const qrAmount = searchParams.get("amount") || "";
  const merchantFromUrl = searchParams.get("recipient") || "";

  const [amountIdr, setAmountIdr] = useState("");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<"USDC" | "IDRX">("USDC");

  // Efek untuk fetch data jika ini adalah On-Chain Invoice
  useEffect(() => {
    if (invoiceId) {
      getInvoice(invoiceId).then((data) => {
        if (data) {
          // Ambil nominal asli dari blockchain
          setAmountIdr(data.amountIn.toString());
          setMerchantAddress(data.merchant);

          // OTOMATIS: Set koin sesuai keinginan Merchant di Invoice
          // Alamat USDC: 0x453f...
          const isUsdc = data.tokenIn.toLowerCase().includes("0x453f");
          setSelectedCoin(isUsdc ? "USDC" : "IDRX");
        }
      });
    } else {
      if (qrAmount) setAmountIdr(qrAmount);
      if (merchantFromUrl) setMerchantAddress(merchantFromUrl);
    }
  }, [invoiceId, qrAmount, merchantFromUrl, getInvoice]);

  // Nominal tampil (simulasi konversi sederhana untuk UI)
  const displayAmount = useMemo(() => {
    const val = parseFloat(amountIdr) || 0;
    // Jika USDC, tampilkan asumsi kurs (IDR 15k), jika IDRX tampilkan nominal asli
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
              Recipient: {merchantAddress.slice(0, 6)}...
              {merchantAddress.slice(-4)}
            </p>
          )}

          <InputCard amount={amountIdr} />

          {invoiceId && (
            <p className="text-[10px] text-gray-500 mt-1">
              Invoice ID: #{invoiceId}
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
          <PaymentConfirmationButton
            currency={selectedCoin}
            amount={amountIdr}
            recipient={merchantAddress}
            invoiceId={invoiceId}
            onCurrencyChange={(coin) => setSelectedCoin(coin)}
            signer={signer}
            onSuccess={() =>
              // 3. Tambahkan parameter &from=${payerAddress} ke URL redirect
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
