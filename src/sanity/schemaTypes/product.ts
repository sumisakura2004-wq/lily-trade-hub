import { defineField, defineType, getPublishedId, type ValidationContext } from "sanity";

const reviewOptions = [
  { title: "待核对 / Pending review", value: "pending_review" },
  { title: "已核对 / Verified", value: "verified" },
];

function stringChoice(value: unknown, choices: readonly string[]): true | string {
  return typeof value === "string" && choices.includes(value)
    ? true
    : "请选择列表中的有效选项 / Select a valid option.";
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasBothLanguages(value: unknown): boolean {
  const localized = record(value);
  return Boolean(
    localized &&
      typeof localized.zh === "string" && localized.zh.trim() &&
      typeof localized.en === "string" && localized.en.trim(),
  );
}

/** Uses only the administrator's Studio session; no server token is available here. */
export async function validateUniqueProductId(value: unknown, context: ValidationContext): Promise<true | string> {
  if (typeof value !== "string" || value.length > 96 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return "请输入有效的固定产品编号。";
  }
  try {
    const documentId = context.document?._id;
    if (typeof documentId !== "string" || !documentId) return "无法识别当前产品，请重新打开文档后重试。";
    const publishedId = getPublishedId(documentId);
    const count = await context.getClient({ apiVersion: "2025-02-19" }).fetch<unknown>(
      'count(*[_type == "product" && productId == $productId && !(_id in $selfIds) && !(_id in path("versions.**"))])',
      { productId: value, selfIds: [publishedId, `drafts.${publishedId}`] },
      { perspective: "raw" },
    );
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) return "产品编号核验结果无效，请重试。";
    return count === 0 || "此产品编号已被其他产品使用，请填写独立编号。";
  } catch {
    return "无法核验产品编号唯一性，请检查 CMS 连接后重试；核验完成前不能发布。";
  }
}

export async function validateProductImage(value: unknown, context: ValidationContext): Promise<true | string> {
  const reference = record(record(value)?.asset)?._ref;
  if (typeof reference !== "string" || !/^image-[a-zA-Z0-9]+-\d+x\d+-(?:jpg|jpeg|png|webp|gif)$/.test(reference)) {
    return "请上传 JPG、PNG、WebP 或 GIF 商品图片。";
  }
  try {
    const result = await context.getClient({ apiVersion: "2025-02-19" }).fetch<unknown>(
      '*[_type == "sanity.imageAsset" && _id == $assetId][0]{mimeType, "dimensions": metadata.dimensions}',
      { assetId: reference },
      { perspective: "raw" },
    );
    const asset = record(result);
    const dimensions = record(asset?.dimensions);
    if (!asset || typeof asset.mimeType !== "string" || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(asset.mimeType)) {
      return "无法确认图片格式，或格式不受支持；请重新上传 JPG、PNG、WebP 或 GIF。";
    }
    const width = dimensions?.width;
    const height = dimensions?.height;
    return (typeof width === "number" && Number.isSafeInteger(width) && width > 0 && width <= 20_000 &&
      typeof height === "number" && Number.isSafeInteger(height) && height > 0 && height <= 20_000) ||
      "图片长宽必须是有效正整数，且每边最多 20,000 像素；请缩小图片后重新上传。";
  } catch {
    return "无法核验图片资料，请检查 CMS 连接后重试；核验完成前不能发布。";
  }
}

export function validateConfirmedMoq(value: unknown): true | string {
  const moq = record(value);
  if (!moq || moq.reviewStatus !== "verified") return true;
  return (
    (typeof moq.quantity === "number" && Number.isSafeInteger(moq.quantity) && moq.quantity > 0 && hasBothLanguages(moq.unit)) ||
    "已核对 MOQ 必须包含正整数数量及中英文单位。"
  );
}

export const localizedString = defineType({
  name: "localizedString",
  title: "中英文资料 / Bilingual text",
  type: "object",
  fields: [
    defineField({ name: "zh", title: "中文", type: "string", validation: (rule) => rule.max(10_000) }),
    defineField({ name: "en", title: "English", type: "string", validation: (rule) => rule.max(10_000) }),
  ],
});

