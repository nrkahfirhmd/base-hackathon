const BalanceCard = () => (
  <div className="relative w-full p-5 rounded-3xl bg-linear-to-br from-[#2b2b3d] to-[#1a1a24] border border-gray-800 shadow-lg mb-6 overflow-hidden">
    {/* Efek Blur/Glow Background */}
    <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
    <div className="absolute top-10 right-10 w-24 h-24 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>

    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-gray-400 text-lg font-medium">Total balance</h3>
          <h1 className="text-white text-3xl font-bold mt-1">IDRX 452.57</h1>
        </div>
        <div className="bg-gray-700/50 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
           {/* Icon Up Arrow */}
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
           <span className="text-green-400 text-xs font-bold">+15%</span>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-sm">Profit</p>
          <p className="text-white font-semibold">IDRX 123.13</p>
        </div>
        {/* Simple SVG Chart Line */}
        <div className="flex items-center gap-2">
            <span className="text-green-500 text-xs">5.7%</span>
            <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
                <path d="M1 25C10 25 15 5 25 15C35 25 40 5 59 1" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="59" cy="1" r="3" fill="#a78bfa" />
            </svg>
        </div>
      </div>
    </div>
  </div>
);

export default BalanceCard;