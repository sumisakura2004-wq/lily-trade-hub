import "server-only";

import type {
  Localized,
  ProductContent,
  ProductRecord,
  ReviewStatus,
} from "@/data/products";
import { CatalogUnavailableError } from "./errors";

type Dictionary = Record<string, unknown>;

export interface SanityImageBoundary {
  readonly projectId: string;
  readonly dataset: string;
}

function record(value: unknown): Dictionary {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CatalogUnavailableError();
  }
  return value as Dictionary;
}

function text(value: unknown, maxLength = 10_000): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    throw new CatalogUnavailableError();
  }
  return value;
}

function positiveNumber(value: unknown, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 ||
    (integer && !Number.isSafeInteger(value))) {
    throw new CatalogUnavailableError();
  }
  return value;
}

function nullablePositiveNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : positiveNumber(value);
}

function localized(value: unknown): Localized<string> {
  const object = record(value);
  return { zh: text(object.zh), en: text(object.en) };
}

function nullableLocalized(value: unknown): Localized<string> | null {
  if (value === null || value === undefined) return null;
  const object = record(value);
  // An incomplete unit is never sufficient to publish a commercial value.
  if (object.zh === null || object.zh === undefined || object.zh === "" ||
    object.en === null || object.en === undefined || object.en === "") return null;
  return localized(value);
}

function reviewStatus(value: unknown): ReviewStatus {
  if (value !== "verified" && value !== "pending_review") throw new CatalogUnavailableError();
  return value;
}

function content(value: unknown): ProductContent {
  const object = record(value);
  return {
    name: text(object.name, 300),
    summary: text(object.summary, 2_000),
    introduction: text(object.introduction),
    imageAlt: text(object.imageAlt, 500),
    reviewStatus: reviewStatus(object.reviewStatus),
  };
}

function image(value: unknown, boundary: SanityImageBoundary): ProductRecord["image"] {
  const object = record(value);
  const src = text(object.url, 2_048);
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    throw new CatalogUnavailableError();
  }
  const imagePrefix = `/images/${boundary.projectId}/${boundary.dataset}/`;
  const filename = url.pathname.slice(imagePrefix.length);
  if (url.protocol !== "https:" || url.hostname !== "cdn.sanity.io" || url.port ||
    url.username || url.password || url.search || url.hash ||
    !url.pathname.startsWith(imagePrefix) ||
    !/^[a-zA-Z0-9]+-\d+x\d+\.(?:jpg|jpeg|png|webp|gif)$/.test(filename)) {
    throw new CatalogUnavailableError();
  }
  const width = positiveNumber(object.width, true);
  const height = positiveNumber(object.height, true);
  if (width > 20_000 || height > 20_000) throw new CatalogUnavailableError();
  return { src: url.href, width, height };
}

/** Validate untrusted CMS output before it reaches the public projection. */
export function mapSanityProduct(value: unknown, boundary: SanityImageBoundary, now?: Date): Omit<ProductRecord, "source" | "quote"> {
  // Compatibility with callers that supplied a quotation comparison time.
  // No date, mode or audit status can enable quotation disclosure.
  void now;
  const object = record(value);
  const documentId = text(object._id, 128);
  if (object._type !== "product" || documentId.startsWith("drafts.") ||
    documentId.startsWith("versions.") || object.publicationStatus !== "published") {
    throw new CatalogUnavailableError();
  }
  const id = text(object.productId, 96);
  const slug = text(object.slug, 160);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new CatalogUnavailableError();
  }
  const category = object.category;
  if (category !== "soups" && category !== "drinks" && category !== "dried") {
    throw new CatalogUnavailableError();
  }
  const translations = record(object.content);
  const packaging = record(object.packaging);
  const moq = record(object.moq);
  // Never read object.quote, even when an upstream response includes legacy
  // published prices. The public query and both mapping boundaries omit it.

  return {
    id,
    slug,
    category,
    content: { zh: content(translations.zh), en: content(translations.en) },
    image: image(object.image, boundary),
    packaging: {
      itemSpec: localized(packaging.itemSpec),
      innerPack: localized(packaging.innerPack),
      quantityPerCarton: localized(packaging.quantityPerCarton),
      cartonSizeCm: text(packaging.cartonSizeCm, 200),
      volumeCbm: text(packaging.volumeCbm, 100),
      netWeightKg: text(packaging.netWeightKg, 100),
      grossWeightKg: text(packaging.grossWeightKg, 100),
      reviewStatus: reviewStatus(packaging.reviewStatus),
    },
    publicationStatus: "published",
    moq: {
      quantity: nullablePositiveNumber(moq.quantity),
      unit: nullableLocalized(moq.unit),
      reviewStatus: reviewStatus(moq.reviewStatus),
    },
  };
}
