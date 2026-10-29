import type { Locale } from "@/lib/locales";
import { en } from "./en";
import { zh } from "./zh";

export type { Dictionary } from "./en";
const dictionaries = { en, zh };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
