import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CatalogueUnavailable } from "@/components/catalogue-unavailable";
import { HomePage } from "@/components/home-page";
import { SupplierContact } from "@/components/supplier-contact";
import { getDictionary } from "@/i18n";
import { CatalogUnavailableError, listPublishedProducts } from "@/lib/catalogue";
import { isLocale } from "@/lib/locales";

export const dynamic = "force-dynamic";

// Request-local memoization keeps metadata and the page on the same CMS result.
// Returning null is an availability state, never permission to use old seed data.
const getHomeProducts = cache(async () => {
  try {
    return await listPublishedProducts();
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) throw error;
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const products = await getHomeProducts();
  if (products !== null) return {};
  const d = getDictionary(locale);
  return { title: d.availability.title, description: d.availability.description, robots: { index: false, follow: false } };
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const products = await getHomeProducts();
  if (products === null) return <><CatalogueUnavailable locale={locale} retryHref={`/${locale}`} /><SupplierContact dictionary={getDictionary(locale)} /></>;
  return <HomePage locale={locale} dictionary={getDictionary(locale)} products={products} />;
}
