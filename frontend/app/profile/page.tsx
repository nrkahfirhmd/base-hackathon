"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNav from "@/components/ui/BottonNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";

export default function ProfilePage() {
    const router = useRouter();

    // Mock user data
    const userInfo = {
        Username: "dzikribm",
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    };

    const handleLogout = () => {
        // Logic logout
        console.log("Logging out...");
        router.push("/connect");
    };

    return (
        <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => router.back()} className="p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <h1 className="text-xl font-bold">Profile</h1>
                <div className="w-8"></div>
            </div>

            {/* Profile Info */}
            <div className="bg-[#252A42] rounded-2xl p-6 mb-6">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden border-4 border-[#1B1E34] mb-4">
                        <Image src="/profile-pic.svg" alt="Profile" width={96} height={96} />
                    </div>
                    <h2 className="text-xl pb-2 font-bold mb-1">{userInfo.Username}</h2>

                    {/* Wallet Address */}
                    <div className="w-full bg-[#1B1E34] rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-gray-400 text-xs mb-1">Wallet Address</p>
                            <p className="text-white text-sm font-mono truncate">{userInfo.walletAddress}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <SecondaryButton onClick={handleLogout} className="w-full">
                Disconnect Wallet
            </SecondaryButton>

            <BottomNav />
        </main>
    );
}