"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface InputConfirmationButtonProps {
  onSuccess: () => void;
  text?: string;
  className?: string;
}

const InputConfirmationButton: React.FC<InputConfirmationButtonProps> = ({
  onSuccess,
  text = "Swipe to Show QR Code",
  className = "",
}) => {
  const [isComplete, setIsComplete] = useState(false);


  const x = useMotionValue(0);


  const opacity = useTransform(x, [0, 150], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {

    if (info.offset.x > 200) {
      setIsComplete(true);
      onSuccess();
    } else {

      x.set(0);
    }
  };

  return (
    <div
      className={`
        relative w-full max-w-md h-[72px] 
        rounded-2xl overflow-hidden 
        bg-linear-to-b from-[#281a45] via-[#3b2a6e] to-[#6a3eb7]
        p-2 flex items-center transition-all duration-200
        hover:scale-[1.01] shadow-xl
        ${className}
      `}
    >
      {/* Teks Instruksi */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center text-white/90 font-semibold text-lg pointer-events-none"
      >
        {text}
      </motion.div>

      {/* Handle Geser */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 280 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        animate={isComplete ? { x: 320, opacity: 0 } : {}}
        className="
          relative z-10 w-14 h-14 
          bg-white/10 backdrop-blur-xl 
          rounded-2xl flex items-center justify-center 
          cursor-grab active:cursor-grabbing 
          shadow-lg border border-white/20
          transition-colors hover:bg-white/20
        "
      >
        {/* Ikon Panah */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </motion.div>
    </div>
  );
};

export default InputConfirmationButton;
