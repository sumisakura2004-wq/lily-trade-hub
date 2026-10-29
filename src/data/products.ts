import type { Locale } from "@/lib/locales";

export type Localized<T> = Readonly<Record<Locale, T>>;
export type ReviewStatus = "pending_review" | "verified";
export type PublicationStatus = "pending_review" | "published" | "archived";
export type ProductCategory = "soups" | "drinks" | "dried";
export type ProductSlug = string;

export const categories: readonly ProductCategory[] = ["soups", "drinks", "dried"];

export interface ProductContent {
  readonly name: string;
  readonly summary: string;
  readonly introduction: string;
  readonly imageAlt: string;
  readonly reviewStatus: ReviewStatus;
}

export interface ProductPackaging {
  readonly itemSpec: Localized<string>;
  readonly innerPack: Localized<string>;
  readonly quantityPerCarton: Localized<string>;
  /** Preserve supplied packaging values; do not infer weights. */
  readonly cartonSizeCm: string;
  readonly volumeCbm: string;
  readonly netWeightKg: string;
  readonly grossWeightKg: string;
  readonly reviewStatus: ReviewStatus;
}

export interface ConfirmedMoq {
  readonly quantity: number;
  readonly unit: Localized<string>;
}

interface ConfirmedQuoteTerms {
  readonly amount: number;
  readonly currency: "USD";
  readonly unit: Localized<string>;
  readonly tradeTerm: "FOB";
  readonly portOfLoading: Localized<string>;
  readonly incotermsVersion: "2010" | "2020";
  /** The effective instant is explicit for both fixed and ongoing quotations. */
  readonly validFrom: string;
}

export type ConfirmedQuote = ConfirmedQuoteTerms & (
  | { readonly validityType: "fixed"; readonly validUntil: string }
  | { readonly validityType: "ongoing"; readonly validUntil: null }
);

export interface ProductRecord {
  readonly id: string;
  readonly slug: ProductSlug;
  readonly category: ProductCategory;
  readonly content: Localized<ProductContent>;
  readonly image: { readonly src: string; readonly width: number; readonly height: number };
  readonly packaging: ProductPackaging;
  readonly publicationStatus: PublicationStatus;
  readonly moq: {
    readonly quantity: number | null;
    readonly unit: Localized<string> | null;
    readonly reviewStatus: ReviewStatus;
  };
  readonly quote: {
    readonly amount: number | null;
    readonly currency: string | null;
    readonly unit: Localized<string> | null;
    readonly validUntil: string | null;
    /** Legacy internal quotation fields; never eligible for public disclosure. */
    readonly validFrom?: string | null;
    readonly tradeTerm?: "FOB" | null;
    readonly portOfLoading?: Localized<string> | null;
    readonly incotermsVersion?: "2010" | "2020" | null;
    /** Internal administration only; never projected to the storefront. */
    readonly lastPriceCheckedAt?: string | null;
    readonly nextReviewAt?: string | null;
    readonly reviewStatus: ReviewStatus;
    readonly mode: "inquiry" | "public" | "ongoing";
  };
}

/** Public allowlist: quotation fields are deliberately absent in every mode. */
export interface PublicProduct {
  readonly id: string;
  readonly slug: ProductSlug;
  readonly category: ProductCategory;
  readonly content: Localized<ProductContent>;
  readonly image: ProductRecord["image"];
  readonly packaging: ProductPackaging;
  readonly publicationStatus: "published";
  readonly moq: ConfirmedMoq | null;
}

interface QuotationDisplayRow {
  readonly category: ProductCategory;
  readonly slug: string;
  readonly name: Localized<string>;
  readonly description: Localized<string>;
  readonly introduction: Localized<string>;
  readonly itemSpec: Localized<string>;
  readonly innerPack: Localized<string>;
  readonly quantityPerCarton: Localized<string>;
  readonly cartonSizeCm: string;
  readonly volumeCbm: string;
  readonly netWeightKg: string;
  readonly grossWeightKg: string;
}

