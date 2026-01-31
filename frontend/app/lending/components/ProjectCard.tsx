"use client";

import React from "react";
import { ProjectItem } from "@/app/hooks/useLending";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";

interface Props {
  project: ProjectItem;
  onDeposit: (project: ProjectItem) => void;
}

export default function ProjectCard({ project, onDeposit }: Props) {
  return (
    <div className="flex items-center justify-between p-6 mb-2 rounded-2xl bg-[#1e1e2d] border border-gray-800">
      
      {/* Left Section */}
      <div className="flex flex-col gap-0.5">
        <h3 className="text-white font-semibold text-sm leading-none">
          {project.symbol}
        </h3>
        <span className="text-white/60 text-xs">
          {project.protocol}
        </span>

        <span className="mt-1 text-white/40 text-[11px] hidden sm:block">
          TVL ${project.tvl.toLocaleString()}
        </span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        
        {/* APY */}
        <div className="text-right">
          <div className="text-white font-semibold text-sm leading-none">
            {project.apy}%
          </div>
          <div className="text-white/40 text-[11px]">
            APY
          </div>
        </div>

        {/* Action */}
        <PrimaryButton
          onClick={() => onDeposit(project)}
          fullWidth={false}
          className="px-4 py-1.5 text-sm"
        >
          Deposit
        </PrimaryButton>
      </div>
    </div>
  );
}
