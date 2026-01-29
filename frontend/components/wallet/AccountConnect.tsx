"use client";

import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";

interface AccountConnectProps {
  className?: string;
}

export function AccountConnect({ className }: AccountConnectProps) {
  return (
    <div className="w-full flex justify-center">
      <Wallet>
        <ConnectWallet
          // Kita jadikan styling gradien Anda sebagai default
          className={
            className ||
            "w-full py-4 px-8 rounded-2xl bg-linear-to-b from-[#4338ca] via-[#5b21b6] to-[#7c3aed] text-white font-semibold text-md transition-all hover:brightness-110 active:scale-95"
          }
        />
      </Wallet>
    </div>
  );
}
