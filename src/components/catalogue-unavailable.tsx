import { getDictionary } from "@/i18n";
import type { Locale } from "@/lib/locales";

/** A server-rendered notice: no CMS errors, credentials or private records. */
export function CatalogueUnavailable({ locale, retryHref }: { locale: Locale; retryHref: string }) {
  const d = getDictionary(locale);
  return (
    <main className="catalogue-unavailable" id="main-content" tabIndex={-1}>
      <div className="container">
        <p className="eyebrow">{d.hero.eyebrow}</p>
        <h1>{d.availability.title}</h1>
        <p>{d.availability.description}</p>
        <a className="button button-primary" href={retryHref}>{d.availability.retry}</a>
      </div>
    </main>
  );
}
