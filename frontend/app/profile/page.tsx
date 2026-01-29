"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useDisconnect, useAccount } from "wagmi";
import BottomNav from "@/components/ui/BottonNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import { useProfile, useUpdateProfile, useVerifyWallet } from "@/app/hooks/useProfile";

export default function ProfilePage() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  const { profile, isLoading: isLoadingProfile, setProfile } = useProfile();
  const { updateProfile, isUpdating, error: updateError, setError } = useUpdateProfile();
  const { verifyWallet, isVerifying, error: verifyError } = useVerifyWallet();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const isNewUser = profile.username === "Unknown";

  useEffect(() => {
    if (isNewUser && !isLoadingProfile) {
      setIsEditingUsername(true);
      setTempUsername("");
    }
  }, [isNewUser, isLoadingProfile]);

  const handleEditUsername = () => {
    setTempUsername(profile.username);
    setError(null);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    const newUsername = tempUsername.trim();

    if (newUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (newUsername === profile.username && !isNewUser) {
      setIsEditingUsername(false);
      return;
    }

    const result = await updateProfile({ 
      name: newUsername 
    });

    if (result.success) {
      setProfile({ ...profile, username: newUsername });
      setIsEditingUsername(false);
      if (isNewUser) {
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    }
  };

  const handleCancelEdit = () => {
    if (!isNewUser) {
      setIsEditingUsername(false);
      setTempUsername("");
      setError(null);
    }
  };

  const handleVerifyWallet = async () => {
    setVerifyMessage(null);
    const result = await verifyWallet();

    if (result.success) {
      setVerifyMessage(result.message || 'AI is verifying your wallet');
    } else {
      setVerifyMessage(result.message || 'Verification failed');
    }
  };

  const handleLogout = () => {
    disconnect();
    router.push("/connect");
  };

  return (
    <main className="min-h-screen bg-[#1B1E34] text-white p-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2"
          disabled={isNewUser}
        >
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
            className={isNewUser ? "opacity-50 cursor-not-allowed" : ""}
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">
          Profile
        </h1>
        <div className="w-8"></div>
      </div>

      {/* New User Notice */}
      {isNewUser && !isLoadingProfile && (
        <div className="mb-6">
          <p className="text-red-500 text-center text-sm font-medium">
            Please set your username!
          </p>
        </div>
      )}
        
      {isLoadingProfile ? (
        <div className="flex flex-col items-center justify-center mt-32">
          <svg className="animate-spin h-12 w-12 text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
            <>
            {/* Profile Info */}
            <div className="bg-[#252A42] rounded-2xl p-6 mb-6">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden border-4 border-[#1B1E34] mb-4">
                        <Image src="/profile-pic.svg" alt="Profile" width={96} height={96} />
                    </div>

                    {/* Username with Edit */}
                    {isEditingUsername ? (
                        <div className="w-full">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tempUsername}
                                    onChange={(e) => setTempUsername(e.target.value)}
                                    placeholder="Enter username..."
                                    className="bg-[#1B1E34] text-white px-4 py-2 rounded-lg flex-1 font-semibold focus:outline-none"
                                    autoFocus
                                    disabled={isUpdating}
                                />
                                <button
                                    onClick={handleSaveUsername}
                                    className="text-green-500 p-2 hover:bg-green-500/20 rounded-lg disabled:opacity-50 transition-colors"
                                    disabled={isUpdating || !tempUsername.trim() || tempUsername.trim().length < 3}
                                    title="Save"
                                >
                                    {isUpdating ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </button>
                                {!isNewUser && (
                                  <button
                                      onClick={handleCancelEdit}
                                      className="text-red-500 p-2 hover:bg-red-500/20 rounded-lg disabled:opacity-50 transition-colors"
                                      disabled={isUpdating}
                                      title="Cancel"
                                  >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <line x1="18" y1="6" x2="6" y2="18"></line>
                                          <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                  </button>
                                )}
                            </div>
                            {/* Error Message */}
                            {updateError && (
                                <p className="text-red-500 text-xs text-center mt-1">{updateError}</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-xl font-bold">{profile.username || 'Anonymous'}</h2>
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
                                {profile.isVerified ? (
                                    <div className="flex items-center gap-1">
                                        <span className="text-blue-500 text-xs font-medium">Verified</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleVerifyWallet}
                                        className="flex items-center gap-1 transition-opacity cursor-pointer"
                                        disabled={isVerifying}
                                    >
                                        <span className={`text-xs font-medium ${isVerifying ? 'text-gray-400' : 'text-red-500'}`}>
                                            {isVerifying ? 'Verifying...' : 'Not Verified'}
                                        </span>
                                        {isVerifying ? (
                                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-white text-sm font-mono break-all flex-1">{address}</p>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(address || '');
                                }}
                                className="text-gray-400 p-2 flex-shrink-0 transition-colors cursor-pointer"
                                title="Copy address"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                            </button>
                        </div>

                        {/* Verification Message */}
                        {verifyMessage && !isVerifying && (
                            <div className={`mt-2 p-2 rounded text-xs ${
                                verifyError ? ' text-red-400' : ' text-blue-400'
                            }`}>
                                {verifyMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            {!isNewUser && (
              <SecondaryButton onClick={handleLogout} className="w-full">
                Disconnect Wallet
              </SecondaryButton>
            )}
          </>
        )}

      <BottomNav />
    </main>
  );
}