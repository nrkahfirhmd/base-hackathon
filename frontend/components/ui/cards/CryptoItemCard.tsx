import { CryptoAsset } from "@/app/types/crypto";

const CryptoItemCard = ({ asset }: { asset: CryptoAsset }) => (
  <div className="flex items-center justify-between p-6 mb-2 rounded-2xl bg-[#1e1e2d] border border-gray-800 hover:bg-[#252536] transition">
    <div className="flex items-center gap-3">
      {/* Icon Logo Coin */}
      <div className={`w-10 h-10 rounded-full ${asset.color} flex items-center justify-center text-white font-bold opacity-80`}>
        {asset.symbol[0]}
      </div>
      <div>
        <h4 className="text-white font-medium text-sm">{asset.name}</h4>
        <p className="text-gray-500 text-xs">{asset.symbol}</p>
      </div>
    </div>

    {/* Mini Chart (Tengah) */}
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

export default CryptoItemCard;