"use client";

import { useTokenRates } from "@/app/hooks/useTokenRates";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";

export default function TokenTestPage() {
  // Kita tes dengan simbol yang ada di hook (default: ETH, USDC, IDRX)
  const { rates, isLoading, error, refetch } = useTokenRates([
    "ETH",
    "USDC",
    "IDRX",
  ]);

  return (
    <div className="min-h-screen bg-[#1B1E34] text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 border-b border-white/10 pb-4">
          <h1 className="text-2xl font-bold text-blue-400">Hook Debugger</h1>
          <p className="text-gray-400 text-sm">Testing: useTokenRates.ts</p>
        </header>

        {/* Status Section */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <span className="text-xs text-gray-500 uppercase block mb-1">
              Status
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`}
              ></div>
              <span className="font-bold">
                {isLoading ? "Fetching..." : "Idle / Ready"}
              </span>
            </div>
          </div>
          <div className="bg-black/20 p-4 rounded-xl border border-white/5">
            <span className="text-xs text-gray-500 uppercase block mb-1">
              Errors
            </span>
            <span
              className={error ? "text-red-400 font-bold" : "text-green-400"}
            >
              {error || "None"}
            </span>
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden mb-6">
          <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <span className="text-sm font-semibold italic text-gray-300">
              Raw Hook Data (Record Map)
            </span>
            <button
              onClick={() => refetch()}
              className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-md transition-colors"
            >
              Manual Refetch
            </button>
          </div>

          <pre className="p-6 text-[11px] text-green-400 overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto font-mono">
            {Object.keys(rates).length > 0
              ? JSON.stringify(rates, null, 2)
              : "// No data available. Is your API route running?"}
          </pre>
        </div>

        {/* Visual Card Test */}
        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest">
            Visual Test
          </h2>
          <div className="space-y-3">
            {Object.values(rates).map((token) => (
              <div
                key={token.symbol}
                className="flex items-center justify-between p-4 bg-[#1e1e2d] rounded-xl border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold">{token.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {token.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">
                    IDRX {token.price_idr.toLocaleString("id-ID")}
                  </div>
                  <div
                    className={`text-[10px] ${token.change_24h >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {token.change_24h}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-12 text-center text-[10px] text-gray-600 uppercase tracking-tighter">
          DeQRypt System Diagnostics • 2026
        </footer>
      </div>
    </div>
  );
}