export const productContent = defineType({
  name: "productContent",
  title: "产品文字 / Product content",
  type: "object",
  fields: [
    defineField({ name: "name", title: "产品名称 / Name", type: "string", validation: (rule) => rule.required().max(300) }),
    defineField({ name: "summary", title: "简要介绍 / Summary", type: "text", rows: 3, validation: (rule) => rule.required().max(2_000) }),
    defineField({ name: "introduction", title: "详细介绍 / Introduction", type: "text", rows: 5, validation: (rule) => rule.required().max(10_000) }),
    defineField({ name: "imageAlt", title: "商品图片说明 / Image description", type: "string", validation: (rule) => rule.required().max(500) }),
    defineField({
      name: "reviewStatus", title: "文字核对状态 / Content review", type: "string",
      options: { list: reviewOptions, layout: "radio" }, initialValue: "pending_review",
      validation: (rule) => rule.required().custom((value) => stringChoice(value, ["pending_review", "verified"])),
    }),
  ],
});

export const productPackaging = defineType({
  name: "productPackaging",
  title: "规格与包装 / Specifications and packaging",
  type: "object",
  fields: [
    defineField({ name: "itemSpec", title: "单品规格 / Item specification", type: "localizedString", validation: (rule) => rule.required().custom((value) => hasBothLanguages(value) || "请分别填写中英文单品规格。") }),
    defineField({ name: "innerPack", title: "内包装 / Inner packing", type: "localizedString", validation: (rule) => rule.required().custom((value) => hasBothLanguages(value) || "请分别填写中英文内包装。") }),
    defineField({ name: "quantityPerCarton", title: "外箱装箱量 / Quantity per carton", type: "localizedString", validation: (rule) => rule.required().custom((value) => hasBothLanguages(value) || "请分别填写中英文装箱量。") }),
    defineField({ name: "cartonSizeCm", title: "箱尺寸 cm / Carton dimensions", type: "string", description: "保留确认后的原始文字，不自动换算。", validation: (rule) => rule.required().max(200) }),
    defineField({ name: "volumeCbm", title: "箱体积 m³ / Carton volume", type: "string", validation: (rule) => rule.required().max(100) }),
    defineField({ name: "netWeightKg", title: "箱净重 / Net weight", type: "string", validation: (rule) => rule.required().max(100) }),
    defineField({ name: "grossWeightKg", title: "箱毛重 / Gross weight", type: "string", validation: (rule) => rule.required().max(100) }),
    defineField({ name: "reviewStatus", title: "包装资料核对状态 / Packaging review", type: "string", options: { list: reviewOptions }, initialValue: "pending_review", validation: (rule) => rule.required().custom((value) => stringChoice(value, ["pending_review", "verified"])) }),
  ],
});

export const productMoq = defineType({
  name: "productMoq",
  title: "最低订购量 / MOQ",
  type: "object",
  initialValue: { quantity: 50, unit: { zh: "箱", en: "cartons" }, reviewStatus: "verified" },
  validation: (rule) => rule.custom(validateConfirmedMoq),
  fields: [
    defineField({ name: "quantity", title: "MOQ 数量 / Quantity", type: "number", validation: (rule) => rule.integer().positive() }),
    defineField({ name: "unit", title: "MOQ 单位 / Unit", type: "localizedString", description: "数量与单位独立编辑；当前已确认每款 50 箱 / 50 cartons。" }),
    defineField({ name: "reviewStatus", title: "MOQ 核对状态 / MOQ review", type: "string", options: { list: reviewOptions }, initialValue: "verified", validation: (rule) => rule.required().custom((value) => stringChoice(value, ["pending_review", "verified"])) }),
  ],
});

