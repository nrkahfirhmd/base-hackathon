"use client";

type BalanceCardProps = {
  balance?: string;
  profit?: string;
  growthRate?: string;
  balanceGrowth?: string;
  isLoss?: boolean; // Tambahkan prop ini untuk mendeteksi kerugian
};

const BalanceCard = ({
  balance,
  profit,
  growthRate,
  balanceGrowth,
  isLoss = false, // Default set ke false (untung)
}: BalanceCardProps) => (
  <div className="relative w-full p-4 rounded-2xl bg-linear-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-lg mb-4 overflow-hidden">
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-gray-400 text-lg font-medium">Total balance</h3>
          <h1 className="text-white text-3xl font-bold mt-1">{balance}</h1>
        </div>
        {/* Warna background chip mengikuti kondisi isLoss */}
        <div className="bg-gray-700/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
          {/* Ikon Panah Dinamis */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isLoss ? "#f87171" : "#4ade80"} // Merah jika rugi, Hijau jika untung
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isLoss ? "rotate-180" : ""} // Putar 180 derajat jika rugi (panah bawah)
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span
            className={`text-xs font-bold ${isLoss ? "text-red-400" : "text-green-400"}`}
          >
            {balanceGrowth}
          </span>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-sm">Profit</p>
          {/* Warna teks profit mengikuti kondisi isLoss */}
          <p
            className={`font-semibold ${isLoss ? "text-red-400" : "text-white"}`}
          >
            {profit}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${isLoss ? "text-red-500" : "text-green-500"}`}
          >
            {growthRate}
          </span>
          <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
            <path
              d="M1 25C10 25 15 5 25 15C35 25 40 5 59 1"
              stroke={isLoss ? "#f87171" : "#8b5cf6"} // Garis chart jadi merah jika rugi
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="59"
              cy="1"
              r="3"
              fill={isLoss ? "#f87171" : "#a78bfa"}
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

export default BalanceCard;