// Product copy and packaging remain pending review where indicated.
const rows: readonly QuotationDisplayRow[] = [
  {
    category: "soups", slug: "lily-tremella-lotus-seed-soup-200g",
    name: { zh: "婵乡源百合银耳莲子羹", en: "Chanxiangyuan Lily Tremella Lotus Seed Soup" },
    description: { zh: "即食百合银耳莲子羹。", en: "Ready‑to‑eat Canned Lily, White Fungus & Lotus Seed" },
    introduction: { zh: "200g碗装，资料内包装为6碗/盒，外箱装箱量为4盒/箱。", en: "Presented in 200g bowls. Packaging information lists six bowls per box and four boxes per carton." },
    itemSpec: { zh: "200g/碗", en: "200g/bowl" },
    innerPack: { zh: "200g×6碗/盒", en: "200g×6 bowls/box" },
    quantityPerCarton: { zh: "4盒/箱", en: "4  boxes/carton" },
    cartonSizeCm: "45.5×31.5×27", volumeCbm: "0.0387", netWeightKg: "6.15kg", grossWeightKg: "7.5kg",
  },
  {
    category: "soups", slug: "golden-bowl-lily-tremella-soup-215g",
    name: { zh: "婵乡源金碗百合银耳羹", en: "Chanxiangyuan Golden Bowl Lily Tremella Soup" },
    description: { zh: "即食百合银耳莲子羹（零蔗糖，描述待核对）。", en: "Ready‑to‑eat Canned Lily, White Fungus & Lotus Seed\n（Zero Sucrose）" },
    introduction: { zh: "215g碗装，内包装为6碗/盒。另列4 packs/carton，box与pack的包装层级关系待核对。", en: "Presented in 215g bowls, with six bowls per box. Packaging information also lists four packs per carton; the relationship between box and pack needs confirmation." },
    itemSpec: { zh: "215g/碗", en: "215g/bowl" },
    innerPack: { zh: "215g×6碗/盒", en: "215g×6 bowls/box" },
    quantityPerCarton: { zh: "4组/箱（pack，层级待核对）", en: "4 packs/carton" },
    cartonSizeCm: "55.5×37.5×26.5", volumeCbm: "0.0552", netWeightKg: "7kg", grossWeightKg: "8.1kg",
  },
  {
    category: "drinks", slug: "lily-yi-pi-drink-160ml",
    name: { zh: "婵乡源百合益π饮品", en: "Chanxiangyuan Lily Yi π Drink" },
    description: { zh: "益生菌百合原汁饮品（描述待核对）。", en: "Probiotic Lily Raw Juice Beverage" },
    introduction: { zh: "160ml袋装，资料内包装为8袋/盒，外箱装箱量为12盒/箱。", en: "Presented in 160ml bags. Packaging information lists eight bags per box and twelve boxes per carton." },
    itemSpec: { zh: "160ml/袋", en: "160ml/bag" },
    innerPack: { zh: "160ml×8袋/盒", en: "160ml×8  bags/box" },
    quantityPerCarton: { zh: "12盒/箱", en: "12 boxes/carton" },
    cartonSizeCm: "51×29×31.5", volumeCbm: "0.0466", netWeightKg: "18kg", grossWeightKg: "19.5kg",
  },
  {
    category: "drinks", slug: "lily-yi-pi-drink-350ml",
    name: { zh: "婵乡源百合益π饮品", en: "Chanxiangyuan Lily Yi π Drink" },
    description: { zh: "益生菌百合原汁饮品（描述待核对）。", en: "Probiotic Lily Raw Juice Beverage" },
    introduction: { zh: "350ml罐装，资料内包装为8罐/pack，外箱为4 packs/carton。pack的中文包装名称待核对。", en: "Presented in 350ml cans. Packaging information lists eight cans per pack and four packs per carton." },
    itemSpec: { zh: "350ml/罐", en: "350ml/can" },
    innerPack: { zh: "350ml×8罐/组（pack，层级待核对）", en: "350ml×8 cans/pack" },
    quantityPerCarton: { zh: "4组/箱（pack，层级待核对）", en: "4 packs/carton" },
    cartonSizeCm: "43×34×30.5", volumeCbm: "0.0446", netWeightKg: "13.4kg", grossWeightKg: "14.3kg",
  },
  {
    category: "drinks", slug: "lily-yi-pi-drink-1000ml",
    name: { zh: "婵乡源百合益π饮品", en: "Chanxiangyuan Lily Yi π Drink" },
    description: { zh: "益生菌百合原汁饮品（描述待核对）。", en: "Probiotic Lily Raw Juice Beverage" },
    introduction: { zh: "1000ml罐装，资料内包装为6罐/pack，外箱为2 packs/carton。pack的中文包装名称待核对。", en: "Presented in 1000ml cans. Packaging information lists six cans per pack and two packs per carton." },
    itemSpec: { zh: "1000ml/罐", en: "1000ml/can" },
    innerPack: { zh: "1000ml×6罐/组（pack，层级待核对）", en: "1000ml×6 cans/pack" },
    quantityPerCarton: { zh: "2组/箱（pack，层级待核对）", en: "2 packs/carton" },
    cartonSizeCm: "37.5×27×27.5", volumeCbm: "0.0278", netWeightKg: "13.4kg", grossWeightKg: "14.2kg",
  },
  {
    category: "drinks", slug: "fresh-lily-original-drink-170ml",
    name: { zh: "婵乡源鲜百合原饮", en: "Chanxiangyuan Fresh Lily Original Drink" },
    description: { zh: "益生菌百合原汁饮品（零蔗糖，描述待核对）。", en: "Probiotic Lily Raw Juice Beverage\n（Zero Sucrose）" },
    introduction: { zh: "170ml袋装，资料内包装为7袋/盒，外箱装箱量为12盒/箱。", en: "Presented in 170ml bags. Packaging information lists seven bags per box and twelve boxes per carton." },
    itemSpec: { zh: "170ml/袋", en: "170ml/bag" },
    innerPack: { zh: "170ml×7袋/盒", en: "170ml×7  bags/box" },
    quantityPerCarton: { zh: "12盒/箱", en: "12 boxes/carton" },
    cartonSizeCm: "51×29×31.5", volumeCbm: "0.0466", netWeightKg: "17.05kg", grossWeightKg: "17.8kg",
  },
  {
    category: "drinks", slug: "fresh-lily-original-drink-350ml",
    name: { zh: "婵乡源鲜百合原饮", en: "Chanxiangyuan Fresh Lily Original Drink" },
    description: { zh: "益生菌百合原汁饮品（零蔗糖，描述待核对）。", en: "Probiotic Lily Raw Juice Beverage\n（Zero Sucrose）" },
    introduction: { zh: "350ml罐装，资料内包装为8罐/pack，外箱为4 packs/carton。该规格与170ml袋装分别展示。", en: "Presented in 350ml cans, with eight cans per pack and four packs per carton as listed. This specification is listed separately from the 170ml bag format." },
    itemSpec: { zh: "350ml/罐", en: "350ml/can" },
    innerPack: { zh: "350ml×8罐/组（pack，层级待核对）", en: "350ml×8 cans/pack" },
    quantityPerCarton: { zh: "4组/箱（pack，层级待核对）", en: "4  packs/carton" },
    cartonSizeCm: "43×34×30.5", volumeCbm: "0.0446", netWeightKg: "13.65kg", grossWeightKg: "14.3kg",
  },
  {
    category: "dried", slug: "sulfur-free-dried-lily-110g",
    name: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    description: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    introduction: { zh: "110g罐装百合干，资料装箱量为60罐/箱。箱装重量保留现有资料数值，待核对。", en: "Dried lily in the listed 110g can format, with sixty cans per carton. Carton weights are retained as listed and remain subject to verification." },
    itemSpec: { zh: "110g/罐", en: "110g/can" }, innerPack: { zh: "罐", en: "can" },
    quantityPerCarton: { zh: "60罐/箱", en: "60 cans/carton" },
    cartonSizeCm: "45.5×31.5×27", volumeCbm: "0.0387", netWeightKg: "10.25kg", grossWeightKg: "11kg",
  },
  {
    category: "dried", slug: "sulfur-free-dried-lily-160g",
    name: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    description: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    introduction: { zh: "160g袋装百合干，资料装箱量为40袋/箱。箱装重量保留现有资料数值，待核对。", en: "Dried lily in the listed 160g bag format, with forty bags per carton. Carton weights are retained as listed and remain subject to verification." },
    itemSpec: { zh: "160g/袋", en: "160g/bag" }, innerPack: { zh: "袋", en: "bag" },
    quantityPerCarton: { zh: "40袋/箱", en: "40  bags/carton" },
    cartonSizeCm: "45.5×31.5×27", volumeCbm: "0.0387", netWeightKg: "7.05kg", grossWeightKg: "7.8kg",
  },
  {
    category: "dried", slug: "sulfur-free-dried-lily-200g",
    name: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    description: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    introduction: { zh: "200g盒装百合干，资料装箱量为30盒/箱。箱装重量保留现有资料数值，待核对。", en: "Dried lily in the listed 200g box format, with thirty boxes per carton. Carton weights are retained as listed and remain subject to verification." },
    itemSpec: { zh: "200g/盒", en: "200g/box" }, innerPack: { zh: "盒", en: "box" },
    quantityPerCarton: { zh: "30盒/箱", en: "30 boxes  per carton" },
    cartonSizeCm: "43×35.5×24.5", volumeCbm: "0.0374", netWeightKg: "9.25kg", grossWeightKg: "10kg",
  },
  {
    category: "dried", slug: "sulfur-free-dried-lily-500g",
    name: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    description: { zh: "婵乡源无硫百合干", en: "Chanxiangyuan Sulfur-free Dried Lily Bulbs" },
    introduction: { zh: "500g袋装百合干，资料装箱量为16袋/箱。箱装重量保留现有资料数值，待核对。", en: "Dried lily in the listed 500g bag format, with sixteen bags per carton. Carton weights are retained as listed and remain subject to verification." },
    itemSpec: { zh: "500g/袋", en: "500g/bag" }, innerPack: { zh: "袋", en: "bag" },
    quantityPerCarton: { zh: "16袋/箱", en: "16 bags/carton" },
    cartonSizeCm: "43×35.5×24.5", volumeCbm: "0.0374", netWeightKg: "8.75kg", grossWeightKg: "9.5kg",
  },
];

