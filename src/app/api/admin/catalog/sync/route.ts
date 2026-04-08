import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth/ensure-user";
import { getProvider, getAllProviders } from "@/lib/affiliates/registry";
import { syncProducts } from "@/lib/affiliates/sync";

async function requireAdmin() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const user = await currentUser();
  if (!user || (user.publicMetadata as any)?.role !== "admin") return null;
  const dbUserId = await ensureUser(clerkId);
  return dbUserId;
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    provider: providerName,
    categories = ["tops", "bottoms", "outerwear", "shoes", "bags", "accessories"],
    limit = 20,
  } = body as { provider?: string; categories?: string[]; limit?: number };

  if (providerName) {
    const provider = getProvider(providerName);
    if (!provider) {
      return NextResponse.json({ error: `Provider '${providerName}' not found` }, { status: 400 });
    }
    const result = await syncProducts(provider, categories, limit);
    return NextResponse.json(result);
  }

  // Sync all providers
  const providers = getAllProviders();
  const results = await Promise.all(
    providers.map((p) => syncProducts(p, categories, limit)),
  );

  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  return NextResponse.json({ results, totalSynced, totalErrors });
}
