"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type MouseEvent } from "react";
import { localizedPath, type Locale } from "@/lib/locales";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

function browserSuffix() {
  return window.location.search + window.location.hash;
}

function serverSuffix() {
  return "";
}

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const suffix = useSyncExternalStore(subscribe, browserSuffix, serverSuffix);

  // Next.js hash navigation can use pushState without emitting hashchange.
  // Refresh the destination at activation as well, including modified clicks.
  function syncDestination(event: MouseEvent<HTMLAnchorElement>, language: Locale) {
    event.currentTarget.href = localizedPath(window.location.pathname, language) + browserSuffix();
  }

  return (
    <nav className="language-switcher" aria-label={label}>
      {(["en", "zh"] as const).map((language) => (
        <a key={language} href={`${localizedPath(pathname, language)}${suffix}`} hrefLang={language === "zh" ? "zh-CN" : "en"} lang={language === "zh" ? "zh-CN" : "en"} aria-current={language === locale ? "page" : undefined} onClick={(event) => syncDestination(event, language)} onAuxClick={(event) => syncDestination(event, language)} onContextMenu={(event) => syncDestination(event, language)}>
          {language === "en" ? "EN" : "中文"}
        </a>
      ))}
    </nav>
  );
}