export const products: readonly ProductRecord[] = rows.map((row, index) => {
  const id = `cxy-${String(index + 1).padStart(2, "0")}`;
  const content = (locale: Locale): ProductContent => ({
    name: row.name[locale],
    summary: row.description[locale],
    introduction: row.introduction[locale],
    imageAlt: `${row.name[locale]} · ${row.itemSpec[locale]}`,
    reviewStatus: "pending_review",
  });

  return {
    id,
    slug: row.slug,
    category: row.category,
    content: { zh: content("zh"), en: content("en") },
    image: { src: `/products/${id}.webp`, width: 1200, height: 1200 },
    packaging: {
      itemSpec: row.itemSpec,
      innerPack: row.innerPack,
      quantityPerCarton: row.quantityPerCarton,
      cartonSizeCm: row.cartonSizeCm,
      volumeCbm: row.volumeCbm,
      netWeightKg: row.netWeightKg,
      grossWeightKg: row.grossWeightKg,
      reviewStatus: "pending_review",
    },
    publicationStatus: "published",
    moq: { quantity: 50, unit: { zh: "箱", en: "cartons" }, reviewStatus: "verified" },
    quote: { amount: null, currency: "USD", unit: null, validUntil: null, reviewStatus: "pending_review", mode: "inquiry" },
  };
});

export const productSlugs: readonly string[] = products.map((product) => product.slug);
