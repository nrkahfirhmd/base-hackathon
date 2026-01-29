"use client";

import { QRCodeCanvas } from "qrcode.react";

// Definisikan tipe data props yang diterima dari ShowQrPage
interface ShowQrProps {
  amount: string;
  paymentUrl: string;
  merchantName: string;
}

const ShowQrCard = ({ amount, paymentUrl, merchantName }: ShowQrProps) => {
  return (
    <div
      className="
            bg-linear-to-b from-white/10 from-0% to-[#999999]/3 to-100% 
            backdrop-blur-md 
            rounded-[2.5rem] 
            p-8 
            flex flex-col items-center 
            w-full max-w-sm mx-auto 
            shadow-[0_4px_4px_0_#996BFA]
            mb-10
        "
    >
      {/* 1. Nama Toko Dinamis */}
      <h3 className="text-xl font-bold text-white mb-8 truncate w-full text-center">
        {merchantName}
      </h3>

      <div className="bg-white p-5 rounded-[2rem] mb-8 shadow-lg">
        {/* 2. QR Code Dinamis menggantikan /qr.svg */}
        <QRCodeCanvas
          value={paymentUrl}
          size={220}
          level={"H"} // High error correction agar mudah di-scan
          includeMargin={false}
          imageSettings={{
            src: "/logo.png", // Opsional: taruh logo di tengah QR
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>

      <div className="text-center">
        {/* 3. Nominal Dinamis */}
        <h2 className="text-4xl font-bold text-white mb-6 italic">
          USDC {amount}
        </h2>

        <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">
          Valid Until
        </p>

        <p className="text-3xl font-bold text-white tracking-widest">00 : 56</p>
      </div>
    </div>
  );
};

export default ShowQrCard;
