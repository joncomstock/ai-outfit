"use client";

import Link from "next/link";

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
  activity: ActivityItem;
}

const TYPE_LABELS: Record<string, string> = {
  shared_outfit: "shared an outfit",
  new_capsule: "created a capsule",
};

export function ActivityCard({ activity }: Props) {
  const label = TYPE_LABELS[activity.type] ?? activity.type;
  const itemName = (activity.metadata?.outfitName ?? activity.metadata?.capsuleName ?? "") as string;

  const href =
    activity.type === "shared_outfit"
      ? `/outfits/${activity.referenceId}`
      : `/capsules/${activity.referenceId}`;

  return (
    <div className="bg-surface-container p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-body-lg text-on-surface">
            <Link
              href={`/users/${activity.userId}`}
              className="font-serif text-primary hover:underline"
            >
              {activity.displayName}
            </Link>{" "}
            {label}
          </p>
          {itemName && (
            <Link
              href={href}
              className="text-body-md text-on-surface-variant hover:text-on-surface mt-1 inline-block"
            >
              {itemName}
            </Link>
          )}
        </div>
        <span className="text-body-md text-on-surface-variant whitespace-nowrap ml-4">
          {new Date(activity.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
