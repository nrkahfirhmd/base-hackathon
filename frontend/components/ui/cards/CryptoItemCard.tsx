import { CryptoAsset } from "@/app/types/crypto";
import Image from "next/image";

const CUSTOM_ICONS: Record<string, string> = {
  IDRX: "/IDRX-Logo.png",
};

const CryptoItemCard = ({
  asset,
  rate,
  prevRate,
}: {
  asset: CryptoAsset;
  rate?: any;
  prevRate?: any;
}) => {
  const getIconUrl = (symbol: string) => {
    if (CUSTOM_ICONS[symbol.toUpperCase()]) {
      return CUSTOM_ICONS[symbol.toUpperCase()];
    }
    const iconSymbol = symbol.toLowerCase();
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${iconSymbol}.png`;
  };

  // Ambil harga sekarang dan harga sebelumnya (5 menit lalu)
  const priceNow = Number(rate?.price_idr) || 0;
  const priceBefore = Number(prevRate?.price_idr) || priceNow;

  const displayPrice =
    asset.symbol.toUpperCase() === "IDRX"
      ? Number(asset.price)
      : Number(asset.price) * priceNow;

  // Formatter Indonesia (8.323.233,02)
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayPrice);

  /**
   * LOGIKA PERSENTASE 5 MENIT
   */
  const diffPercentage =
    priceBefore > 0 ? ((priceNow - priceBefore) / priceBefore) * 100 : 0;

  // Menentukan teks perubahan (Jika 0 maka tampil +0%)
  let displayChangeText = "+0%";
  if (diffPercentage > 0) {
    displayChangeText = `+${diffPercentage.toFixed(4)}%`;
  } else if (diffPercentage < 0) {
    displayChangeText = `${diffPercentage.toFixed(4)}%`; // Otomatis bawa tanda minus dari toFixed
  }

  return (
    <div className="flex items-center justify-between p-6 mb-2 rounded-2xl bg-[#1e1e2d] border border-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800/30 flex items-center justify-center">
          <Image
            src={getIconUrl(asset.symbol)}
            alt={`${asset.name} logo`}
            width={40}
            height={40}
            className="object-cover"
            unoptimized
          />
        </div>
        <div>
          <h4 className="text-white font-medium text-sm">
            {rate?.name || asset.name}
          </h4>
          <p className="text-gray-500 text-xs">{asset.symbol}</p>
        </div>
      </div>

      <div className="hidden sm:block">
        <svg width="40" height="20" viewBox="0 0 40 20">
          <path
            d="M1 15 L 10 5 L 20 12 L 30 2 L 39 8"
            stroke={diffPercentage < 0 ? "#f87171" : "#10b981"}
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      <div className="text-right">
        <p className="text-white text-sm font-semibold">
          IDRX {formattedPrice}
        </p>
        {/* LOGIKA WARNA: Paksa pengecekan angka secara eksplisit */}
        <p
          className={`${
            diffPercentage < 0 ? "text-red-400" : "text-green-400"
          } text-xs font-bold`}
        >
          {displayChangeText}
        </p>
      </div>
    </div>
  );
};

export default CryptoItemCard;
