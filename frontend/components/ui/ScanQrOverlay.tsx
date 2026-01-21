"use client";

const ScanQrOverlay = () => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Kotak Transparan di Tengah */}
      <div className="relative w-72 h-72">
        {/* Efek Gelap di Sekelilingnya */}
        <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none"></div>

        {/* Siku Kiri Atas */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg z-10"></div>

        {/* Siku Kanan Atas */}
        <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg z-10"></div>

        {/* Siku Kiri Bawah */}
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg z-10"></div>

        {/* Siku Kanan Bawah */}
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg z-10"></div>
        <div className="absolute top-0 left-0 w-full h-0.5 bg-white shadow-[0_0_10px_white] animate-scan-line"></div>
      </div>
    </div>
  );
};

export default ScanQrOverlay;
