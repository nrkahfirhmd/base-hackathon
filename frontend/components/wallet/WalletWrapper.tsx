"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function MiniAppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error("Failed to initialize miniapp:", error);
      }
    };

    initializeMiniApp();
  }, []);

  return <>{children}</>;
}
