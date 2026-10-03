import type { Product } from "./types";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;

/**
 * Bundled catalog used for browsing when Supabase is not configured.
 * When Supabase env vars are present, the live catalog is loaded instead.
 * This fallback never powers order persistence.
 */
export const sampleProducts: Product[] = [
  {
    id: "sample-1",
    slug: "modern-fabric-sofa",
    title: "Modern Fabric Sofa",
    description:
      "A deep, low-slung sofa in moss bouclé with solid ash feet. Seats two generously.",
    category: "Living Room",
    imageUrl: img("photo-1555041469-a586c61ea9bc"),
    priceCents: 79900,
    currency: "USD",
    material: "Bouclé, solid ash",
    inStock: true,
  },
  {
    id: "sample-2",
    slug: "accent-lounge-chair",
    title: "Accent Lounge Chair",
    description:
      "Sculpted lounge chair in natural linen with a kiln-dried oak frame.",
    category: "Living Room",
    imageUrl: img("photo-1592078615290-033ee584e267"),
    priceCents: 27900,
    currency: "USD",
    material: "Linen, oak",
    inStock: true,
  },
  {
    id: "sample-3",
    slug: "storage-bed-frame",
    title: "Storage Bed Frame",
    description:
      "Platform bed with under-bed drawers, an oak veneer frame, and soft-close hardware.",
    category: "Bedroom",
    imageUrl: img("photo-1505693416388-ac5ce068fe85"),
    priceCents: 74900,
    currency: "USD",
    material: "Oak veneer",
    inStock: true,
  },
  {
    id: "sample-4",
    slug: "linen-duvet-set",
    title: "Washed Linen Duvet Set",
    description:
      "Stone-washed European flax linen that softens further with every wash.",
    category: "Bedroom",
    imageUrl: img("photo-1616627547584-bf28cee262db"),
    priceCents: 18900,
    currency: "USD",
    material: "European flax linen",
    inStock: true,
  },
  {
    id: "sample-5",
    slug: "wooden-dining-table-set",
    title: "Wooden Dining Table Set",
    description:
      "Six-seat dining set in oiled solid walnut, built for daily use and long dinners.",
    category: "Dining Room",
    imageUrl: img("photo-1595526114035-0d45ed16cfbf"),
    priceCents: 59900,
    currency: "USD",
    material: "Solid walnut",
    inStock: true,
  },
  {
    id: "sample-6",
    slug: "ceramic-dinnerware",
    title: "Hand-Thrown Dinnerware Set",
    description:
      "A set for four in reactive glaze stoneware, each piece slightly unique.",
    category: "Dining Room",
    imageUrl: img("photo-1610701596007-11502861dcfa"),
    priceCents: 9800,
    currency: "USD",
    material: "Stoneware",
    inStock: true,
  },
  {
    id: "sample-7",
    slug: "ergonomic-office-chair",
    title: "Ergonomic Office Chair",
    description:
      "Breathable mesh back, adjustable lumbar support, and recycled-aluminium base.",
    category: "Office",
    imageUrl: img("photo-1580480055273-228ff5388ef8"),
    priceCents: 34900,
    currency: "USD",
    material: "Mesh, aluminium",
    inStock: true,
  },
  {
    id: "sample-8",
    slug: "modern-bookshelf",
    title: "Modern Bookshelf",
    description:
      "Open shelving in matte black steel and oak, sized for a full wall or a room divider.",
    category: "Office",
    imageUrl: img("photo-1524758631624-e2822e304c36"),
    priceCents: 22900,
    currency: "USD",
    material: "Oak, steel",
    inStock: true,
  },
  {
    id: "sample-9",
    slug: "outdoor-lounge-set",
    title: "Outdoor Lounge Chair",
    description:
      "Teak-framed lounge chair with weatherproof cushions made for slow afternoons.",
    category: "Outdoor",
    imageUrl: img("photo-1567016432779-094069958ea5"),
    priceCents: 45900,
    currency: "USD",
    material: "Teak, weatherproof fabric",
    inStock: true,
  },
  {
    id: "sample-10",
    slug: "round-coffee-table",
    title: "Round Coffee Table",
    description:
      "Nested-height round table in travertine and blackened steel.",
    category: "Living Room",
    imageUrl: img("photo-1506439773649-6e0eb8cfb237"),
    priceCents: 19900,
    currency: "USD",
    material: "Travertine, steel",
    inStock: true,
  },
  {
    id: "sample-11",
    slug: "ceramic-table-vase",
    title: "Ceramic Table Vase",
    description:
      "Matte-glaze ceramic vase, hand-finished in a warm clay tone.",
    category: "Decor",
    imageUrl: img("photo-1578500494198-246f612d3b3d"),
    priceCents: 4200,
    currency: "USD",
    material: "Ceramic",
    inStock: true,
  },
  {
    id: "sample-12",
    slug: "woven-wool-rug",
    title: "Woven Wool Rug",
    description:
      "Hand-loomed wool rug with a quiet geometric border, 5' x 8'.",
    category: "Decor",
    imageUrl: img("photo-1600166898405-da9535204843"),
    priceCents: 32900,
    currency: "USD",
    material: "Wool",
    inStock: true,
  },
];
