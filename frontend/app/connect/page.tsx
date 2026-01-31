"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Image from "next/image";
import { AccountConnect } from "@/components/wallet/AccountConnect";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  // Logic redirect: Jika sudah konek, lempar ke dashboard/home
  useEffect(() => {
    if (isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#1B1E34] text-white p-6">
      {/* Header Section */}
      <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-6 flex justify-center">
          <div className="p-1 rounded-3xl bg-linear-to-tr from-blue-500 to-purple-500 shadow-lg shadow-purple-500/20">
            <div className="bg-[#1B1E34] rounded-[22px] p-2">
              <Image
                src="/Logo.png"
                alt="App Logo"
                width={120}
                height={120}
                className="rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-20 tracking-tight">Welcome Back</h1>

        <div className="flex items-center gap-2 w-full justify-center">
          <div className="flex-1 h-0.5 bg-white/40 rounded-full" />
          <p className="text-white/50 text-sm font-medium">Connect wallet to continue</p>
          <div className="flex-1 h-0.5 bg-white/40 rounded-full" />
        </div>

        {/* Gunakan Komponen Modular Kita */}
        <div className="w-full max-w-sm pt-6">
            <AccountConnect />
            <div className="mt-8 mx-8 text-center text-xs text-gray-400">
              Supported: MetaMask · WalletConnect · Coinbase Wallet
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center opacity-50">
        <p className="text-[10px] uppercase tracking-widest text-white">
          Secure Onchain Connection
        </p>
        <p className="text-[10px] text-white mt-2">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </main>
  );
}
