import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getDictionary } from "@/i18n";
import { isLocale, locales } from "@/lib/locales";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  return { title: { default: d.meta.title, template: `%s | ${d.meta.title}` }, description: d.meta.description, icons: { icon: "/icon.svg" } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body>
        <SiteHeader locale={locale} dictionary={dictionary} />
        {children}
        <SiteFooter locale={locale} dictionary={dictionary} />
      </body>
    </html>
  );
}
