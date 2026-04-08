import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";
import { ensureUser } from "@/lib/auth/ensure-user";
import { Nav } from "@/components/layout/nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { ModalProvider } from "@/components/layout/modal-provider";
import { ToastProvider } from "@/components/ui/toast";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let subscriptionStatus = "free";
  try {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      const dbUserId = await ensureUser(clerkId);
      if (dbUserId) {
        const user = await db.query.users.findFirst({
          where: eq(usersTable.id, dbUserId),
        });
        if (user) subscriptionStatus = user.subscriptionStatus;
      }
    }
  } catch {
    // Non-critical — fall back to free
  }

  return (
    <ToastProvider>
      <ModalProvider>
        <Nav subscriptionStatus={subscriptionStatus} />
        <main className="mx-auto max-w-[1200px] px-6 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <MobileTabBar />
      </ModalProvider>
    </ToastProvider>
  );
}
