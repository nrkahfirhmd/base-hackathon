import { CryptoAsset } from "@/app/types/crypto";
import Image from "next/image";

const CUSTOM_ICONS: Record<string, string> = {
  'IDRX': '/IDRX-Logo.png',
};

const CryptoItemCard = ({ asset }: { asset: CryptoAsset }) => {
  const getIconUrl = (symbol: string) => {
    if (CUSTOM_ICONS[symbol.toUpperCase()]) {
      return CUSTOM_ICONS[symbol.toUpperCase()];
    }
    const iconSymbol = symbol.toLowerCase();
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${iconSymbol}.png`;
  };

  return (
    <div className="flex items-center justify-between p-6 mb-2 rounded-2xl bg-[#1e1e2d] border border-gray-800">
      <div className="flex items-center gap-3">
        {/* Icon Logo Coin */}
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
          <h4 className="text-white font-medium text-sm">{asset.name}</h4>
          <p className="text-gray-500 text-xs">{asset.symbol}</p>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="hidden sm:block">
        <svg width="40" height="20" viewBox="0 0 40 20">
          <path d="M1 15 L 10 5 L 20 12 L 30 2 L 39 8" stroke="#10b981" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      <div className="text-right">
        <p className="text-white text-sm font-semibold">IDRX {asset.price}</p>
        <p className="text-green-400 text-xs">{asset.change}</p>
      </div>
    </div>
  );
};

export default CryptoItemCard;