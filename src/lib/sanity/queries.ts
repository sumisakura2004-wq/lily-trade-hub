// Fixed projections only. Never accept GROQ, a perspective, or an upstream URL
// from a route or browser request. References resolve only on the server.
const publishedProductFilter = `
  _type == "product" && publicationStatus == "published" &&
  !(_id in path("drafts.**")) && !(_id in path("versions.**"))
`;

const productProjection = `{
  _id,
  _type,
  productId,
  "slug": slug.current,
  category,
  "content": {
    "zh": content.zh{name, summary, introduction, imageAlt, reviewStatus},
    "en": content.en{name, summary, introduction, imageAlt, reviewStatus}
  },
  "image": image.asset->{url, "width": metadata.dimensions.width, "height": metadata.dimensions.height},
  "packaging": packaging{
    itemSpec{zh, en}, innerPack{zh, en}, quantityPerCarton{zh, en},
    cartonSizeCm, volumeCbm, netWeightKg, grossWeightKg, reviewStatus
  },
  "moq": moq{quantity, unit{zh, en}, reviewStatus},
  publicationStatus
}`;

export const publishedProductsQuery = `*[${publishedProductFilter}] | order(productId asc) ${productProjection}`;

// Keep at most two matches so duplicate public slugs fail closed rather than
// publishing an arbitrary document. The slug is a query parameter, not GROQ.
export const publishedProductBySlugQuery = `*[${publishedProductFilter} && slug.current == $slug][0...2] ${productProjection}`;
