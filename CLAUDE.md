# CLAUDE.md — Outfit Engine

## Project Overview

AI-powered personal styling platform. Users upload clothing photos, Claude Vision analyzes them, and the system generates outfit recommendations mixing wardrobe items with catalog products. Built with Next.js 16 App Router, deployed on Vercel.

## Quick Start

```bash
pnpm install
pnpm dev          # Start dev server (Turbopack)
pnpm test         # Run Vitest in watch mode
pnpm test:run     # Run tests once
pnpm db:push      # Push schema to Neon
pnpm build        # Production build
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 with "Atelier Editorial" design system
- **Auth:** Clerk (v7, middleware-based route protection)
- **Database:** Neon serverless Postgres via Drizzle ORM
- **AI:** Anthropic Claude Sonnet 4.6 (vision analysis + outfit generation)
- **Storage:** Vercel Blob (clothing images)
- **Email:** Resend (transactional notifications)
- **Testing:** Vitest + Testing Library
- **Package Manager:** pnpm

## Architecture

### Route Groups

- `(auth)/` — Protected pages (dashboard, closet, outfits, trends, catalog, profile, fit-profile)
- `(public)/` — Unauthenticated pages (sign-in, sign-up, shared outfits)
- `(admin)/` — Admin-only pages (dashboard, trends, catalog, users, outfits moderation)
- `api/` — Route Handlers for all endpoints

### Server/Client Split Pattern

Every interactive page uses this pattern:
```
page.tsx    — Server Component: auth + data fetching
client.tsx  — Client Component: state + interactivity
```

Page fetches data and passes it as props to the client component. Only add `"use client"` when the component needs hooks, state, or event handlers.

### Auth Pattern

Every protected endpoint starts with:
```typescript
const { userId: clerkId } = await auth();
if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const dbUserId = await ensureUser(clerkId);
if (!dbUserId) return NextResponse.json({ error: "User not found" }, { status: 404 });
```

`ensureUser()` auto-provisions the DB user from Clerk data if the webhook hasn't fired. Always use it instead of raw DB queries for user lookup.

Admin endpoints use `requireAdmin()` which checks `publicMetadata.role === "admin"`.

### API Conventions

- Error shape: `{ error: string }` with appropriate status code (400/401/403/404)
- Dynamic params: `{ params }: { params: Promise<{ id: string }> }` (Next.js 16 async params)
- Long-running tasks return `202 Accepted` with `{ jobId }`, client polls via SSE
- Pagination: `?page=1&limit=24` with max limit caps

## Database

### Schema Conventions

- **Table names:** snake_case in SQL, camelCase + `Table` suffix in TypeScript (`closetItemsTable`)
- **Column names:** snake_case in SQL, camelCase in Drizzle schema
- **Primary keys:** `uuid("id").defaultRandom().primaryKey()`
- **Timestamps:** Always include `createdAt` + `updatedAt` with `$onUpdate`
- **JSONB:** Use `.$type<T>()` for type safety: `jsonb("colors").$type<string[]>().default([])`
- **Enums:** `pgEnum()` defined above the table, named `featureNameEnum`
- **Type exports:** Always export `Type` (select) and `NewType` (insert) from each schema file
- **Foreign keys:** Use `onDelete: "cascade"` for owned relationships, `"set null"` for optional references

### Tables (11 total)

`users`, `closet_items`, `outfits`, `outfit_slots`, `products`, `trends`, `trend_products`, `saved_trends`, `affiliate_clicks`, `notifications`, `fit_profiles`

### DB Client

All tables registered in `src/db/index.ts`. When adding a new table:
1. Create schema file in `src/db/schema/`
2. Import and add to the `schema` object in `src/db/index.ts`
3. Run `pnpm db:push`

## Design System — "Atelier Editorial"

### Core Rules (DO NOT VIOLATE)

- **0px border radius everywhere.** No `rounded-*` classes. Global CSS enforces this.
- **No borders for sectioning.** Use background color shifts between surface tiers.
- **Labels always uppercase** with `label-text` class (applies `text-label-lg uppercase tracking-widest`).
- **Serif font for headlines, prices, dates** (`font-serif` / Noto Serif).
- **Sans font for body text and UI** (`font-sans` / Manrope).
- **Left-align body text.** Never center long copy.

### Color Tokens

- Primary: `#974232` (terracotta) — `text-primary`, `bg-primary`
- Surface: `#fbf9f6` (cream) — `bg-surface`
- Surface tiers: `bg-surface-container-low`, `bg-surface-container`, `bg-surface-container-high`
- On-surface: `#1b1c1a` (ink) — `text-on-surface`
- On-surface variant: `#55423f` — `text-on-surface-variant`

### Custom Utilities

- `editorial-gradient` — Primary button gradient (45deg, #974232 → #b65948)
- `glass` — Glassmorphic nav (80% opacity + 20px blur)
- `ghost-border` — Subtle outline (20% opacity outline-variant)
- `shadow-ambient` / `shadow-ambient-lg` — Primary-tinted soft shadows

### Typography Scale

Display: `text-display-lg/md/sm` | Headline: `text-headline-lg/md/sm` | Title: `text-title-lg/md` | Body: `text-body-lg/md` | Label: `text-label-lg/md`

## AI Integration

### Claude API Patterns

- Model: `claude-sonnet-4-6` for both vision and text tasks
- System prompts request **JSON-only responses** (no markdown, no explanation)
- Responses parsed with `JSON.parse()` — always wrap in try/catch
- Raw AI responses stored in `aiRawResponse` JSONB column for debugging

### Image Analysis

Sends clothing image URL to Claude Vision. Returns structured JSON with: category, subCategory, colors (hex), fit, seasonality, styleTags.

### Outfit Generation

Sends item **metadata** (not images) to Claude. Includes: user preferences, item list with attributes, optional trend context. Returns outfit name + slot assignments referencing item IDs. Validates all IDs belong to user before saving.

## Testing

### Setup

- Vitest with `environment: "node"` (default), `jsdom` only for component tests via `// @vitest-environment jsdom`
- `tests/setup.ts` provides mock env vars
- Path aliases (`@/`) resolved via `vite-tsconfig-paths`

### Mock Patterns

**Clerk auth:**
```typescript
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "clerk_user_123" }),
}));
```

**Anthropic SDK (class constructor):**
```typescript
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: vi.fn().mockResolvedValue({...}) };
  }
  return { default: MockAnthropic };
});
```

**Drizzle DB (chainable):**
```typescript
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([...]),
        }),
      }),
    }),
  },
}));
```

Use `vi.hoisted()` when mock functions need to be referenced both in `vi.mock()` factories and test assertions.

## File Naming

- **Components:** kebab-case files, PascalCase exports (`outfit-card.tsx` → `OutfitCard`)
- **Schema files:** kebab-case (`closet-items.ts`, `fit-profiles.ts`)
- **API routes:** `route.ts` in directory structure
- **Tests:** mirror source path under `tests/` with `.test.ts` suffix

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL                          # Neon Postgres connection string
ANTHROPIC_API_KEY                     # Claude API key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY     # Clerk frontend key
CLERK_SECRET_KEY                      # Clerk backend key
CLERK_WEBHOOK_SECRET                  # Svix webhook verification
BLOB_READ_WRITE_TOKEN                 # Vercel Blob storage
RESEND_API_KEY                        # Email service
EMAIL_FROM                            # Sender address
```

## Stitch Design Reference

Stitch project ID: `5273890100334486731` with 31 screens covering all pages, modals, mobile variants, and states. Design system: "Atelier Editorial". Use Stitch MCP tools to fetch screen designs when building new UI.
