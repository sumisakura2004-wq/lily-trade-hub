export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function localizedPath(pathname: string, locale: Locale): string {
  return `/${locale}${pathname.replace(/^\/(en|zh)(?=\/|$)/, "")}`;
}
