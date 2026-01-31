"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDisconnect, useAccount } from "wagmi";
import BottomNav from "@/components/ui/BottonNav";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import ProfileHeader from "@/components/profile/ProfileHeader";
import UsernameEdit from "@/components/profile/UsernameEdit";
import WalletSection from "@/components/profile/WalletSection";
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
      <ProfileHeader isNewUser={isNewUser} />

      {/* New User Notice */}
      {isNewUser && !isLoadingProfile && (
        <div className="mb-6">
          <p className="text-red-500 text-center text-sm font-medium">
            Please set your username!
          </p>
        </div>
      )}
        
      {isLoadingProfile ? (
        <div className="w-full max-w-2xl mx-auto mt-12 animate-pulse space-y-4">
          {/* Header skeleton */}
            <div className="bg-[#252A42] rounded-2xl p-6">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="h-20 w-20 rounded-full bg-gray-700"></div>
              <div className="flex flex-col items-center">
              <div className="h-8 w-40 rounded bg-gray-700 mb-2"></div>
              </div>
            </div>

            {/* WalletSection skeleton */}
            <div className="mt-6">
              <div className="w-full bg-[#1B1E34] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-24 rounded bg-gray-700"></div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="h-8 rounded bg-gray-700 flex-1 mr-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-[#252A42] rounded-2xl p-6 mb-6">
            <UsernameEdit
              profile={profile}
              isEditingUsername={isEditingUsername}
              tempUsername={tempUsername}
              isUpdating={isUpdating}
              isNewUser={isNewUser}
              updateError={updateError}
              onEditUsername={handleEditUsername}
              onSaveUsername={handleSaveUsername}
              onCancelEdit={handleCancelEdit}
              onTempUsernameChange={setTempUsername}
            />

            {/* Wallet Address */}
            <div className="mt-6">
              <WalletSection
                address={address}
                isVerified={profile.isVerified}
                isVerifying={isVerifying}
                verifyMessage={verifyMessage}
                verifyError={verifyError}
                onVerifyWallet={handleVerifyWallet}
              />
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