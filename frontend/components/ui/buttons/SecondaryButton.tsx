"use client";

import React from "react";

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  fullWidth?: boolean;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
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
        rounded-3xl
        bg-transparent
        text-white/80 font-semibold text-md
        border-2 border-white/20
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default SecondaryButton;
