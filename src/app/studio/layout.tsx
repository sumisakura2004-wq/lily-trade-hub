import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "婵乡源产品管理 / Product Studio",
  robots: { index: false, follow: false },
};

// The storefront has its own [locale] root layout. Keep Studio isolated from it.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body style={{ margin: 0 }}>{children}</body></html>;
}
