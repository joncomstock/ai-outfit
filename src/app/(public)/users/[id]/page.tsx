import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { outfitsTable } from "@/db/schema/outfits";
import { followsTable } from "@/db/schema/follows";
import { ensureUser } from "@/lib/auth/ensure-user";
import { FollowButton } from "@/components/social/follow-button";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch the profile user
  const profileUser = await db.query.users.findFirst({
    where: eq(usersTable.id, id),
  });

  if (!profileUser) notFound();

  // Fetch shared outfits (ones with shareToken set)
  const sharedOutfits = await db
    .select()
    .from(outfitsTable)
    .where(and(eq(outfitsTable.userId, id)));

  const publicOutfits = sharedOutfits.filter((o) => o.shareToken);

  // Get follower/following counts
  const followers = await db
    .select()
    .from(followsTable)
    .where(eq(followsTable.followingId, id));

  const following = await db
    .select()
    .from(followsTable)
    .where(eq(followsTable.followerId, id));

  // Check if current user follows this profile
  let isFollowing = false;
  const { userId: clerkId } = await auth();
  let currentDbUserId: string | null = null;
  if (clerkId) {
    currentDbUserId = await ensureUser(clerkId);
    if (currentDbUserId) {
      const existingFollow = followers.find((f) => f.followerId === currentDbUserId);
      isFollowing = !!existingFollow;
    }
  }

  const isOwnProfile = currentDbUserId === id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-display-sm text-on-surface">
            {profileUser.displayName || "User"}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Member since{" "}
            {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex gap-6 mt-3">
            <span className="text-body-md text-on-surface">
              <strong className="font-serif">{followers.length}</strong>{" "}
              <span className="text-on-surface-variant">followers</span>
            </span>
            <span className="text-body-md text-on-surface">
              <strong className="font-serif">{following.length}</strong>{" "}
              <span className="text-on-surface-variant">following</span>
            </span>
          </div>
        </div>

        {clerkId && !isOwnProfile && (
          <FollowButton
            targetUserId={id}
            initialFollowing={isFollowing}
          />
        )}
      </div>

      {/* Shared Outfits Gallery */}
      <section>
        <h2 className="font-serif text-headline-md text-on-surface mb-4">
          Shared Outfits
        </h2>
        {publicOutfits.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            No shared outfits yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {publicOutfits.map((outfit) => (
              <a
                key={outfit.id}
                href={`/shared/outfits/${outfit.shareToken}`}
                className="bg-surface-container p-4 hover:bg-surface-container-high transition-colors"
              >
                <p className="font-serif text-title-md text-on-surface">
                  {outfit.name}
                </p>
                <p className="text-body-md text-on-surface-variant mt-1">
                  {new Date(outfit.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
