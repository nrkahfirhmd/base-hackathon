'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

interface ProfileData {
  username: string;
  isVerified: boolean;
  description?: string;
  walletAddress?: string;
  imageUrl?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useProfile() {
  const { address } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    isVerified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const data = await response.json();

        if (response.ok) {
          const profileData: ProfileData = {
            username: data.name || '',
            isVerified: data.is_verified || false,
            description: data.description || '',
            walletAddress: data.wallet_address || '',
            imageUrl: data.image_url || '',
          };

          setProfile(profileData);

          const isNew = data.name === 'Unknown' || data.description?.includes('Belum terdaftar');
          setIsNewUser(isNew);

          if (isNew) {
            router.push('/profile');
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [address, router]);

  return { profile, isLoading, error, setProfile, isNewUser };
}

export function useUpdateUsername() {
  const { address } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUsername = async (newUsername: string): Promise<{ success: boolean; message?: string }> => {
    setError(null);

    if (newUsername.length < 3) {
      const errorMsg = 'Username must be at least 3 characters';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`${API_URL}/api/info/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          name: newUsername,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setIsUpdating(false);
        return { success: true };
      } else {
        const errorMsg = data.message || 'Failed to update username';
        setError(errorMsg);
        setIsUpdating(false);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      console.error('Failed to update username:', err);
      const errorMsg = 'Network error. Please try again';
      setError(errorMsg);
      setIsUpdating(false);
      return { success: false, message: errorMsg };
    }
  };

  return { updateUsername, isUpdating, error, setError };
}

export function useUpdateProfile() {
  const { address } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  interface UpdateProfileParams {
    name: string;
    description?: string;
    image?: File;
  }

  const updateProfile = async (params: UpdateProfileParams): Promise<{ success: boolean; message?: string }> => {
    setError(null);
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('wallet_address', address as string);
      formData.append('name', params.name);

      if (params.description) {
        formData.append('description', params.description);
      }

      if (params.image) {
        formData.append('image', params.image);
      }

      const response = await fetch(`${API_URL}/api/info/add`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setIsUpdating(false);
        return { success: true };
      } else {
        const errorMsg = data.message || 'Failed to update profile';
        setError(errorMsg);
        setIsUpdating(false);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMsg = 'Network error. Please try again';
      setError(errorMsg);
      setIsUpdating(false);
      return { success: false, message: errorMsg };
    }
  };

  return { updateProfile, isUpdating, error, setError };
}

export function useVerifyWallet() {
  const { address } = useAccount();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyWallet = async (): Promise<{ success: boolean; message?: string }> => {
    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_URL}/api/info/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'pending') {
        const pollInterval = setInterval(async () => {
          try {
            const checkResponse = await fetch(`${API_URL}/api/info`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address }),
            });

            const checkData = await checkResponse.json();

            if (checkResponse.ok && checkData.is_verified === true) {
              clearInterval(pollInterval);
              setIsVerifying(false);
              console.log('Wallet verified!');
            }
          } catch (err) {
            console.error('Error checking verification status:', err);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(pollInterval);
          setIsVerifying(false);
        }, 5 * 60 * 1000);

        return {
          success: true,
          message: data.message || 'AI sedang memverifikasi wallet Anda...' 
        };
      } else {
        const errorMsg = data.message || 'Verification failed';
        setError(errorMsg);
        setIsVerifying(false);
        return { success: false, message: errorMsg };
      }
    } catch (err) {
      console.error('Verification failed:', err);
      const errorMsg = 'Network error. Please try again';
      setError(errorMsg);
      setIsVerifying(false);
      return { success: false, message: errorMsg };
    }
  };

  return { verifyWallet, isVerifying, error };
}
