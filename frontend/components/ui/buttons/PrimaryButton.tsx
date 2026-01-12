"use client";

import React from "react";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  fullWidth?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  fullWidth = true,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? "w-full" : ""}
        py-4 px-8
        rounded-2xl
        bg-linear-to-b from-[#4338ca] via-[#5b21b6] to-[#7c3aed]
        text-white font-semibold text-lg
        shadow-[0_8px_30px_rgba(91,33,182,0.4)]
        hover:shadow-[0_8px_40px_rgba(91,33,182,0.6)]
        hover:scale-[1.02]
        active:scale-[0.98]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
