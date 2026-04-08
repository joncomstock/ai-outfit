"use client";

import { ActivityCard } from "@/components/social/activity-card";
import { EmptyState } from "@/components/empty-state";

interface ActivityItem {
  id: string;
  userId: string;
  type: "shared_outfit" | "new_capsule";
  referenceId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  displayName: string;
}

interface Props {
  activities: ActivityItem[];
}

export function FeedClient({ activities }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-display-sm text-on-surface mb-8">
        Feed
      </h1>

      {activities.length === 0 ? (
        <EmptyState
          title="Your feed is empty"
          description="Follow other users to see their shared outfits and capsule wardrobes here."
        />
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
