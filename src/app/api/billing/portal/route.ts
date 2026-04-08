import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getOrCreateCustomer, createCustomerPortalSession } from "@/lib/billing/stripe";

export async function POST(_req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUserId = await ensureUser(clerkId);
  if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const customerId = await getOrCreateCustomer(dbUserId);
  const session = await createCustomerPortalSession(customerId);

  return NextResponse.json({ url: session.url });
}
