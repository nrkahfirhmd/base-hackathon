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
        relative
        py-4 px-8
        rounded-2xl
        bg-white
        text-[#5b21b6] font-semibold text-lg
        border-2 border-transparent
        bg-clip-padding
        hover:bg-gray-50
        active:scale-[0.98]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
        ${className}
      `}
      style={{
        background: "white",
        backgroundClip: "padding-box",
        border: "2px solid transparent",
        borderImage: "linear-gradient(135deg, #7c3aed, #a855f7, #7c3aed) 1",
        borderImageSlice: 1,
      }}
    >
      {/* Gradient border wrapper */}
      <span
        className="absolute inset-0 rounded-2xl -z-10"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #a855f7, #7c3aed)",
          margin: "-2px",
          borderRadius: "18px",
        }}
      />
      <span
        className="absolute inset-0 rounded-2xl -z-10 bg-white"
        style={{ borderRadius: "14px" }}
      />
      {children}
    </button>
  );
};

export default SecondaryButton;