export const productQuote = defineType({
  name: "productQuote",
  title: "旧报价（停用） / Legacy quote (disabled)",
  type: "object",
  readOnly: true,
  description: "网站统一询价，不公开任何报价。此类型仅兼容云端旧字段；隐藏不会自动清除已发布版本、草稿或历史修订，清除须另行授权。/ The website is inquiry-only and never displays quotations. This type preserves legacy field compatibility. Hiding fields does not clear published documents, drafts or revision history; cleanup requires separate authorization.",
  initialValue: { mode: "inquiry", currency: "USD", reviewStatus: "pending_review" },
  fields: [
    defineField({ name: "mode", title: "旧报价方式（不影响公开网站） / Legacy mode (not public)", type: "string", options: { list: [{ title: "旧询价记录 / Legacy inquiry", value: "inquiry" }, { title: "旧固定期限记录（停用） / Legacy fixed term (disabled)", value: "public" }, { title: "旧长期记录（停用） / Legacy ongoing (disabled)", value: "ongoing" }] }, initialValue: "inquiry" }),
    defineField({ name: "amount", title: "旧报价金额 / Legacy amount", type: "number" }),
    defineField({ name: "currency", title: "旧币种 / Legacy currency", type: "string", initialValue: "USD" }),
    defineField({ name: "unit", title: "旧计价单位 / Legacy price basis", type: "localizedString" }),
    defineField({ name: "tradeTerm", title: "旧贸易术语 / Legacy trade term", type: "string" }),
    defineField({ name: "portOfLoading", title: "旧装运港 / Legacy loading port", type: "localizedString" }),
    defineField({ name: "incotermsVersion", title: "旧 Incoterms 版本 / Legacy Incoterms edition", type: "string" }),
    defineField({ name: "validFrom", title: "旧生效时间 / Legacy effective time", type: "datetime" }),
    defineField({ name: "validUntil", title: "旧截止时间 / Legacy expiry", type: "datetime" }),
    defineField({ name: "lastPriceCheckedAt", title: "旧内部核价时间 / Legacy internal price check", type: "datetime" }),
    defineField({ name: "nextReviewAt", title: "旧内部建议复核时间 / Legacy internal review", type: "datetime" }),
    defineField({ name: "reviewStatus", title: "旧报价核对状态 / Legacy quote review", type: "string", options: { list: reviewOptions }, initialValue: "pending_review" }),
  ],
});

export const quotationSource = defineType({
  name: "quotationSource",
  title: "资料来源 / Source reference",
  type: "object",
  description: "仅记载资料定位，不上传原始 Excel、内部报价或来源附件。新增产品可留空。",
  validation: (rule) => rule.custom((value) => {
    if (value === undefined || value === null) return true;
    const source = record(value);
    return Boolean(source && typeof source.workbookName === "string" && source.workbookName.trim() &&
      typeof source.sheet === "string" && source.sheet.trim() &&
      typeof source.row === "number" && Number.isSafeInteger(source.row) && source.row > 0) ||
      "资料来源可整体留空；填写时需完整填写名称、工作表和正整数行号。";
  }),
  fields: [
    defineField({ name: "workbookName", title: "原始资料名称 / Workbook name", type: "string", validation: (rule) => rule.max(300) }),
    defineField({ name: "sheet", title: "工作表 / Sheet", type: "string", validation: (rule) => rule.max(100) }),
    defineField({ name: "row", title: "行号 / Row", type: "number", validation: (rule) => rule.integer().positive() }),
  ],
});

