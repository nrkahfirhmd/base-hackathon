interface WalletAddress {
  address?: string;
  isVerified?: boolean;
}

interface WalletSectionProps {
  address?: string;
  isVerified?: boolean;
  isVerifying: boolean;
  verifyMessage: string | null;
  verifyError?: string | null;
  onVerifyWallet: () => void;
}

export default function WalletSection({
  address,
  isVerified = false,
  isVerifying,
  verifyMessage,
  verifyError,
  onVerifyWallet,
}: WalletSectionProps) {
  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  return (
    <div className="w-full bg-[#1B1E34] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-xs">Wallet Address</p>
        <div>
          {isVerified ? (
            <div className="flex items-center gap-1">
              <span className="text-blue-500 text-xs font-medium">Verified</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          ) : (
            <button
              onClick={onVerifyWallet}
              className="flex items-center gap-1 transition-opacity cursor-pointer"
              disabled={isVerifying}
            >
              <span className={`text-xs font-medium ${isVerifying ? 'text-gray-400' : 'text-red-500'}`}>
                {isVerifying ? 'Verifying...' : 'Not Verified'}
              </span>
              {isVerifying ? (
                <div className="h-4 w-8 rounded bg-gray-700 animate-pulse" aria-hidden="true"></div>
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
          onClick={handleCopyAddress}
          className="text-gray-400 p-2 flex-shrink-0 transition-colors cursor-pointer hover:text-white"
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
  );
}
