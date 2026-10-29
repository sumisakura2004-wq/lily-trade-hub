"use client";

import Image from "next/image";
import { useState } from "react";
import type { UserViewComponent } from "sanity/structure";
import type { Localized, ProductContent, ProductRecord, ReviewStatus } from "@/data/products";
import { toPublicProduct } from "@/lib/public-product";
import { getDictionary } from "@/i18n";
import { getStudioEnvironment } from "./studio-config";

type Fields = Record<string, unknown>;

function fields(value: unknown): Fields {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Fields
    : {};
}

function text(value: unknown, maxLength = 10_000): string {
  return typeof value === "string" && value.length <= maxLength &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    ? value
    : "";
}

function localized(value: unknown): Localized<string> {
  const object = fields(value);
  return { zh: text(object.zh), en: text(object.en) };
}

function reviewStatus(value: unknown): ReviewStatus {
  return value === "verified" ? "verified" : "pending_review";
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function content(value: unknown): ProductContent {
  const object = fields(value);
  return {
    name: text(object.name, 300), summary: text(object.summary, 2_000),
    introduction: text(object.introduction), imageAlt: text(object.imageAlt, 500),
    reviewStatus: reviewStatus(object.reviewStatus),
  };
}

function previewImage(value: unknown): ProductRecord["image"] | null {
  const environment = getStudioEnvironment();
  const reference = text(fields(fields(value).asset)._ref, 300);
  const parts = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-(jpg|jpeg|png|webp|gif)$/.exec(reference);
  if (!environment || !parts) return null;
  const [, hash, rawWidth, rawHeight, extension] = parts;
  const width = Number(rawWidth);
  const height = Number(rawHeight);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > 20_000 || height > 20_000) return null;
  return {
    src: `https://cdn.sanity.io/images/${environment.projectId}/${environment.dataset}/${hash}-${width}x${height}.${extension}`,
    width, height,
  };
}

