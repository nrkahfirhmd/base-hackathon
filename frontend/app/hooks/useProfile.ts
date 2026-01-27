'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface ProfileData {
  username: string;
  isVerified: boolean;
  description?: string;
}

export function useProfile() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    isVerified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const data = await response.json();
        
        if (response.ok) {
          setProfile({
            username: data.name || '',
            isVerified: data.is_verified || false,
            description: data.description || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [address]);

  return { profile, isLoading, error, setProfile };
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
      const response = await fetch('/api/info/add', {
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

export function useVerifyWallet() {
  const { address } = useAccount();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyWallet = async (): Promise<{ success: boolean; message?: string }> => {
    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch('/api/info/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'pending') {
        setIsVerifying(false);
        return { 
          success: true, 
          message: data.message || 'Verification in progress' 
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
