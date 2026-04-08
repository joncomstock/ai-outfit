"use client";

import { useState } from "react";

interface Props {
  targetUserId: string;
  initialFollowing: boolean;
}

export function FollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method });
      if (res.ok) {
        setFollowing(!following);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-6 py-2 text-label-lg uppercase tracking-widest transition-colors disabled:opacity-50 ${
        following
          ? "bg-surface-container-high text-on-surface ghost-border"
          : "editorial-gradient text-white"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
