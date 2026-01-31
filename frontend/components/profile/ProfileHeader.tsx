import { useRouter } from "next/navigation";

interface ProfileHeaderProps {
  isNewUser: boolean;
}

export default function ProfileHeader({ isNewUser }: ProfileHeaderProps) {
  const router = useRouter();

  return (
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
      <h1 className="text-xl font-bold">Profile</h1>
      <div className="w-8"></div>
    </div>
  );
}
