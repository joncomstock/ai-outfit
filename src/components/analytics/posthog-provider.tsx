"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { initPostHog, identifyUser, resetPostHog } from "@/lib/analytics/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      identifyUser(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName,
      });
    } else {
      resetPostHog();
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}