/** Only mounted inside authenticated Studio; never creates a public draft API. */
export const ProductPreview: UserViewComponent = ({ document }) => {
  const [locale, setLocale] = useState<"zh" | "en">("zh");
  const displayed = fields(document.displayed);
  const translations = fields(displayed.content);
  const packaging = fields(displayed.packaging);
  const moq = fields(displayed.moq);
  const image = previewImage(displayed.image);
  const moqQuantity = positiveNumber(moq.quantity);
  const category = displayed.category;

  // Preview the current editing buffer, including unpublished documents. This
  // local projection does not publish or change the document's real status.
  // Empty placeholders support incomplete drafts without inventing product data.
  const previewRecord: Omit<ProductRecord, "source" | "quote"> = {
    id: text(displayed.productId, 96), slug: text(fields(displayed.slug).current, 160),
    category: category === "drinks" || category === "dried" ? category : "soups",
    content: { zh: content(translations.zh), en: content(translations.en) },
    image: image ?? { src: "", width: 1, height: 1 },
    packaging: {
      itemSpec: localized(packaging.itemSpec), innerPack: localized(packaging.innerPack),
      quantityPerCarton: localized(packaging.quantityPerCarton),
      cartonSizeCm: text(packaging.cartonSizeCm, 200), volumeCbm: text(packaging.volumeCbm, 100),
      netWeightKg: text(packaging.netWeightKg, 100), grossWeightKg: text(packaging.grossWeightKg, 100),
      reviewStatus: reviewStatus(packaging.reviewStatus),
    },
    publicationStatus: "published",
    moq: {
      quantity: moqQuantity !== null && Number.isSafeInteger(moqQuantity) ? moqQuantity : null,
      unit: localized(moq.unit), reviewStatus: reviewStatus(moq.reviewStatus),
    },
  };
  const product = toPublicProduct(previewRecord);
  if (!product) return <p>无法生成预览 / Preview unavailable</p>;
  const current = product.content[locale];
  const d = getDictionary(locale);
  const missing = locale === "zh" ? "尚未填写" : "Not entered";
  const status = displayed.publicationStatus === "archived"
    ? "已下架 · 不公开展示 / Archived · not public"
    : displayed.publicationStatus === "published"
      ? "已选择发布状态；当前修改可能尚未发布 / Published status; current edits may still be drafts"
      : "待核对 · 不公开展示 / Pending review · not public";
  const packagingRows = [
    [locale === "zh" ? "规格" : "Specification", product.packaging.itemSpec[locale]],
    [locale === "zh" ? "内包装" : "Inner packing", product.packaging.innerPack[locale]],
    [locale === "zh" ? "装箱量" : "Quantity per carton", product.packaging.quantityPerCarton[locale]],
    [locale === "zh" ? "箱尺寸（cm）" : "Carton dimensions (cm)", product.packaging.cartonSizeCm],
    [locale === "zh" ? "箱体积（m³）" : "Volume (m³)", product.packaging.volumeCbm],
    [locale === "zh" ? "箱净重" : "Net weight", product.packaging.netWeightKg],
    [locale === "zh" ? "箱毛重" : "Gross weight", product.packaging.grossWeightKg],
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 16, boxSizing: "border-box", background: "#f3f5f4", color: "#172d25", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ fontSize: 18 }}>手机预览 / Mobile preview</h2>
      <p style={{ fontSize: 13, lineHeight: 1.6 }}>仅管理员可见的当前编辑预览，刷新公开网页需先完成发布。<br />Administrator-only editing preview. Publish changes before refreshing the public website.</p>
      <div aria-label="预览语言 / Preview language" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button type="button" aria-pressed={locale === "zh"} onClick={() => setLocale("zh")} style={{ padding: "8px 14px" }}>中文</button>
        <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")} style={{ padding: "8px 14px" }}>English</button>
      </div>
      <article style={{ maxWidth: 390, margin: "0 auto", background: "white", borderRadius: 20, border: "1px solid #d6e1d9", padding: 20, lineHeight: 1.7, overflowWrap: "anywhere" }}>
        <p style={{ padding: 10, background: "#fff5d6", fontSize: 13, borderRadius: 8 }}>{status}</p>
        {image
          ? <Image unoptimized src={image.src} width={image.width} height={image.height} alt={current.imageAlt} style={{ width: "100%", height: "auto", borderRadius: 12 }} />
          : <p>{locale === "zh" ? "请上传有效的商品图片" : "Upload a valid product image"}</p>}
        <h1 style={{ fontSize: 24 }}>{current.name || missing}</h1>
        {current.reviewStatus !== "verified" && <p style={{ color: "#825c00", fontSize: 13 }}>{locale === "zh" ? "产品文字待核对" : "Product text pending review"}</p>}
        <p style={{ whiteSpace: "pre-wrap" }}>{current.summary || missing}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{current.introduction || missing}</p>
        <h2 style={{ fontSize: 18 }}>{locale === "zh" ? "规格与包装" : "Specifications and packaging"}</h2>
        {product.packaging.reviewStatus !== "verified" && <p style={{ color: "#825c00", fontSize: 13 }}>{locale === "zh" ? "包装资料待核对" : "Packaging pending review"}</p>}
        <dl>{packagingRows.map(([label, value]) => <div key={label} style={{ borderTop: "1px solid #e5ebe7", padding: "8px 0" }}><dt style={{ fontSize: 13, color: "#577063" }}>{label}</dt><dd style={{ margin: 0 }}>{value || missing}</dd></div>)}</dl>
        <h2 style={{ fontSize: 18 }}>MOQ</h2>
        <p>{product.moq ? `${product.moq.quantity} ${product.moq.unit[locale]}` : locale === "zh" ? "请联系供应商确认" : "Contact supplier to confirm"}</p>
        <h2 style={{ fontSize: 18 }}>{locale === "zh" ? "报价" : "Quotation"}</h2>
        <p>{d.common.inquiry}</p>
      </article>
    </div>
  );
};
