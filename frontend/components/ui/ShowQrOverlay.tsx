"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface ShowQrProps {
  amount: string;
  paymentUrl: string;
  merchantName: string;
  currency: string;
  onExpireChange: (expired: boolean) => void;
  onRefresh: () => void;
}

const ShowQrCard = ({
  amount,
  paymentUrl,
  merchantName,
  currency,
  onExpireChange,
  onRefresh,
}: ShowQrProps) => {
  // 1. Ubah durasi menjadi 120 detik (2 Menit)
  const [timeLeft, setTimeLeft] = useState(120);
  const isExpired = timeLeft <= 0;

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpireChange(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpireChange]);

  // 2. Perbarui logic format agar mendukung menit
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? "0" : ""}${m} : ${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2.5rem]">
      <div
        className={`
          bg-linear-to-b from-white/10 from-0% to-[#999999]/3 to-100% 
          backdrop-blur-md rounded-[2.5rem] p-8 flex flex-col items-center 
          w-full max-w-sm mx-auto shadow-[0_4px_4px_0_#996BFA] mb-10
          transition-all duration-500
          ${isExpired ? "blur-xl opacity-50 pointer-events-none scale-95" : "blur-0 opacity-100"}
        `}
      >
        {/* 1. Nama Toko */}
        <h3 className="text-3xl font-bold text-white mb-8 truncate w-full text-center">
          {merchantName}
        </h3>

        {/* 2. QR Code */}
        <div className="bg-white p-5 rounded-[2rem] mb-8 shadow-lg">
          <QRCodeCanvas
            value={paymentUrl}
            size={220}
            level={"H"}
            includeMargin={false}
            imageSettings={{
              src: "/Logo.png",
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>

        <div className="text-center">
          {/* 3. Nominal Dinamis */}
          <h2 className="text-4xl font-bold text-white mb-6 italic">
            {currency} {amount}
          </h2>

          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Valid Until
          </p>

          <p
            className={`text-3xl font-bold tracking-widest transition-colors ${
              timeLeft < 10 ? "text-red-500 animate-pulse" : "text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShowQrCard;
