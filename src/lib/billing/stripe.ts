import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usersTable } from "@/db/schema/users";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export { stripe };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getOrCreateCustomer(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  await db
    .update(usersTable)
    .set({ stripeCustomerId: customer.id })
    .where(eq(usersTable.id, userId));

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  customerId: string,
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/settings/subscription?success=true`,
    cancel_url: `${APP_URL}/settings/subscription?canceled=true`,
    metadata: { userId },
  });

  return { id: session.id, url: session.url };
}

export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/settings/subscription`,
  });

  return { url: session.url };
}

export async function syncSubscriptionStatus(
  customerId: string,
  status: string,
) {
  const subscriptionStatus =
    status === "active" || status === "trialing" ? "premium" : "free";

  await db
    .update(usersTable)
    .set({ subscriptionStatus })
    .where(eq(usersTable.stripeCustomerId, customerId));
}
