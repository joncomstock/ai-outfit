# Outfit Engine — Architecture & Design Spec

## Overview

Outfit Engine is an AI-powered personal styling platform. Users upload photos of their clothes, the system analyzes them with ML, and generates complete outfit recommendations mixing wardrobe items with shoppable catalog products. It surfaces fashion trends and enables shopping through affiliate links.

**Target audience**: Fashion-conscious adults (18-45) wanting curated outfit suggestions tailored to what they already own.

**Launch strategy**: Soft launch targeting hundreds of early users from a waitlist/community.

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Monolithic Next.js | Simplest for soft launch; extract services when scale demands |
| Hosting | Vercel (serverless) | Minimal ops, excellent Next.js integration |
| Auth | Clerk | Best-in-class Next.js DX, consumer-friendly OAuth, generous free tier |
| Database | Neon (serverless Postgres) | Scales to zero, branching for preview envs, native Vercel integration |
| ORM | Drizzle | Lightweight on serverless, first-class Neon adapter, SQL-like control |
| File Storage | Vercel Blob | Clothing image uploads, native Vercel integration |
| AI - Image Analysis | Claude Sonnet (Vision) | Classification task; Sonnet is cost-efficient at ~1/5th Opus cost |
| AI - Outfit Generation | Claude Sonnet | Structured composition from metadata; Sonnet handles well |
| Real-time | Server-Sent Events | Simpler than WebSockets, works on Vercel, sufficient for one-way status |
| Catalog/Trend Data | Manual seed, architect for automation | Avoids blocking on affiliate network approvals; CSV import from day one |
| Outfit Generation UX | Background job + reveal | Editorial loading state fits the premium design system; streaming as future enhancement |
| Styling | Tailwind CSS 4 | Custom tokens from Stitch "Atelier Editorial" design system |
| Package Manager | pnpm | Fast, disk-efficient |

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 + design system tokens from Stitch "Atelier Editorial"
- **Auth**: Clerk (OAuth, email/password, middleware route protection)
- **Database**: Neon (serverless Postgres)
- **ORM**: Drizzle ORM with Neon serverless adapter
- **File Storage**: Vercel Blob
- **ML/AI**: Anthropic Claude API (claude-sonnet-4-6 for both vision analysis and outfit generation)
- **Real-time**: Server-Sent Events
- **Deployment**: Vercel
- **Package Manager**: pnpm

---

## Project Structure

