import type { ConfirmedQuote } from "@/data/products";
import type { Locale } from "@/lib/locales";

/** Keep the stored USD precision instead of applying currency's default 2 decimals. */
export function formatFobPrice(quote: ConfirmedQuote, locale: Locale): string {
  const amount = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumSignificantDigits: 21,
  }).format(quote.amount);
  return `USD ${amount} / ${quote.unit[locale]}`;
}

/** The two languages show the same effective instant, independent of host timezone. */
export function formatQuoteDate(value: string, locale: Locale): string {
  const date = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", {
    timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
  return `${date} UTC`;
}
