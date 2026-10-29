import "server-only";

import { cache } from "react";
import type { PublicProduct } from "@/data/products";
import { toPublicProduct } from "./public-product";
import { CatalogUnavailableError } from "./sanity/errors";
import { mapSanityProduct } from "./sanity/mapper";
import { publishedProductBySlugQuery, publishedProductsQuery } from "./sanity/queries";
import { createSanityReadClient, getSanityReadConfiguration } from "./sanity/server-client";

export { toPublicProduct } from "./public-product";
export { CatalogUnavailableError, isCatalogUnavailableError } from "./sanity/errors";

async function readPublishedProducts(slug?: string): Promise<PublicProduct[]> {
  try {
    // Missing/invalid local settings cause no request and never select seeds.
    const configuration = getSanityReadConfiguration();
    const client = createSanityReadClient(configuration);
    const result = await client.fetch<unknown>(
      slug === undefined ? publishedProductsQuery : publishedProductBySlugQuery,
      slug === undefined ? {} : { slug },
      { cache: "no-store", perspective: "published", stega: false },
    );
    if (!Array.isArray(result) || (slug !== undefined && result.length > 1)) {
      throw new CatalogUnavailableError();
    }

    const ids = new Set<string>();
    const slugs = new Set<string>();
    const now = new Date();
    return result.map((document) => {
      const product = mapSanityProduct(document, configuration, now);
      // Bad or duplicate records fail the response, never an arbitrary item.
      if (ids.has(product.id) || slugs.has(product.slug) ||
        (slug !== undefined && product.slug !== slug)) {
        throw new CatalogUnavailableError();
      }
      ids.add(product.id);
      slugs.add(product.slug);
      const publicProduct = toPublicProduct(product, now);
      if (!publicProduct) throw new CatalogUnavailableError();
      return publicProduct;
    });
  } catch {
    // SDK errors may contain response/request data; do not retain or log them.
    throw new CatalogUnavailableError();
  }
}

// React cache deduplicates within a server render, not across buyer requests.
export const listPublishedProducts = cache(async (): Promise<PublicProduct[]> => readPublishedProducts());

export const getPublicProduct = cache(async (slug: string): Promise<PublicProduct | undefined> => {
  if (!/^[a-z0-9][a-z0-9-]{0,159}$/.test(slug)) return undefined;
  const products = await readPublishedProducts(slug);
  return products[0];
});
