# Outfit Engine — Product Overview (Designer Handoff)

## What Is It?

Outfit Engine is an AI-powered personal styling platform. Users upload photos of their clothes, the system analyzes them with ML, and then generates complete outfit recommendations by mixing their wardrobe with shoppable catalog products. It also surfaces real-time fashion trends and lets users shop directly through affiliate links.

**Target audience**: Fashion-conscious adults (18–45) who want curated outfit suggestions tailored to what they already own.

**Core promise**: Your AI stylist — turn your closet into a personal styling engine.

---

## Brand & Visual Identity

| Element | Value |
|---------|-------|
| Aesthetic | Editorial fashion magazine (Vogue / Harper's Bazaar) |
| Primary accent | Warm coral / terracotta `#D4715E` |
| Background | Cream `#F5F3F0`, Ivory cards `#FAF9F7` |
| Text | Ink `#0D0D0D`, Charcoal `#1A1A1A` |
| Headlines | Playfair Display 700 |
| Body | DM Sans 400–600 (base 15px) |
| Labels | DM Sans uppercase, letter-spacing 0.1em |
| Tone | Positive, supportive, stylish but not pretentious — a friendly expert |

**Semantic colors**: Success `#3D7B5F` · Warning `#B8860B` · Error `#A94442` · Info `#4A6B8A`

---

## Core Features

### 1. Closet Management

Users digitize their real wardrobe by uploading photos or pasting product URLs.

- **Upload flow**: Drag-and-drop or URL input → ML processing (1–3 min) → item ready
- **AI extracts**: Category, sub-category, colors, fit, seasonality, style tags
- **User can edit**: Color picker, tag editor, fit adjustment
- **Closet views**: Grid or list, filterable by category
- **Stats dashboard**: Item count by category, color distribution, style tag frequency, outfit readiness score
- **Real-time processing**: WebSocket updates show progress as ML analyzes each item

**Key states**: `processing` → `ready` → `error`

### 2. Outfit Generation

The core value prop. The system composes outfits from a mix of the user's closet items and catalog products.

**Three generation modes**:
1. **For You** — personalized from the user's closet + catalog
2. **Trend-Based** — curated around a specific trend
3. **Style This Item** — "show me outfits with this jacket"

**Outfit structure**: Top + Bottom + Shoes + optional Outerwear/Accessories (slot-based)

**After generation**:
- Rate 1–5 stars with optional written feedback
- Save to personal lookbook
- Share publicly via unique link
- View similar outfit suggestions
- Shop individual items via affiliate links

### 3. Trends Discovery

A feed of current fashion trends, each with momentum scoring and associated products.

- **Trend card**: Hero image, name, description, momentum badge, category, season
- **Filters**: Category (luxury/casual/etc), season, momentum score, featured toggle
- **Trend detail page**: Full description, style tags, peak date, "Generate Outfit from This Trend" CTA
- **Associated products**: Grid of shoppable items linked to each trend
- **Save/bookmark**: One-click trend saving

**Momentum score** (0–100): Aggregated from social mentions, search volume, and editorial coverage.

### 4. Product Catalog

A browseable, shoppable catalog of fashion items from affiliate partners.

- **Filters**: Category, brand, price range, color, fit
- **Product cards**: Image, brand, name, price, "Shop Now" link
- **Product detail modal**: Larger image, full description, price, affiliate CTA
- **Similar products**: Vector-based "more like this" suggestions
- **Infinite scroll** pagination

### 5. Fit Intelligence

AI-powered fit matching based on body measurements and brand preferences.

- Body measurements input
- Brand-specific fit learning
- Fit feedback on past items
- Personalized fit recommendations

### 6. Sharing & Social

- **Public outfit links**: Shareable via unique token (no auth required to view)
- **Social sharing**: Share to external platforms
- **Anonymous shopping**: Public viewers can shop affiliate links without signing up

### 7. Notifications

- **In-app**: Outfit generated, trend saved, closet item processed
- **Email**: Daily trend digest, generation alerts
- **Push**: Browser notifications via Web Push

---

## Key User Flows

### Flow A: New User Onboarding

```
Sign up → Profile setup (style prefs, sizes, budget)
→ First closet upload → ML processing (show progress)
→ View processed item with AI-detected attributes
→ Generate first outfit → Celebrate milestone → Dashboard
```

Onboarding tracks three milestones: item uploaded, item processed, outfit generated.

### Flow B: Daily Use — Generate an Outfit

```
Dashboard → "Generate Outfit" → Choose mode (For You / Trending / Style This)
→ Wait for generation → View outfit composition
→ Rate it → Save or share → Shop individual items
```

### Flow C: Trend Browsing

```
Trends page → Browse/filter → Tap trend card → View detail + products
→ Save trend or generate outfit from trend → Shop products
```

### Flow D: Closet Building

```
Closet page → Upload item (photo or URL) → Wait for processing
→ Review AI attributes → Edit if needed → Repeat
→ View closet analytics → Check outfit readiness
```

### Flow E: Public Sharing

```
View saved outfit → Tap "Share" → Copy unique link
→ Recipient opens link (no login) → Browses outfit → Shops via affiliate links
```

---

## Page Map

### Authenticated Pages

| Page | Path | Purpose |
|------|------|---------|
| Home / Dashboard | `/` | Hero CTA, daily featured outfit, trending styles carousel |
| Closet | `/closet` | Upload, browse, edit, and analyze wardrobe items |
| Outfits | `/outfits` | Browse saved outfits, generate new ones |
| Outfit Detail | `/outfits/[id]` | Full outfit view with per-item shopping + rating |
| Trends | `/trends` | Browse and filter fashion trends |
| Trend Detail | `/trends/[id]` | Trend deep-dive with products and outfit generation |
| Catalog | `/catalog` | Browse and shop affiliate products |
| Fit Profile | `/fit-profile` | Body measurements, fit preferences, fit learning |
| Profile | `/profile` | Account settings, style prefs, sizes, notifications |

### Public Pages

| Page | Path | Purpose |
|------|------|---------|
| Shared Outfit | `/shared/outfits/[token]` | Public outfit view with affiliate shopping |

### Admin Pages

| Page | Path | Purpose |
|------|------|---------|
| Admin Dashboard | `/admin` | Metrics overview |
| User Management | `/admin/users` | User admin |
| Trend Management | `/admin/trends` | Create/edit trends |
| Catalog Management | `/admin/catalog` | Product catalog + CSV import |
| Outfit Moderation | `/admin/outfits` | Review/approve outfits |
| Analytics | `/admin/analytics` | Usage analytics |

---

## Modal Dialogs (8 Total)

Modals are a primary interaction surface. Each is a multi-step or detail-rich experience:

1. **Upload Modal** — Drag-drop image or paste URL, progress indicator
2. **Edit Item Modal** — Color picker, tag editor, fit/seasonality editing
3. **Similar Items Modal** — Grid of visually similar closet items
4. **Style Item Modal** — Occasion/context selection, re-analyze item
5. **Product Detail Modal** — Large image, price, description, "Shop Now"
6. **Similar Outfits Modal** — Trending products that could substitute outfit slots
7. **Fit Feedback Modal** — Rate how an item fits, inform future recommendations
8. **Confirm Modal** — Destructive action confirmation (delete item/outfit)

---

## UX Patterns & States

### Loading
- **Skeleton loaders** (shimmer effect) for grids and cards — not spinners
- **Progress bars** during file upload
- **Real-time status** via WebSocket during ML processing

### Empty States
Every page needs a contextual empty state with a clear CTA:
- Empty closet → "Upload your first item"
- No outfits → "Generate your first outfit"
- No saved trends → "Browse trending styles"

### Error Handling
- Toast notifications (top-right, auto-dismiss)
- Retry buttons on failed operations
- Fallback images for broken product images

### Responsive Breakpoints
- Mobile-first design
- Grid columns: 1 (mobile) → 2 (tablet @ 768px) → 3–4 (desktop @ 1024px+)
- Touch-friendly modals and buttons on mobile

### Animations
- Page transitions: Fade (200ms)
- Button hover: Color shift (150ms)
- Modal open: Scale from center (300ms)
- Skeleton shimmer: Infinite pulse

---

## Data Concepts

These are the core entities a designer should understand:

- **Closet Item** — A user's real clothing item (photo + AI-detected attributes: category, colors, fit, style tags, seasonality)
- **Product** — A catalog item from an affiliate partner (image, brand, price, category, colors)
- **Outfit** — A composed set of items in slots (top, bottom, shoes, outerwear, accessories) — can mix closet items and products
- **Trend** — A named fashion movement with momentum score, season, category, and associated products
- **Affiliate Link** — A tracked shopping link that generates revenue on click/purchase

---

## Monetization

1. **Affiliate commissions** — Every "Shop Now" link is tracked. Revenue generated per click/purchase from partners (Rakuten, RewardStyle, ShopStyle).
2. **Premium features** (future) — Advanced styling, capsule wardrobe suggestions, trend reports.

Affiliate click tracking captures: placement (where in the app), product, trend context, outfit context, and user (or anonymous).

---

## Design Priorities

1. **Editorial quality** — The app should feel like flipping through a fashion magazine, not using a utility tool. Typography, whitespace, and imagery are first-class.
2. **Modal experience** — 8 modals are critical interaction surfaces. They need to feel elegant, not cramped.
3. **Loading states** — Users wait 1–3 minutes for ML processing. Make this feel premium, not painful.
4. **Shopping integration** — Affiliate CTAs should feel natural and inviting, not aggressive or ad-like. Consider showing "total outfit cost" alongside individual prices.
5. **Onboarding** — The first-run experience (upload → process → generate) is make-or-break. It should feel encouraging and visually rewarding at each milestone.
6. **Mobile** — The mobile experience should match desktop sophistication. Fashion is a mobile-first activity for most users.
7. **Empty states** — New users will see many empty states. Each one is a chance to guide and delight.
8. **Accessibility** — Keyboard navigation, focus traps in modals, ARIA labels, sufficient color contrast.
