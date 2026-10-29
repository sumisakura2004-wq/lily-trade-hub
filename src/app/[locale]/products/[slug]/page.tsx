import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogUnavailableError, getPublicProduct } from "@/lib/catalogue";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/lib/locales";
import { ArrowRight } from "@/components/site-chrome";
import { CatalogueUnavailable } from "@/components/catalogue-unavailable";

type Params = Promise<{ locale: string; slug: string }>;

// Read through the catalogue boundary on each request so a later CMS publish can
// update both existing and newly added slugs without rebuilding product pages.
export const dynamic = "force-dynamic";

async function getPageData(params: Params) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDictionary(locale);
  let product;
  try {
    product = await getPublicProduct(slug);
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) throw error;
    return { unavailable: true as const, locale, slug, d };
  }
  if (!product) notFound();
  return { unavailable: false as const, locale, slug, product, d, copy: product.content[locale] };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await getPageData(params);
  if (data.unavailable) return { title: data.d.availability.title, description: data.d.availability.description, robots: { index: false, follow: false } };
  const { copy } = data;
  return { title: copy.name, description: copy.summary };
}

export default async function ProductPage({ params }: { params: Params }) {
  const data = await getPageData(params);
  if (data.unavailable) return <CatalogueUnavailable locale={data.locale} retryHref={`/${data.locale}/products/${data.slug}`} />;
  const { locale, product, d, copy } = data;
  const fields = d.details.fields;
  const pack = product.packaging;
  const sections = [
    { title: d.details.information, id: "specifications", rows: [
      [fields.reference, product.id],
      [fields.category, d.categories[product.category].name],
      [fields.itemSpec, pack.itemSpec[locale]],
      [fields.innerPack, pack.innerPack[locale]],
      [fields.quantityPerCarton, pack.quantityPerCarton[locale]],
    ] },
    { title: d.details.packaging, id: "packaging", rows: [
      [fields.cartonSizeCm, pack.cartonSizeCm],
      [fields.volumeCbm, pack.volumeCbm],
      [fields.netWeightKg, pack.netWeightKg],
      [fields.grossWeightKg, pack.grossWeightKg],
    ] },
  ];

  return (
    <main className="detail-main" id="main-content" tabIndex={-1}>
      <div className="container">
        <nav className="breadcrumbs" aria-label={d.details.breadcrumb}><ol><li><Link href={`/${locale}#home`}>{d.navigation.home}</Link></li><li><Link href={`/${locale}#products`}>{d.navigation.products}</Link></li><li><span aria-current="page">{copy.name}</span></li></ol></nav>
        <div className="detail-hero">
          <figure className="detail-figure">
            <Image src={product.image.src} alt={copy.imageAlt} width={product.image.width} height={product.image.height} sizes="(max-width: 760px) 100vw, 50vw" preload />
            <figcaption>{d.common.photo}</figcaption>
          </figure>
          <div className="detail-copy">
            <p className="eyebrow">{d.categories[product.category].name} · {product.id}</p>
            <h1 className="detail-title">{copy.name}</h1>
            <p className="detail-pack">{pack.itemSpec[locale]}</p>
            {copy.reviewStatus === "pending_review" && <p className="review-notice"><span className="review-badge">{d.common.pendingReview}</span>{d.details.translationNotice}</p>}
            <p className="detail-summary">{copy.summary}</p>
            <h2 className="detail-overview-heading">{d.details.overview}</h2>
            <p>{copy.introduction}</p>
            <a className="button button-primary detail-contact" href={`/${locale}#contact`}>{d.common.inquiry}<ArrowRight /></a>
            <p className="detail-contact-note">{d.details.contactNote}</p>
          </div>
        </div>

        <p className="specification-notice">{d.details.notice}</p>
        <div className="specification-grid">
          {sections.map((section) => (
            <section className="specification-section section-anchor" id={section.id} key={section.id} aria-labelledby={`${section.id}-heading`}>
              <h2 id={`${section.id}-heading`}>{section.title}</h2>
              <dl className="specification-list">{section.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              {section.id === "packaging" && pack.reviewStatus === "pending_review" && <p className="packaging-notice">{d.details.packagingNotice}</p>}
            </section>
          ))}
          <section className="specification-section commercial-section" aria-labelledby="commercial-heading">
            <h2 id="commercial-heading">{d.details.commercial}</h2>
            <dl className="specification-list">
              <div><dt>{fields.moq}</dt><dd className={product.moq ? undefined : "unconfirmed"}>{product.moq ? `${product.moq.quantity} ${product.moq.unit[locale]}` : d.common.inquiry}</dd></div>
              <div><dt>{fields.quote}</dt><dd><a className="commercial-inquiry-link" href={`/${locale}#contact`}>{d.common.inquiry}<ArrowRight /></a></dd></div>
            </dl>
            <p className="packaging-notice">{d.details.inquiryNotice}</p>
          </section>
        </div>

        <Link className="detail-back detail-bottom-back" href={`/${locale}#products`}>{d.details.back}<span aria-hidden="true"> ↗</span></Link>
      </div>
    </main>
  );
}
