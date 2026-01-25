"use client";

import React from "react";


interface ButtonProps {
  children: React.ReactNode;
  onClick: (value: string) => void;
  value: string;
  className?: string;
}

const IndividualButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  value,
  className = "",
}) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`
      flex items-center justify-center py-6 
      bg-white/10 hover:bg-white/20 active:bg-white/30 
      rounded-lg transition-colors text-white 
      text-2xl font-bold 
      /* Drop Shadow Ungu Kustom */
      shadow-[0_4px_4px_0_#996BFA] 
      ${className}
    `}
  >
    {children}
  </button>
);

// Komponen Utama Numpad
interface NumpadProps {
  onInput: (value: string) => void;
  onDelete: () => void;
  className?: string;
}

const Numpad: React.FC<NumpadProps> = ({
  onInput,
  onDelete,
  className = "",
}) => {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div

      className={`grid grid-cols-3 gap-3 w-full max-w-sm mx-auto ${className}`}
    >
      {/* Tombol Angka 1-9 */}
      {digits.map((num) => (
        <IndividualButton key={num} value={num} onClick={onInput}>
          {num}
        </IndividualButton>
      ))}

    
      <IndividualButton value="." onClick={onInput}>
        .
      </IndividualButton>

      <IndividualButton value="0" onClick={onInput}>
        0
      </IndividualButton>

      {/* Tombol Backspace  */}
      <button
        type="button"
        onClick={onDelete}
        className="flex items-center justify-center py-6 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors text-white shadow-[0_4px_4px_0_#996BFA]"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <line x1="18" y1="9" x2="12" y2="15" />
          <line x1="12" y1="9" x2="18" y2="15" />
        </svg>
      </button>
    </div>
  );
};

export default Numpad;