```
ai-outfit/
├── src/
│   ├── app/                    # App Router pages & layouts
│   │   ├── (auth)/             # Authenticated route group
│   │   │   ├── closet/
│   │   │   ├── outfits/
│   │   │   ├── trends/
│   │   │   ├── catalog/
│   │   │   ├── fit-profile/
│   │   │   ├── profile/
│   │   │   └── page.tsx        # Dashboard
│   │   ├── (public)/           # Public routes
│   │   │   └── shared/outfits/[token]/
│   │   ├── admin/              # Admin route group
│   │   └── api/                # Route Handlers
│   ├── components/
│   │   ├── ui/                 # Design system primitives
│   │   ├── closet/             # Feature-specific components
│   │   ├── outfits/
│   │   ├── trends/
│   │   ├── catalog/
│   │   └── modals/
│   ├── db/
│   │   ├── schema/             # Drizzle schema files
│   │   ├── migrations/
│   │   └── index.ts            # DB client
│   ├── lib/
│   │   ├── ai/                 # Claude API integration
│   │   ├── storage/            # Vercel Blob helpers
│   │   └── affiliates/         # Affiliate link tracking
│   └── hooks/                  # Custom React hooks
├── public/
├── drizzle.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| clerk_id | string, unique | |
| email | string | |
| display_name | string | |
| style_preferences | jsonb | casual/formal/bohemian etc. |
| sizes | jsonb | top, bottom, shoes, dress |
| budget_range | enum | budget/mid/luxury |
| onboarding_state | enum | signup/first_upload/first_processed/first_outfit/complete |
| created_at | timestamp | |
| updated_at | timestamp | |

### closet_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | FK → users | |
| image_url | string | Vercel Blob URL |
| source_url | string, nullable | If pasted from product page |
| status | enum | processing/ready/error |
| category | string | tops/bottoms/shoes/outerwear/accessories |
| sub_category | string | t-shirt/blazer/sneakers etc. |
| colors | jsonb | Array of hex values |
| fit | enum | slim/regular/relaxed/oversized |
| seasonality | jsonb | Array of spring/summer/fall/winter |
| style_tags | jsonb | Array of strings |
| ai_raw_response | jsonb | Full ML output for debugging |
| created_at | timestamp | |
| updated_at | timestamp | |

### products
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| external_id | string, nullable | Partner's product ID |
| name | string | |
| brand | string | |
| description | text | |
| image_url | string | |
| price | decimal | |
| currency | string | Default 'USD' |
| affiliate_url | string | |
| affiliate_network | enum | rakuten/shopstyle/rewardstyle/manual |
| category | string | Same structure as closet_items |
| sub_category | string | |
| colors | jsonb | |
| fit | enum | |
| style_tags | jsonb | |
| is_active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### outfits
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | FK → users | |
| generation_mode | enum | for_you/trend_based/style_this |
| source_trend_id | FK → trends, nullable | |
| source_item_id | FK → closet_items, nullable | For "style this item" mode |
| rating | int 1-5, nullable | |
| feedback | text, nullable | |
| share_token | string, unique, nullable | nanoid, 21 chars |
| ai_raw_response | jsonb | |
| created_at | timestamp | |
| updated_at | timestamp | |

### outfit_slots
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| outfit_id | FK → outfits | |
| slot_type | enum | top/bottom/shoes/outerwear/accessory |
| closet_item_id | FK → closet_items, nullable | One of these two is populated |
| product_id | FK → products, nullable | |
| position | int | Ordering within slot type |

### trends
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| name | string | |
| description | text | |
| hero_image_url | string | |
| momentum_score | int 0-100 | |
| category | enum | luxury/casual/streetwear/bohemian/minimalist |
| season | enum | |
| style_tags | jsonb | |
| peak_date | date, nullable | |
| is_featured | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### trend_products (join table)
| Column | Type | Notes |
|--------|------|-------|
| trend_id | FK → trends | Composite PK |
| product_id | FK → products | |

### affiliate_clicks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | FK → users, nullable | Null for anonymous/public viewers |
| product_id | FK → products | |
| outfit_id | FK → outfits, nullable | |
| trend_id | FK → trends, nullable | |
| placement | string | catalog/outfit_detail/trend_detail/shared_outfit |
| clicked_at | timestamp | |

### saved_trends
| Column | Type | Notes |
|--------|------|-------|
| user_id | FK → users | Composite PK |
| trend_id | FK → trends | |
| saved_at | timestamp | |

### Key schema decisions
- **outfit_slots** polymorphic pattern: each slot references either a closet_item OR a product, allowing outfits to mix owned and shoppable items
- **style_preferences and sizes as JSONB**: flexible enough to evolve without migrations
- **ai_raw_response stored** on closet_items and outfits: invaluable for debugging and reprocessing
- **Affiliate clicks as their own table**: enables analytics by placement, trend, and outfit context

---

## AI Integration

### Image Analysis Pipeline (Closet Upload)

```
User uploads image → Vercel Blob storage → API route triggers analysis
→ Claude Sonnet Vision API → Structured JSON response
→ Update closet_item record → SSE notification to client
```

**Prompt strategy**: Send clothing image with a system prompt requesting structured JSON: category/sub-category, dominant + accent colors (hex), fit, seasonality, style tags (up to 8).

**Model choice**: Claude Sonnet for cost efficiency — vision analysis is a classification task.

**Error handling**: Failed or malformed analysis marks item as `error` status with retry. Raw response stored regardless.

### Outfit Generation Pipeline

```
User selects mode → API route gathers context → Claude Sonnet API
→ Structured outfit composition (JSON with item/product IDs)
→ Save outfit + slots → SSE notification to client
```

**Context per generation mode**:
- **For You**: User's closet items metadata, style preferences, current season, budget range
- **Trend-Based**: Above + trend description, style tags, associated products
- **Style This Item**: Above + anchor item's full attributes

**Key constraint**: LLM receives item metadata (categories, colors, tags), not images. Keeps token costs manageable. Vision analysis has already extracted the semantic information.

**UX**: Background job with editorial loading state, then full reveal. Streaming as future enhancement.

### SSE for Progress Updates

1. Client initiates upload/generation via POST → receives `job_id`
2. Client opens SSE connection to `GET /api/jobs/[id]/status`
3. Server streams status: `processing` → `analyzing_colors` → `detecting_fit` → `ready`
4. Client renders editorial loading state, updates copy per phase

Works within Vercel's streaming response support. No external infrastructure needed.

---

## Authentication & Authorization

### Clerk Integration

**Middleware**: Clerk `authMiddleware` protects `(auth)` and `admin` route groups. Public routes explicitly allowed.

**Roles**: `user` (default) and `admin` (via Clerk metadata).

**User sync**:
```
Clerk signup → webhook (user.created) → POST /api/webhooks/clerk
→ Insert users row with clerk_id → onboarding_state = 'signup'
```

Identity in Clerk; product data (preferences, sizes) in our database.

**Route protection layers**:
1. Clerk middleware — rejects unauthenticated before route handlers
2. Route handlers — verify userId, scope all DB queries to that user
3. Admin routes — check Clerk role in layout, 403 if not admin

### Public Sharing

Opaque share tokens (nanoid, 21 chars) prevent outfit ID enumeration. Public route fetches outfit data without session. Affiliate clicks recorded with `user_id: null`.

---

## Frontend Architecture

### Design System (from Stitch "Atelier Editorial")

**Tailwind tokens**:
- Colors as CSS custom properties: `--surface: #fbf9f6`, `--primary: #974232`, `--on-surface: #1b1c1a`, full surface tier system
- Typography: Noto Serif (headlines, prices, dates), Manrope (body, labels) via `next/font`
- Spacing: Base unit 8px, generous gutters (48px/64px+)
- Border radius: 0px globally ("Rigid Elegance")
- Shadows: Primary-tinted ambient (`rgba(151, 66, 50, 0.06)`, 40px blur)

