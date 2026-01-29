"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Image from "next/image";
import { AccountConnect } from "@/components/wallet/AccountConnect";
import { useProfile } from "@/app/hooks/useProfile";

export default function ConnectPage() {
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  ConnectWallet,
  Wallet,
} from '@coinbase/onchainkit/wallet';
import Image from 'next/image';
import {useProfile} from "@/app/hooks/useProfile";

export default function WalletDemo() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { profile, isLoading: isLoadingProfile, setProfile } = useProfile();

  useEffect(() => {
    if (isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1B1E34] text-white p-6">
      {/* Logo/Title Section */}
      <div className="mb-12 text-center">
        <div className="mb-4 flex justify-center">
          <Image
            src="/logo.png"
            alt="App Logo"
            width={100}
            height={100}
            className="rounded-2xl"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-sm">Connect your wallet to get started</p>
      </div>

      {/* Connect Wallet Button */}
      <div className="w-full max-w-md flex justify-center">
        <Wallet>
          <ConnectWallet
            className="w-full py-4 px-8 rounded-2xl bg-linear-to-b from-[#4338ca] via-[#5b21b6] to-[#7c3aed] text-white! font-semibold text-md"
          />
        </Wallet>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
