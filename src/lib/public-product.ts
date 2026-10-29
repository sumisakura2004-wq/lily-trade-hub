import type { Localized, ProductRecord, PublicProduct } from "@/data/products";

function hasLocalizedUnit(unit: Localized<string> | null): unit is Localized<string> {
  return unit !== null && typeof unit.zh === "string" && unit.zh.trim().length > 0 &&
    typeof unit.en === "string" && unit.en.trim().length > 0;
}

/**
 * Final publication boundary for CMS and import validation. This module has
 * no runtime seed data, private archive or credentials. Quotation fields are
 * never accessed, regardless of their mode, verification or effective dates.
 * Copy only reviewed public fields; never spread a CMS/source record.
 */
export function toPublicProduct(product: Omit<ProductRecord, "source" | "quote">, now?: Date): PublicProduct | undefined {
  // Retain the optional argument for local import/validation compatibility.
  // Time can no longer enable a public quotation.
  void now;
  if (product.publicationStatus !== "published") return undefined;

  const moq = product.moq.reviewStatus === "verified" &&
    typeof product.moq.quantity === "number" && Number.isFinite(product.moq.quantity) &&
    product.moq.quantity > 0 && hasLocalizedUnit(product.moq.unit)
    ? { quantity: product.moq.quantity, unit: { zh: product.moq.unit.zh, en: product.moq.unit.en } }
    : null;

  const content = (locale: "zh" | "en") => ({
    name: product.content[locale].name,
    summary: product.content[locale].summary,
    introduction: product.content[locale].introduction,
    imageAlt: product.content[locale].imageAlt,
    reviewStatus: product.content[locale].reviewStatus,
  });
  const localize = (value: Localized<string>) => ({ zh: value.zh, en: value.en });

  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    content: { zh: content("zh"), en: content("en") },
    image: { src: product.image.src, width: product.image.width, height: product.image.height },
    packaging: {
      itemSpec: localize(product.packaging.itemSpec),
      innerPack: localize(product.packaging.innerPack),
      quantityPerCarton: localize(product.packaging.quantityPerCarton),
      cartonSizeCm: product.packaging.cartonSizeCm,
      volumeCbm: product.packaging.volumeCbm,
      netWeightKg: product.packaging.netWeightKg,
      grossWeightKg: product.packaging.grossWeightKg,
      reviewStatus: product.packaging.reviewStatus,
    },
    publicationStatus: "published",
    moq,
  };
}
