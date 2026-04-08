"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { initPostHog, identifyUser, resetPostHog } from "@/lib/analytics/posthog";
import { trackSignup } from "@/lib/analytics/funnel";

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

      // Track signup funnel step once per session per user
      const signupKey = `posthog_signup_tracked_${user.id}`;
      if (!sessionStorage.getItem(signupKey)) {
        sessionStorage.setItem(signupKey, "1");
        trackSignup();
      }
    } else {
      resetPostHog();
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}
