import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/data/products";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/lib/locales";
import { ArrowRight } from "./site-chrome";
import { SupplierContact } from "./supplier-contact";

const categories = ["soups", "drinks", "dried"] as const;

export function HomePage({
  locale,
  dictionary: d,
  products,
}: {
  locale: Locale;
  dictionary: Dictionary;
  products: readonly PublicProduct[];
}) {
  const heroProduct = products[0];

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="hero section-anchor" id="home" aria-labelledby="hero-heading">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" />{d.hero.eyebrow}</p>
            <h1 id="hero-heading">{d.hero.title} <span>{d.hero.titleEnd}</span></h1>
            <p className="hero-description">{d.hero.description}</p>
            <a className="button button-primary" href="#products">{d.hero.explore} <ArrowRight /></a>
            <p className="hero-audience">{d.hero.audience}</p>
          </div>
          {heroProduct && (
            <figure className="hero-figure">
              <div className="hero-artwork">
                <span className="artwork-label">{d.hero.collection}</span>
                <Image
                  src={heroProduct.image.src}
                  alt={heroProduct.content[locale].imageAlt}
                  width={heroProduct.image.width}
                  height={heroProduct.image.height}
                  sizes="(max-width: 760px) 100vw, 50vw"
                  preload
                />
                <div className="artwork-footer">
                  <span>{String(products.length).padStart(2, "0")} · {d.hero.variants}</span>
                  <span>{d.hero.study}</span>
                </div>
              </div>
              <figcaption>{d.common.photo}</figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="products-section section-anchor section-space" id="products" aria-labelledby="products-heading">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{d.range.eyebrow}</p>
              <h2 id="products-heading">{d.range.title}<br />{d.range.titleEnd}</h2>
            </div>
            <p className="section-intro">{d.range.introduction}</p>
          </div>
          <nav className="category-navigation" aria-label={d.range.navigation}>
            {categories.map((category) => (
              <a href={`#category-${category}`} key={category}>
                {d.categories[category].name}
                <span>{products.filter((product) => product.category === category).length}</span>
              </a>
            ))}
          </nav>
          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category);
            if (categoryProducts.length === 0) return null;
            return (
              <section className="category-group section-anchor" id={`category-${category}`} key={category} aria-labelledby={`category-heading-${category}`}>
                <div className="category-heading">
                  <div><h3 id={`category-heading-${category}`}>{d.categories[category].name}</h3><p>{d.categories[category].description}</p></div>
                  <span>{categoryProducts.length} {d.range.items}</span>
                </div>
                <div className="product-grid">
                  {categoryProducts.map((product) => {
                    const copy = product.content[locale];
                    const number = String(products.indexOf(product) + 1).padStart(2, "0");
                    return (
                      <article className="product-card" key={product.id} aria-labelledby={`product-${product.id}`}>
                        <Link className="product-card-link" href={`/${locale}/products/${product.slug}`} aria-labelledby={`product-${product.id}`}>
                          <figure className="product-figure">
                            <Image src={product.image.src} alt={copy.imageAlt} width={product.image.width} height={product.image.height} sizes="(max-width: 760px) 100vw, (max-width: 1000px) 50vw, 33vw" />
                          </figure>
                          <div className="product-content">
                            <div className="product-title-row"><h4 className="product-title" id={`product-${product.id}`}>{copy.name}</h4><span className="product-number" aria-hidden="true">{number}</span></div>
                            <p className="product-pack"><span>{d.range.pack}</span>{product.packaging.itemSpec[locale]}</p>
                            <p>{copy.summary}</p>
                            <div className="product-card-meta">
                              {copy.reviewStatus === "pending_review" && <span className="review-badge">{d.common.pendingReview}</span>}
                              <span className="product-code">{product.id}</span>
                            </div>
                            <span className="product-details-link">{d.common.viewDetails}<ArrowRight /></span>
                          </div>
                        </Link>
                        <a className="product-inquiry-link" href="#contact">{d.common.inquiry}<ArrowRight /></a>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="about-section section-anchor section-space" id="about" aria-labelledby="about-heading">
        <div className="container about-grid">
          <div className="origin-panel">
            <p className="eyebrow">{d.about.location}</p>
            <p className="origin-statement">{d.about.statement}<br /><em>{d.about.statementEnd}</em></p>
            <svg className="origin-landscape" viewBox="0 0 560 240" fill="none" aria-hidden="true">
              <path d="M0 150 115 59l94 76 111-98 115 95 125-80v188H0Z" fill="#42624d" />
              <path d="M0 186 139 101l116 89L400 87l160 109v44H0Z" fill="#678269" />
              <path d="M-20 223c98-80 168-37 264-2S441 133 590 184M-20 241c98-80 168-37 264-2S441 151 590 202M-20 259c98-80 168-37 264-2S441 169 590 220" stroke="#a3b398" strokeWidth="1.5" />
              <circle cx="432" cy="42" r="23" fill="#d6c8a7" />
            </svg>
            <p className="origin-caption">{d.about.landscape}</p>
          </div>
          <div className="about-copy">
            <p className="eyebrow">{d.about.eyebrow}</p>
            <h2 id="about-heading">{d.about.title}<br />{d.about.titleEnd}</h2>
            <p>{d.about.ingredient}</p>
            <p>{d.about.business}</p>
            <dl className="business-details">
              <div><dt>{d.about.focus}</dt><dd>{d.about.focusValue}</dd></div>
              <div><dt>{d.about.audience}</dt><dd>{d.about.audienceValue}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <SupplierContact dictionary={d} />
    </main>
  );
}
