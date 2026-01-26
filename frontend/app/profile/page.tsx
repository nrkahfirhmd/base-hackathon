"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useDisconnect, useAccount } from "wagmi";
import BottomNav from "@/components/ui/BottonNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";

export default function ProfilePage() {
  const router = useRouter();
  const { disconnect } = useDisconnect();

  // Mock user data
  const [username, setUsername] = useState("dzikribm");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [isWalletVerified, setIsWalletVerified] = useState(false);
  const { address} = useAccount();

  const userInfo = {
    Username: username,
    walletAddress: address,
  };

  const handleEditUsername = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = () => {
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
    }
    setIsEditingUsername(false);
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setTempUsername("");
  };

  const handleLogout = () => {
    console.log("Logging out...");
    disconnect();
    router.push("/connect");
  };

  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
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

                    {/* Username with Edit */}
                    {isEditingUsername ? (
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                value={tempUsername}
                                onChange={(e) => setTempUsername(e.target.value)}
                                className="bg-[#1B1E34] text-white px-3 py-1 rounded-lg text-center font-bold"
                                autoFocus
                            />
                            <button onClick={handleSaveUsername} className="text-green-500 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            <button onClick={handleCancelEdit} className="text-red-500 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-xl font-bold">{userInfo.Username}</h2>
                            <button onClick={handleEditUsername} className="text-gray-400 hover:text-white p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Wallet Address */}
                    <div className="w-full bg-[#1B1E34] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-400 text-xs">Wallet Address</p>
                            <div>
                                {isWalletVerified ? (
                                    <><span className="text-blue-500 text-xs font-medium flex items-center gap-1">Verified</span><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg></>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('/api/verify', { // bisa di ganti sesuai endpoint
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        walletAddress: userInfo.walletAddress,
                                                    }),
                                                });
                                                const data = await response.json();
                                                if (data.verified) {
                                                    setIsWalletVerified(true);
                                                }
                                            } catch (error) {
                                                console.error('Verification failed:', error);
                                            }
                                        }}
                                        className="hover:opacity-70 transition-opacity flex items-center gap-1"
                                    >
                                        <span className="text-red-500 text-xs font-medium">Not Verified</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-white text-sm font-mono break-all">{userInfo.walletAddress}</p>
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