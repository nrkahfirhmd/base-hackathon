"use client";

import React from "react";

interface InputCardProps {
  amount: string;
}

const InputCard: React.FC<InputCardProps> = ({ amount }) => {
  return (
    <div
      className="
      /* Gaya Background & Transparansi */
      bg-linear-to-b from-white/10 from-0% to-[#999999]/3 to-100% 
      backdrop-blur-md 
      
      rounded-t-[2rem] 
      rounded-b-[1rem] 
      pt-20 
      pb-16 
      px-10 
      
      flex flex-col items-center 
      w-full max-w-sm mx-auto 
      
      /* Drop Shadow Kustom */
      shadow-[0_4px_4px_0_#996BFA]
      mb-10
      
      /* Border halus */
      border border-white/10
    "
    >

      <p className="text-white text-xl italic font-medium mb-12 opacity-90 text-center">
        Enter Amount in IDRX
      </p>


      <div className="flex flex-col items-center w-full">
        <h1 className="text-white text-4xl font-bold mb-8 tracking-tight text-center italic">
          IDRX {amount || "0"}
        </h1>

        <div className="w-full h-[1px] bg-white/10 mb-10"></div>


        <p className="text-white/40 text-[13px] font-medium text-center tracking-wide">
          Min IDRX100 - Max IDRX10,00000
        </p>
      </div>
    </div>
  );
};

export default InputCard;