**Enforced design rules**:
- No borders for sectioning — background color shifts between surface tiers
- No rounded corners — 0px everywhere
- Labels: uppercase, `tracking-widest`
- Serif for headlines, prices, dates
- Left-aligned body text

### Components

**UI primitives** (`src/components/ui/`): Button (primary/secondary/tertiary), Input, Card, Modal shell, Skeleton, Toast, Badge. Built from scratch — the editorial system is too opinionated for generic libraries.

**Modal system**: `ModalProvider` context at app root. Modals opened imperatively via `useModal()` hook, rendered in portal. Focus trapping and keyboard dismiss in shell. 8 modals as standalone components.

### Data Fetching

- Server Components for initial page loads (closet grid, trend feed, catalog)
- Client Components only for interactivity (upload, generation trigger, rating, filters)
- `useOptimistic` for instant UI feedback on mutations

### Image Handling
- `next/image` with Vercel image optimization
- Skeleton shimmer placeholders
- Fallback gradient for broken images

### Layout
- Glassmorphic top nav (surface at 80% opacity, 20px backdrop blur)
- Nav: Dashboard, Closet, Outfits, Trends, Catalog, Profile + notification bell
- No sidebar — single-column editorial layout, ~1200px max-width
- Mobile: bottom tab bar, responsive at 768px and 1024px, grid 1 → 2 → 3-4 columns

---

## API Endpoints

### Closet
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/closet/items | Upload image or URL, returns job_id |
| GET | /api/closet/items | List items (filterable by category, color, season) |
| GET | /api/closet/items/[id] | Single item detail |
| PATCH | /api/closet/items/[id] | Edit AI-detected attributes |
| DELETE | /api/closet/items/[id] | Remove item |
| GET | /api/closet/stats | Category counts, color distribution, readiness |

### Outfits
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/outfits/generate | Trigger generation (mode, source IDs) |
| GET | /api/outfits | List saved outfits |
| GET | /api/outfits/[id] | Outfit detail with populated slots |
| PATCH | /api/outfits/[id]/rate | Submit rating + feedback |
| POST | /api/outfits/[id]/share | Generate share_token |
| DELETE | /api/outfits/[id] | Remove outfit |

