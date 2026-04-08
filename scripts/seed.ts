import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { productsTable } from "../src/db/schema/products";
import { trendsTable, trendProductsTable } from "../src/db/schema/trends";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const products = [
  // Tops (5)
  {
    name: "Ivory Silk Blouse",
    brand: "Toteme",
    category: "tops" as const,
    price: 38000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Ivory+Silk+Blouse",
    description: "Relaxed-fit blouse in washed ivory silk with a subtle sheen. Concealed front button placket and dropped shoulders for effortless drape.",
    colors: ["#FFFFF0", "#F5F5DC"],
    sizes: ["XS", "S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/ivory-silk-blouse?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "TOT-ISB-001",
    inStock: 1,
  },
  {
    name: "Cashmere Crewneck",
    brand: "The Row",
    category: "tops" as const,
    price: 89000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Cashmere+Crewneck",
    description: "Ultra-fine gauge cashmere crewneck in charcoal. Slightly oversized silhouette with ribbed cuffs and hem.",
    colors: ["#36454F", "#2F4F4F"],
    sizes: ["XS", "S", "M", "L"],
    affiliateUrl: "https://shop.example.com/product/cashmere-crewneck?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "ROW-CC-001",
    inStock: 1,
  },
  {
    name: "Linen Camp Shirt",
    brand: "Lemaire",
    category: "tops" as const,
    price: 52000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Linen+Camp+Shirt",
    description: "Boxy camp-collar shirt in stone-washed French linen. Relaxed proportions with a single patch pocket.",
    colors: ["#C4B7A6", "#D2C4B0"],
    sizes: ["S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/linen-camp-shirt?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "LEM-LCS-001",
    inStock: 1,
  },
  {
    name: "Merino Turtleneck",
    brand: "Jil Sander",
    category: "tops" as const,
    price: 65000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Merino+Turtleneck",
    description: "Fine-gauge merino wool turtleneck in ink black. Slim fit with folded collar and extended rib hem.",
    colors: ["#1B1B1B", "#0A0A0A"],
    sizes: ["XS", "S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/merino-turtleneck?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "JIL-MT-001",
    inStock: 1,
  },
  {
    name: "Organic Cotton Tee",
    brand: "Studio Nicholson",
    category: "tops" as const,
    price: 18000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Organic+Cotton+Tee",
    description: "Heavyweight organic cotton T-shirt in off-white. Boxy cut with reinforced collar and generous body.",
    colors: ["#FAF0E6", "#FFFFFF"],
    sizes: ["XS", "S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/organic-cotton-tee?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "STN-OCT-001",
    inStock: 1,
  },

  // Bottoms (5)
  {
    name: "Tailored Wide Trousers",
    brand: "Lemaire",
    category: "bottoms" as const,
    price: 68000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Tailored+Wide+Trousers",
    description: "High-waisted wide-leg trousers in taupe virgin wool. Single front pleat with pressed crease and relaxed drape.",
    colors: ["#8B8378", "#C4B7A6"],
    sizes: ["28", "30", "32", "34", "36"],
    affiliateUrl: "https://shop.example.com/product/tailored-wide-trousers?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "LEM-TWT-001",
    inStock: 1,
  },
  {
    name: "Relaxed Denim",
    brand: "Toteme",
    category: "bottoms" as const,
    price: 34000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Relaxed+Denim",
    description: "Mid-rise relaxed straight-leg jeans in washed indigo. Clean lines with no distressing for a refined denim look.",
    colors: ["#3B5998", "#4169E1"],
    sizes: ["25", "26", "27", "28", "29", "30", "31", "32"],
    affiliateUrl: "https://shop.example.com/product/relaxed-denim?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "TOT-RD-001",
    inStock: 1,
  },
  {
    name: "Wool Pleated Pants",
    brand: "The Row",
    category: "bottoms" as const,
    price: 120000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Wool+Pleated+Pants",
    description: "Double-pleated trousers in midnight navy Italian wool. Full-length break with a fluid, architectural silhouette.",
    colors: ["#191970", "#1B1C3A"],
    sizes: ["28", "30", "32", "34", "36"],
    affiliateUrl: "https://shop.example.com/product/wool-pleated-pants?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "ROW-WPP-001",
    inStock: 1,
  },
  {
    name: "Linen Drawstring",
    brand: "Margaret Howell",
    category: "bottoms" as const,
    price: 42000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Linen+Drawstring",
    description: "Relaxed drawstring trousers in natural linen. Elastic waist with internal drawcord and tapered ankle.",
    colors: ["#D2B48C", "#F5DEB3"],
    sizes: ["S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/linen-drawstring?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "MH-LD-001",
    inStock: 1,
  },
  {
    name: "Cuffed Chinos",
    brand: "A.P.C.",
    category: "bottoms" as const,
    price: 29500,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Cuffed+Chinos",
    description: "Slim-straight chinos in olive cotton twill. Turn-up cuffs with a slightly cropped length.",
    colors: ["#556B2F", "#6B8E23"],
    sizes: ["28", "30", "32", "34", "36"],
    affiliateUrl: "https://shop.example.com/product/cuffed-chinos?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "APC-CC-001",
    inStock: 1,
  },

  // Outerwear (5)
  {
    name: "Structured Wool Coat",
    brand: "Max Mara",
    category: "outerwear" as const,
    price: 240000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Structured+Wool+Coat",
    description: "Double-breasted coat in camel virgin wool and cashmere. Notch lapels, flap pockets, and a knee-length silhouette.",
    colors: ["#C19A6B", "#D2B48C"],
    sizes: ["XS", "S", "M", "L"],
    affiliateUrl: "https://shop.example.com/product/structured-wool-coat?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "MM-SWC-001",
    inStock: 1,
  },
  {
    name: "Quilted Liner Jacket",
    brand: "Barbour",
    category: "outerwear" as const,
    price: 35000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Quilted+Liner+Jacket",
    description: "Lightweight quilted liner in heritage olive. Snap front closure with corduroy collar and internal tartan lining.",
    colors: ["#4B5320", "#556B2F"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    affiliateUrl: "https://shop.example.com/product/quilted-liner-jacket?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "BAR-QLJ-001",
    inStock: 1,
  },
  {
    name: "Oversized Trench",
    brand: "Lemaire",
    category: "outerwear" as const,
    price: 185000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Oversized+Trench",
    description: "Deconstructed oversized trench in tobacco cotton gabardine. Storm flap, raglan sleeves, and unlined construction.",
    colors: ["#8B6914", "#A0522D"],
    sizes: ["S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/oversized-trench?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "LEM-OT-001",
    inStock: 1,
  },
  {
    name: "Cashmere Cardigan",
    brand: "Brunello Cucinelli",
    category: "outerwear" as const,
    price: 295000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Cashmere+Cardigan",
    description: "Chunky-knit cashmere cardigan in oatmeal. Shawl collar with horn buttons and ribbed cuffs.",
    colors: ["#E8DCC8", "#D3C4A8"],
    sizes: ["S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/cashmere-cardigan?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "BC-CCA-001",
    inStock: 1,
  },
  {
    name: "Technical Parka",
    brand: "Arc'teryx Veilance",
    category: "outerwear" as const,
    price: 120000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Technical+Parka",
    description: "Gore-Tex Pro shell parka in matte black. Minimalist design with bonded seams, articulated hood, and hidden zip pockets.",
    colors: ["#1B1B1B", "#2C2C2C"],
    sizes: ["S", "M", "L", "XL"],
    affiliateUrl: "https://shop.example.com/product/technical-parka?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "AV-TP-001",
    inStock: 1,
  },

  // Shoes (5)
  {
    name: "Leather Derby",
    brand: "Paraboot",
    category: "shoes" as const,
    price: 52000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Leather+Derby",
    description: "Norwegian-welted derby in cognac calf leather. Chunky rubber sole with Paraboot's signature hand-stitched construction.",
    colors: ["#8B4513", "#A0522D"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    affiliateUrl: "https://shop.example.com/product/leather-derby?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "PAR-LD-001",
    inStock: 1,
  },
  {
    name: "Suede Loafer",
    brand: "The Row",
    category: "shoes" as const,
    price: 89000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Suede+Loafer",
    description: "Soft unstructured loafer in smoke suede. Round toe with a low-stack leather heel and leather sole.",
    colors: ["#708090", "#778899"],
    sizes: ["36", "37", "38", "39", "40", "41"],
    affiliateUrl: "https://shop.example.com/product/suede-loafer?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "ROW-SL-001",
    inStock: 1,
  },
  {
    name: "Canvas Sneaker",
    brand: "Maison Margiela",
    category: "shoes" as const,
    price: 49500,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Canvas+Sneaker",
    description: "Replica low-top sneaker in off-white canvas. Paint-splatter sole with vintage-inspired distressing and cotton laces.",
    colors: ["#F5F5DC", "#FFFFFF"],
    sizes: ["39", "40", "41", "42", "43", "44", "45"],
    affiliateUrl: "https://shop.example.com/product/canvas-sneaker?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "MM-CS-001",
    inStock: 1,
  },
  {
    name: "Chelsea Boot",
    brand: "Common Projects",
    category: "shoes" as const,
    price: 65000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Chelsea+Boot",
    description: "Minimalist Chelsea boot in matte black Italian leather. Slim elastic panels and a crepe sole.",
    colors: ["#1B1B1B", "#0A0A0A"],
    sizes: ["39", "40", "41", "42", "43", "44", "45", "46"],
    affiliateUrl: "https://shop.example.com/product/chelsea-boot?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "CP-CB-001",
    inStock: 1,
  },
  {
    name: "Woven Sandal",
    brand: "Hereu",
    category: "shoes" as const,
    price: 38000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Woven+Sandal",
    description: "Hand-woven leather fisherman sandal in tan. Intrecciato-style upper with adjustable buckle and moulded footbed.",
    colors: ["#D2B48C", "#C19A6B"],
    sizes: ["36", "37", "38", "39", "40", "41", "42"],
    affiliateUrl: "https://shop.example.com/product/woven-sandal?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "HER-WS-001",
    inStock: 1,
  },

  // Accessories (5)
  {
    name: "Leather Tote",
    brand: "Loewe",
    category: "bags" as const,
    price: 240000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Leather+Tote",
    description: "Puzzle Fold tote in sand grained calfskin. Geometric panelling with tubular handles and detachable shoulder strap.",
    colors: ["#C2B280", "#D2B48C"],
    sizes: ["One Size"],
    affiliateUrl: "https://shop.example.com/product/leather-tote?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "LOE-LT-001",
    inStock: 1,
  },
  {
    name: "Cashmere Scarf",
    brand: "Johnstons of Elgin",
    category: "accessories" as const,
    price: 19500,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Cashmere+Scarf",
    description: "Oversized cashmere scarf in heather grey. Ultra-soft hand feel with fringed ends and a lightweight weave.",
    colors: ["#B2BEB5", "#C0C0C0"],
    sizes: ["One Size"],
    affiliateUrl: "https://shop.example.com/product/cashmere-scarf?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "JOE-CS-001",
    inStock: 1,
  },
  {
    name: "Silver Cuff",
    brand: "All Blues",
    category: "accessories" as const,
    price: 34000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Silver+Cuff",
    description: "Polished sterling silver cuff bracelet with an organic, slightly irregular form. Adjustable open-back design.",
    colors: ["#C0C0C0", "#A9A9A9"],
    sizes: ["S/M", "M/L"],
    affiliateUrl: "https://shop.example.com/product/silver-cuff?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "AB-SC-001",
    inStock: 1,
  },
  {
    name: "Ceramic Watch",
    brand: "Rado",
    category: "accessories" as const,
    price: 185000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Ceramic+Watch",
    description: "True Square automatic in matte black high-tech ceramic. Sapphire crystal with minimalist dial and ceramic bracelet.",
    colors: ["#1B1B1B", "#2C2C2C"],
    sizes: ["One Size"],
    affiliateUrl: "https://shop.example.com/product/ceramic-watch?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "RAD-CW-001",
    inStock: 1,
  },
  {
    name: "Leather Belt",
    brand: "Bottega Veneta",
    category: "accessories" as const,
    price: 58000,
    currency: "USD",
    imageUrl: "https://placehold.co/800x1000/f5f3f0/1b1c1a?text=Leather+Belt",
    description: "Intrecciato belt in dark brown nappa leather. Signature woven texture with a polished gold-tone buckle.",
    colors: ["#3E2723", "#5D4037"],
    sizes: ["80", "85", "90", "95", "100"],
    affiliateUrl: "https://shop.example.com/product/leather-belt?ref=outfit-engine",
    affiliateProvider: "example",
    sku: "BV-LB-001",
    inStock: 1,
  },
];

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

const trends = [
  {
    name: "Quiet Luxury",
    slug: "quiet-luxury",
    description: "The art of dressing well without trying too hard. Quiet luxury favors impeccable fabrics, precise tailoring, and a restrained palette over logos and flash. Think investment pieces that whisper rather than shout.",
    heroImageUrl: "https://placehold.co/1200x800/1b1c1a/fbf9f6?text=Quiet+Luxury",
    category: "luxury" as const,
    status: "published" as const,
    momentumScore: 94,
    season: "fall 2024",
    styleTags: ["minimal", "understated", "quality", "neutral"],
  },
  {
    name: "Coastal Grandmother",
    slug: "coastal-grandmother",
    description: "Effortless seaside elegance inspired by linen, lightweight knits, and natural textures. A celebration of timeless coastal living with a sophisticated, relaxed sensibility.",
    heroImageUrl: "https://placehold.co/1200x800/1b1c1a/fbf9f6?text=Coastal+Grandmother",
    category: "classic" as const,
    status: "published" as const,
    momentumScore: 82,
    season: "summer 2024",
    styleTags: ["relaxed", "linen", "coastal", "timeless"],
  },
  {
    name: "Dark Academia",
    slug: "dark-academia",
    description: "A literary-inspired aesthetic rooted in scholarly tradition. Rich textures, structured blazers, and a moody palette evoke the atmosphere of old libraries and ivy-covered halls.",
    heroImageUrl: "https://placehold.co/1200x800/1b1c1a/fbf9f6?text=Dark+Academia",
    category: "classic" as const,
    status: "published" as const,
    momentumScore: 78,
    season: "fall 2024",
    styleTags: ["scholarly", "tweed", "structured", "literary"],
  },
  {
    name: "Dopamine Dressing",
    slug: "dopamine-dressing",
    description: "Bold, mood-boosting fashion that embraces saturated color and playful pattern. Wearing what makes you feel good, translated into vibrant, expressive outfits.",
    heroImageUrl: "https://placehold.co/1200x800/1b1c1a/fbf9f6?text=Dopamine+Dressing",
    category: "streetwear" as const,
    status: "published" as const,
    momentumScore: 71,
    season: "spring 2024",
    styleTags: ["bold", "colorful", "expressive", "joyful"],
  },
  {
    name: "Cyber Noir",
    slug: "cyber-noir",
    description: "A dark, futuristic aesthetic blending technical fabrics with sleek silhouettes. Inspired by dystopian cityscapes, it pairs matte blacks with innovative materials and sharp lines.",
    heroImageUrl: "https://placehold.co/1200x800/1b1c1a/fbf9f6?text=Cyber+Noir",
    category: "avant_garde" as const,
    status: "published" as const,
    momentumScore: 65,
    season: "winter 2024",
    styleTags: ["futuristic", "dark", "technical", "sleek"],
  },
  {
    name: "Raw Minimalism",
    slug: "raw-minimalism",
    description: "Stripped-back design that celebrates raw materials, organic textures, and deconstructed form. A back-to-basics approach to dressing where every piece earns its place.",
    heroImageUrl: "https://placehold.co/1200x800/1b1c1a/fbf9f6?text=Raw+Minimalism",
    category: "minimalism" as const,
    status: "published" as const,
    momentumScore: 88,
    season: "all",
    styleTags: ["organic", "deconstructed", "neutral", "texture"],
  },
];

// ---------------------------------------------------------------------------
// Trend-Product Links (by product name -> trend slug)
// ---------------------------------------------------------------------------

const trendProductLinks: Record<string, string[]> = {
  "quiet-luxury": [
    "Cashmere Crewneck",
    "Wool Pleated Pants",
    "Structured Wool Coat",
    "Suede Loafer",
    "Leather Tote",
  ],
  "coastal-grandmother": [
    "Linen Camp Shirt",
    "Linen Drawstring",
    "Ivory Silk Blouse",
    "Woven Sandal",
    "Cashmere Scarf",
  ],
  "dark-academia": [
    "Merino Turtleneck",
    "Wool Pleated Pants",
    "Leather Derby",
    "Quilted Liner Jacket",
  ],
  "dopamine-dressing": [
    "Organic Cotton Tee",
    "Canvas Sneaker",
    "Cuffed Chinos",
  ],
  "cyber-noir": [
    "Merino Turtleneck",
    "Technical Parka",
    "Chelsea Boot",
    "Ceramic Watch",
  ],
  "raw-minimalism": [
    "Organic Cotton Tee",
    "Tailored Wide Trousers",
    "Oversized Trench",
    "Silver Cuff",
    "Relaxed Denim",
  ],
};

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Seeding database...\n");

  // Use a batch approach: clear, insert products, insert trends, then link
  // Drizzle neon-http doesn't have native transactions, so we delete then insert
  // in order. If anything fails the script can be re-run (idempotent).

  // 1. Clear existing seed data (order matters for FK constraints)
  console.log("Clearing existing data...");
  await db.delete(trendProductsTable);
  await db.delete(trendsTable);
  await db.delete(productsTable);
  console.log("  Cleared trend_products, trends, and products tables.");

  // 2. Insert products
  console.log("\nInserting products...");
  const insertedProducts = await db
    .insert(productsTable)
    .values(products)
    .returning({ id: productsTable.id, name: productsTable.name });
  console.log(`  Inserted ${insertedProducts.length} products.`);

  // Build name -> id map
  const productIdMap = new Map(
    insertedProducts.map((p) => [p.name, p.id])
  );

  // 3. Insert trends
  console.log("\nInserting trends...");
  const insertedTrends = await db
    .insert(trendsTable)
    .values(trends)
    .returning({ id: trendsTable.id, slug: trendsTable.slug });
  console.log(`  Inserted ${insertedTrends.length} trends.`);

  // Build slug -> id map
  const trendIdMap = new Map(
    insertedTrends.map((t) => [t.slug, t.id])
  );

  // 4. Insert trend-product links
  console.log("\nLinking trends to products...");
  const links: { trendId: string; productId: string; position: number }[] = [];

  for (const [trendSlug, productNames] of Object.entries(trendProductLinks)) {
    const trendId = trendIdMap.get(trendSlug);
    if (!trendId) {
      console.warn(`  Warning: trend "${trendSlug}" not found, skipping.`);
      continue;
    }
    productNames.forEach((name, index) => {
      const productId = productIdMap.get(name);
      if (!productId) {
        console.warn(`  Warning: product "${name}" not found, skipping.`);
        return;
      }
      links.push({ trendId, productId, position: index });
    });
  }

  if (links.length > 0) {
    await db.insert(trendProductsTable).values(links);
  }
  console.log(`  Created ${links.length} trend-product links.`);

  console.log("\nSeed complete!");
  console.log(`  Products: ${insertedProducts.length}`);
  console.log(`  Trends: ${insertedTrends.length}`);
  console.log(`  Links: ${links.length}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
