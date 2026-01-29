import Image from "next/image";

interface Profile {
  username: string;
  isVerified?: boolean;
}

interface UsernameEditProps {
  profile: Profile;
  isEditingUsername: boolean;
  tempUsername: string;
  isUpdating: boolean;
  isNewUser: boolean;
  updateError: string | null;
  onEditUsername: () => void;
  onSaveUsername: () => void;
  onCancelEdit: () => void;
  onTempUsernameChange: (value: string) => void;
}

export default function UsernameEdit({
  profile,
  isEditingUsername,
  tempUsername,
  isUpdating,
  isNewUser,
  updateError,
  onEditUsername,
  onSaveUsername,
  onCancelEdit,
  onTempUsernameChange,
}: UsernameEditProps) {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Profile Picture */}
      <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden border-4 border-[#1B1E34] mb-4">
        <Image src="/profile-pic.svg" alt="Profile" width={96} height={96} />
      </div>

      {/* Logic Tampilan */}
      {isEditingUsername ? (
        /* MODE EDIT: Kotak Gelap Full Width (Sejajar Wallet) */
        <div className="w-full">
          <div className="flex items-center bg-[#1B1E34] rounded-lg px-2 overflow-hidden border border-gray-700/50">
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => onTempUsernameChange(e.target.value)}
              placeholder="Enter username..."
              className="bg-transparent text-white px-3 py-3 flex-1 font-semibold focus:outline-none"
              autoFocus
              disabled={isUpdating}
            />

            <div className="flex items-center gap-1">
              <button
                onClick={onSaveUsername}
                className="text-green-500 p-2 hover:bg-green-500/10 rounded-md disabled:opacity-50"
                disabled={
                  isUpdating ||
                  !tempUsername.trim() ||
                  tempUsername.trim().length < 3
                }
              >
                {isUpdating ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>

              {!isNewUser && (
                <button
                  onClick={onCancelEdit}
                  className="text-red-500 p-2 hover:bg-red-500/10 rounded-md disabled:opacity-50"
                  disabled={isUpdating}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
          {updateError && (
            <p className="text-red-500 text-xs mt-2 text-center">
              {updateError}
            </p>
          )}
        </div>
      ) : (
        /* MODE DISPLAY: Seperti kodingan awal (Simpel & Centered) */
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xl font-bold text-white">
            {profile.username || "Anonymous"}
          </h2>
          <button
            onClick={onEditUsername}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