### Public
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/shared/outfits/[token] | Public outfit data (no auth) |

### Trends
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/trends | List (filterable) |
| GET | /api/trends/[id] | Detail with products |
| POST | /api/trends/[id]/save | Bookmark |
| DELETE | /api/trends/[id]/save | Unbookmark |

### Catalog
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/catalog/products | Browse (filterable) |
| GET | /api/catalog/products/[id] | Product detail |

### Affiliate
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/affiliate/click | Record click with context |

### Jobs
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/jobs/[id]/status | SSE stream for progress |

### Admin
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/admin/users | Paginated user list |
| GET | /api/admin/analytics | Usage metrics |
| POST | /api/admin/trends | Create trend |
| PATCH | /api/admin/trends/[id] | Edit trend |
| POST | /api/admin/catalog/import | CSV product import |
| GET | /api/admin/outfits | Outfits pending moderation |
| PATCH | /api/admin/outfits/[id] | Approve/reject |

### API conventions
- Clerk `auth()` at top of every protected handler
- Consistent error shape: `{ error: string, code: string }`
- Cursor-based pagination (`?cursor=`) for all list endpoints
- Admin endpoints verify Clerk role

---

## Phased Delivery

### Phase 1: Foundation + Closet
**Delivers**: Working app where users sign up, upload clothes, see AI-analyzed results.

**Scope**:
- Project scaffolding (Next.js 15, Tailwind, Drizzle, Clerk, Neon)
- Design system tokens + UI primitives from Stitch screens
- Database schema: users, closet_items
- Auth flow: sign up, sign in, webhook sync, middleware
- Closet CRUD: upload → Vercel Blob → Claude Vision → SSE progress → display
- Edit AI-detected attributes
- Closet grid with filtering
- Closet stats dashboard
- Empty states, error states, skeleton loaders
- Onboarding milestones: upload, processed (outfit deferred)
- Mobile responsive

**Not included**: Outfit generation, trends, catalog, admin, sharing, notifications, fit intelligence.

### Phase 2: Outfit Generation
**Delivers**: Core value prop — generate, view, rate, and save outfits.

**Scope**:
- Database schema: outfits, outfit_slots
- Generation API: For You and Style This Item modes
- Outfit detail page with slot-by-slot display
- Rating and feedback
- Outfit list/lookbook page
- Editorial loading state during generation
- Onboarding milestone: first outfit generated

**Not included**: Public sharing, trend-based generation, catalog, admin.

### Phase 3: Catalog + Trends + Affiliate
**Delivers**: Browseable products, trend feed, shopping integration, affiliate revenue.

**Scope**:
- Database schema: products, trends, trend_products, affiliate_clicks, saved_trends
- Admin panel: trend CRUD, catalog CSV import, basic dashboard
- Catalog browse + product detail modal
- Trends feed + trend detail page
- Affiliate click tracking
- "Shop Now" in outfit detail
- Trend-based generation mode
- Save/bookmark trends

### Phase 4: Social + Polish
**Delivers**: Sharing, notifications, fit intelligence, admin completion, hardening.

**Scope**:
- Public shared outfit page
- Share token generation
- Notifications (in-app + email via Resend)
- Fit intelligence: measurements, feedback, personalized recs
- Full admin: user management, outfit moderation, analytics
- Onboarding flow polish
- Performance optimization, error boundaries, accessibility audit

---

## Stitch Design Reference

**Project ID**: 5273890100334486731
**Design System**: "Atelier Editorial"

31 screens designed covering all pages, modals, mobile variants, and key states. Screen titles for reference during implementation:

- Dashboard / Home (desktop + mobile)
- Closet Management (desktop + mobile)
- Outfit Detail (desktop + mobile)
- Trends Discovery (desktop + mobile)
- Product Catalog
- User Profile
- Fit Profile
- Public Shared Outfit
- Edit Item Modal, Style Item Modal, Upload & Digitize Modal, Product Detail Modal, Similar Outfits Modal
- Admin: Dashboard, User Management, Trend Management, Catalog Management, Outfit Moderation, Deep-Dive Analytics
- Onboarding: Style Preferences
- States: Empty Closet, Error Upload Failed, Success Outfit Saved, Processing AI Digitization
- Notification Center