export const product = defineType({
  name: "product",
  title: "产品规格 / Product specification",
  type: "document",
  groups: [
    { name: "basics", title: "基本资料 / Basics", default: true },
    { name: "zh", title: "中文内容" },
    { name: "en", title: "English content" },
    { name: "packaging", title: "规格包装 / Packaging" },
    { name: "commercial", title: "MOQ 与询价 / MOQ and inquiry" },
  ],
  initialValue: {
    publicationStatus: "pending_review",
    category: "soups",
    content: { zh: { reviewStatus: "pending_review" }, en: { reviewStatus: "pending_review" } },
    packaging: { reviewStatus: "pending_review" },
    moq: { quantity: 50, unit: { zh: "箱", en: "cartons" }, reviewStatus: "verified" },
    quote: { mode: "inquiry", currency: "USD", reviewStatus: "pending_review" },
  },
  fields: [
    defineField({ name: "productId", title: "固定产品编号 / Product ID", type: "string", group: "basics", description: "一规格一编号。首次导入保留 cxy-01 至 cxy-11；请勿改用另一款产品编号。", validation: (rule) => rule.required().max(96).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: "小写字母、数字及连字符" }).custom(validateUniqueProductId) }),
    defineField({ name: "slug", title: "产品网址 / URL slug", type: "slug", group: "basics", description: "更改后旧网址将失效；展会二维码上线后请保持稳定。", options: { source: "content.en.name", maxLength: 96 }, validation: (rule) => rule.required().custom((value) => !value?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) || "网址只允许小写英文字母、数字及单个连字符分隔。") }),
    defineField({ name: "category", title: "分类 / Category", type: "string", group: "basics", options: { list: [{ title: "即食羹汤 / Ready-to-eat soups", value: "soups" }, { title: "百合饮品 / Lily drinks", value: "drinks" }, { title: "百合干 / Dried lily", value: "dried" }] }, validation: (rule) => rule.required().custom((value) => stringChoice(value, ["soups", "drinks", "dried"])) }),
    defineField({ name: "publicationStatus", title: "前台发布状态 / Storefront visibility", type: "string", group: "basics", description: "待核对与已下架均不在公开页面展示。选择已下架后仍需点击 Publish 发布这次更改。也可使用 Sanity 的 Unpublish 立即取消线上发布；草稿自动保存不会替代线上版本。", options: { list: [{ title: "待核对（不展示） / Pending review", value: "pending_review" }, { title: "已发布 / Published", value: "published" }, { title: "已下架（不展示） / Archived", value: "archived" }], layout: "radio" }, validation: (rule) => rule.required().custom((value) => stringChoice(value, ["pending_review", "published", "archived"])) }),
    defineField({ name: "image", title: "商品图片 / Product image", type: "image", group: "basics", description: "只上传可公开商品图片。私有数据集的资产 URL 仍可能公开访问，不上传 Excel 或内部资料。长宽每边最多 20,000 像素。", options: { hotspot: true, accept: "image/jpeg,image/png,image/webp,image/gif" }, validation: (rule) => rule.required().custom(validateProductImage) }),
    defineField({ name: "content", title: "中英文内容 / Bilingual content", type: "object", group: ["zh", "en"], validation: (rule) => rule.required(), fields: [
      defineField({ name: "zh", title: "中文（独立编辑）", type: "productContent", validation: (rule) => rule.required() }),
      defineField({ name: "en", title: "English (independently editable)", type: "productContent", validation: (rule) => rule.required() }),
    ] }),
    defineField({ name: "packaging", title: "规格与包装 / Packaging", type: "productPackaging", group: "packaging", validation: (rule) => rule.required() }),
    defineField({ name: "moq", title: "MOQ", type: "productMoq", group: "commercial", description: "全站统一显示“联系供应商获取报价 / Contact Supplier for a Quote”，旧报价模式、金额及生效时间均不会恢复公开价格。云端旧报价尚未自动清除；草稿、已发布版本和历史修订的处理需单独授权。", validation: (rule) => rule.required().custom(validateConfirmedMoq) }),
    defineField({ name: "quote", title: "旧报价（停用） / Legacy quote (disabled)", type: "productQuote", group: "commercial", hidden: true, readOnly: true }),
    defineField({ name: "source", title: "资料来源 / Source", type: "quotationSource", group: "basics" }),
  ],
  preview: {
    select: { title: "content.zh.name", englishName: "content.en.name", productId: "productId", specification: "packaging.itemSpec.zh", status: "publicationStatus", media: "image" },
    prepare({ title, englishName, productId, specification, status, media }) {
      const statusText = status === "published" ? "已发布" : status === "archived" ? "已下架" : "待核对";
      return { title: title || englishName || "新产品 / New product", subtitle: [productId, specification, statusText].filter(Boolean).join(" · "), media };
    },
  },
});
