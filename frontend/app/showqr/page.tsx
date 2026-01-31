"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useRef, useCallback, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { useEthersSigner } from "@/app/hooks/useEthers"; // Tambahkan ini
import ShowQrOverlay from "@/components/ui/ShowQrOverlay";
import ScanQrNavigation from "../../components/ui/ScanQrNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import { useProfile } from "@/app/hooks/useProfile";
import { useInvoice } from "@/app/hooks/useInvoice";

export default function ShowQrPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const signer = useEthersSigner();
  const { profile } = useProfile();

  // Ambil createInvoice untuk regenerasi on-chain
  const {
    watchInvoiceStatus,
    createInvoice,
    isLoading: isBlockchainLoading,
  } = useInvoice();

  const qrRef = useRef<HTMLDivElement>(null);

  // 1. UBAH invoiceId MENJADI STATE agar bisa diupdate tanpa pindah page
  const [invoiceId, setInvoiceId] = useState(
    searchParams.get("invoiceId") || "",
  );
  const [isExpired, setIsExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const amount = searchParams.get("amount") || "0";
  const currency = (searchParams.get("currency") as "USDC" | "IDRX") || "USDC";

  const [status, setStatus] = useState<"loading" | "waiting">(
    invoiceId ? "waiting" : "loading",
  );

  // 2. FUNGSI UNTUK GENERATE QR BARU (REFRESH)
  const handleRefresh = async () => {
    if (!address || !signer || isRefreshing) return;

    setIsRefreshing(true);
    try {
      console.log("[ShowQrPage] Regenerating invoice on-chain...");

      const res = await createInvoice({
        merchant: address,
        amount: amount,
        tokenType: currency,
        metadata: {
          fiatAmount: amount,
          type: "refresh",
          originalInvoiceId: invoiceId,
        },
      });

      
      if (res.success && res.invoiceId) {
        setInvoiceId(res.invoiceId); // Update state dengan ID baru
        setIsExpired(false); // Reset status expired
        
        // Opsional: Update URL browser tanpa reload agar tetap sinkron
        const newUrl = `/show-qr?invoiceId=${res.invoiceId}&amount=${amount}&currency=${currency}`;
        window.history.replaceState(null, "", newUrl);

        console.log("[ShowQrPage] New Invoice Created:", res.txHash);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      alert("Gagal memperbarui QR. Pastikan wallet terhubung.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Monitoring ID yang sedang aktif (akan restart otomatis jika invoiceId berubah)
    if (!invoiceId || status !== "waiting" || isExpired) return;

    console.log("[ShowQrPage] Monitoring ID:", invoiceId);

    const { stop } = watchInvoiceStatus(invoiceId, {
      onPaid: (data: any) => {
        const payerAddress = data?.payer || "Unknown Payer";
        const targetUrl = `/invoice?invoiceId=${invoiceId}&idr=${amount}&coin=${currency}&to=${address}&from=${payerAddress}&status=success&txHash=${data?.txHash || ''}`;
        router.push(targetUrl);
      },
      onError: (err: any) => {
        console.error("Polling error:", err);
      },
    });

    return () => stop();
  }, [
    invoiceId,
    status,
    watchInvoiceStatus,
    router,
    amount,
    currency,
    address,
    isExpired,
  ]);

  const paymentUrl = invoiceId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/payment?invoiceId=${invoiceId}`
    : "";

  const handleDownload = useCallback(() => {
    if (qrRef.current === null) return;
    toPng(qrRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `DeQRypt-QR-${invoiceId}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error("Gagal download:", err));
  }, [qrRef, invoiceId]);

  return (
    <div className="relative flex flex-col min-h-screen bg-[#1B1E34] font-sans overflow-y-auto">
      <div className="flex flex-col items-center justify-center p-6 pt-24 pb-32">
        <div className="w-full max-w-sm flex flex-col">
          {status === "loading" && (
            <div className="text-center text-white py-10">
              <p className="animate-pulse">Menunggu data invoice...</p>
            </div>
          )}

          {status === "waiting" && paymentUrl && (
            <>
              {/* PENTING: Gunakan key={invoiceId} agar komponen ShowQrOverlay 
                  dan timernya reset total saat ID berubah */}
              <div
                ref={qrRef}
                key={invoiceId}
                className={`transition-all duration-500 ${isExpired || isRefreshing ? "opacity-50 blur-[2px]" : ""}`}
              >
                <ShowQrOverlay
                  amount={amount}
                  paymentUrl={paymentUrl}
                  merchantName={profile.username || "DeQRypt Merchant"}
                  currency={currency}
                  onExpireChange={(val) => setIsExpired(val)}
                  onRefresh={handleRefresh}
                />
              </div>

              <div className="mt-2 min-h-[60px] flex items-center justify-center">
                {isRefreshing ? (
                  <p className="text-white/60 font-bold animate-pulse text-sm uppercase tracking-widest">
                    Minting New Invoice...
                  </p>
                ) : isExpired ? (
                  <div className="w-full animate-in fade-in zoom-in duration-300">
                    <SecondaryButton onClick={handleRefresh}>
                      Refresh QR Code
                    </SecondaryButton>
                  </div>
                ) : (
                  <p className="text-center text-white text-sm animate-pulse font-bold tracking-widest uppercase opacity-70">
                    Menunggu Pembayaran...
                  </p>
                )}
              </div>

              <div className="w-full mt-4">
                <SecondaryButton
                  onClick={handleDownload}
                  disabled={isBlockchainLoading || isExpired || isRefreshing}
                  className={isExpired || isRefreshing ? "opacity-30" : ""}
                >
                  Save QR to Gallery
                </SecondaryButton>
              </div>
            </>
          )}
        </div>
      </div>

      <ScanQrNavigation />
    </div>
  );
}
