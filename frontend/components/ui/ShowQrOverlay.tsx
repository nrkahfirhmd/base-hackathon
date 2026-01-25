"use client";

import Image from "next/image";

const ShowQrCard = () => {
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

      <h3 className="text-xl font-bold text-white mb-8">
        Toko Besi Dedi Rahmat
      </h3>


      <div className="bg-white p-5 rounded-[2rem] mb-8 shadow-lg">
      
        <Image src="/qr.svg" alt="QR Code" width={240} height={240} priority />
      </div>


      <div className="text-center">
        {/* Nominal IDRX */}
        <h2 className="text-4xl font-bold text-white mb-6 italic">
          IDRX 250.5
        </h2>

        {/* Label Valid Until */}
        <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">
          Valid Until
        </p>

        {/* Waktu/Timer */}
        <p className="text-3xl font-bold text-white tracking-widest">00 : 56</p>
      </div>
    </div>
  );
};

export default ShowQrCard;
