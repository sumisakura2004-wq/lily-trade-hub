import Link from "next/link";
import type { Locale } from "@/lib/locales";
import type { Dictionary } from "@/i18n";
import { LanguageSwitcher } from "./language-switcher";

const sections = ["home", "products", "about", "contact"] as const;

export function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 35C5 31 5 18 8 11c7 1 12 9 12 24Z" fill="currentColor" />
      <path d="M20 35c15-4 15-17 12-24-7 1-12 9-12 24Z" fill="currentColor" opacity=".65" />
      <path d="M20 28C10 18 16 7 20 3c4 4 10 15 0 25Z" fill="currentColor" />
      <path d="M20 9v26" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}

export function ArrowRight() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function SiteHeader({ locale, dictionary: d }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <>
      <a className="skip-link" href="#main-content">{d.common.skip}</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href={`/${locale}#home`} aria-label={d.common.brandHome}>
            <span className="brand-mark"><BrandMark /></span>
            <span className="brand-name">{d.brand.name}<span>{d.brand.subline}</span></span>
          </Link>
          <div className="header-controls">
            <nav aria-label={d.common.mainNavigation}><ul className="nav-list">{sections.map((section) => <li key={section}><Link href={`/${locale}#${section}`}>{d.navigation[section]}</Link></li>)}</ul></nav>
            <LanguageSwitcher locale={locale} label={d.common.language} />
          </div>
        </div>
      </header>
    </>
  );
}

export function SiteFooter({ locale, dictionary: d }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div><Link className="footer-brand" href={`/${locale}#home`}>{d.brand.footer}</Link><p>{d.footer.tagline}</p></div>
        <nav aria-label={d.common.footerNavigation}><ul className="nav-list">{sections.map((section) => <li key={section}><Link href={`/${locale}#${section}`}>{d.navigation[section]}</Link></li>)}</ul></nav>
      </div>
      <div className="container footer-bottom"><span className="demo-label">{d.footer.demo}</span><p>{d.footer.note}</p></div>
    </footer>
  );
}
