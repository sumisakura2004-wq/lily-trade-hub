/**
 * Offline policy checks: real catalogue code and rendered page components.
 * No Sanity SDK, .env, host credentials, external request or fixture file.
 * Next Image/Link are inert img/a stand-ins, not a Next HTTP/RSC test.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dependency = createRequire(import.meta.url);
const ts = dependency("typescript");
const React = dependency("react");
const { renderToStaticMarkup } = dependency("react-dom/server");
const { parse, evaluate } = dependency("groq-js");
const allowed = new Set([
  "src/data/products.ts", "src/lib/public-product.ts", "src/lib/fob-quote.ts",
  "src/lib/sanity/mapper.ts", "src/lib/sanity/errors.ts", "src/lib/sanity/server-client.ts",
  "src/lib/sanity/queries.ts", "src/lib/catalogue.ts", "src/lib/locales.ts",
  "src/sanity/schemaTypes/product.ts", "src/sanity/product-preview.tsx", "src/sanity/studio-config.ts",
  "src/i18n/index.ts", "src/i18n/en.ts", "src/i18n/zh.ts",
  "src/components/home-page.tsx", "src/components/site-chrome.tsx", "src/components/supplier-contact.tsx",
  "src/components/language-switcher.tsx", "src/components/catalogue-unavailable.tsx",
  "src/config/company-contact.ts",
  "src/app/[locale]/page.tsx", "src/app/[locale]/layout.tsx", "src/app/[locale]/products/[slug]/page.tsx",
]);
function createLoader({ environment = {}, result = [], sdkError = null, pathname = "/zh", previewLocale = "zh", instant } = {}) {
  const modules = new Map();
  const state = { configurations: [], requests: [] };
  // Never reads, modifies or merges the host process.env.
  const fixedTime = instant === undefined ? undefined : new Date(instant).getTime();
  if (fixedTime !== undefined && !Number.isFinite(fixedTime)) throw new Error("Invalid synthetic clock");
  class FixedDate extends Date {
    constructor(...arguments_) { super(...(arguments_.length ? arguments_ : [fixedTime])); }
    static now() { return fixedTime; }
  }
  const context = vm.createContext({ URL, ...(fixedTime === undefined ? {} : { Date: FixedDate }), process: Object.freeze({ env: Object.freeze({ ...environment }) }) }, { codeGeneration: { strings: false, wasm: false } });
  function loadSource(relativePath) {
    if (!allowed.has(relativePath)) throw new Error(`Blocked module: ${relativePath}`);
    if (modules.has(relativePath)) return modules.get(relativePath).exports;
    const filename = path.join(root, relativePath);
    const output = ts.transpileModule(readFileSync(filename, "utf8"), {
      fileName: filename, reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, strict: true },
    });
    const errors = (output.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error);
    if (errors.length) throw new Error(`Transpilation failed: ${relativePath}`);
    const loadedModule = { exports: {} }; modules.set(relativePath, loadedModule);
    function loadImport(specifier) {
      if (specifier === "server-only" || specifier.endsWith(".css")) return Object.freeze({});
      if (specifier === "react/jsx-runtime") return dependency(specifier);
      if (specifier === "react") return Object.freeze({ ...React, cache: (fn) => fn, ...(relativePath === "src/sanity/product-preview.tsx" ? { useState: () => [previewLocale, () => {}] } : {}) });
      if (specifier === "next/link") return { default: ({ children, href, ...props }) => React.createElement("a", { ...props, href }, children) };
      if (specifier === "next/image") return { default: ({ preload, unoptimized, priority, ...props }) => {
        // These Next-only options have no DOM equivalent in this offline mock.
        void preload; void unoptimized; void priority;
        return React.createElement("img", props);
      } };
      if (specifier === "next/navigation") return { usePathname: () => pathname, notFound: () => { throw new Error("SYNTHETIC_NOT_FOUND"); } };
      if (specifier === "sanity" && relativePath === "src/sanity/schemaTypes/product.ts") return {
        defineField: (value) => value, defineType: (value) => value,
        getPublishedId: (value) => value.startsWith("drafts.") ? value.slice(7) : value,
      };
      if (specifier === "@sanity/client" && relativePath === "src/lib/sanity/server-client.ts") return { createClient: (configuration) => {
        state.configurations.push(configuration);
        return { fetch: async (query, parameters, options) => {
          state.requests.push({ query, parameters, options }); if (sdkError) throw sdkError; return result;
        } };
      } };
      let resolved;
      if (specifier.startsWith("@/")) resolved = `src/${specifier.slice(2)}`;
      else if (specifier.startsWith("./") || specifier.startsWith("../")) resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier));
      else throw new Error(`Blocked external import: ${specifier}`);
      if (resolved === "src/i18n") resolved += "/index.ts";
      if (!/\.tsx?$/.test(resolved)) resolved += allowed.has(`${resolved}.tsx`) ? ".tsx" : ".ts";
      return loadSource(resolved);
    }
    new vm.Script(`(function (exports, require, module) {\n${output.outputText}\n})`, { filename }).runInContext(context, { timeout: 1_000 })(loadedModule.exports, loadImport, loadedModule);
    return loadedModule.exports;
  }
  return { loadSource, state, loadedPaths: () => [...modules.keys()] };
}
// Optional local browser checks may serve these synthetic pages on loopback.
// This script itself starts no server, and writes no HTML/fixture files.
export const renderedInquiryPages = new Map();
const cases = []; let failures = 0;
function check(name, run) { cases.push({ name, run }); }
const plain = (value) => JSON.parse(JSON.stringify(value));
const privateAmount = 98765.432123;
const privateMarker = "SYNTHETIC_PRIVATE_QUOTE_SENTINEL";
const privateKeys = new Set(["quote", "quoteMode", "amount", "currency", "tradeTerm", "portOfLoading", "incotermsVersion", "validFrom", "validUntil", "validityType", "lastPriceCheckedAt", "nextReviewAt", "internalNotes", "internalCost", "serverToken", "token", "source", "workbookName", "sheet", "row"]);
function noCommercial(value) {
  function visit(object) { if (!object || typeof object !== "object") return; for (const [key, nested] of Object.entries(object)) { assert.equal(privateKeys.has(key), false, `Leaked field ${key}`); visit(nested); } }
  visit(value);
  for (const marker of [privateMarker, String(privateAmount), "SYNTHETIC_INTERNAL_SOURCE.xlsx"]) assert.equal(JSON.stringify(value).includes(marker), false, `Leaked value ${marker}`);
}
function noPriceMarkup(html) {
  for (const marker of [privateMarker, String(privateAmount), "SYNTHETIC_INTERNAL_SOURCE.xlsx", "USD", "Incoterms", "FOB", '"offers"', '"price"', '"quote"', '"amount"', '"currency"']) assert.equal(html.includes(marker), false, `Price field/value in markup: ${marker}`);
  assert.equal(/<script[^>]+application\/ld\+json/i.test(html), false, "No JSON-LD offer is generated");
}
try {
  const { loadSource } = createLoader();
  const { products } = loadSource("src/data/products.ts");
  const { toPublicProduct } = loadSource("src/lib/public-product.ts");
  const { getPublicFobQuote, validatePublicFobQuote } = loadSource("src/lib/fob-quote.ts");
  const { mapSanityProduct } = loadSource("src/lib/sanity/mapper.ts");
  const { CatalogUnavailableError } = loadSource("src/lib/sanity/errors.ts");
  const schema = loadSource("src/sanity/schemaTypes/product.ts");
  const queries = loadSource("src/lib/sanity/queries.ts");
  const { companyContact, parseVerifiedWhatsAppUrl, getVerifiedWhatsAppUrl } = loadSource("src/config/company-contact.ts");
  const now = new Date("2030-01-01T00:00:00Z");
  const boundary = { projectId: "localtest", dataset: "production" };
  const validEnvironment = Object.freeze({ NEXT_PUBLIC_SANITY_PROJECT_ID: "localtest", NEXT_PUBLIC_SANITY_DATASET: "production", SANITY_API_READ_TOKEN: "synthetic-local-token-not-a-real-credential-0000" });
  function quotation(mode = "public") {
    return { mode, reviewStatus: "verified", amount: privateAmount, currency: "USD", unit: { zh: privateMarker, en: privateMarker }, tradeTerm: "FOB", portOfLoading: { zh: privateMarker, en: privateMarker }, incotermsVersion: "2020", validFrom: "2020-01-01T00:00:00Z", validUntil: mode === "ongoing" ? null : "2099-01-01T00:00:00Z", lastPriceCheckedAt: "2026-01-01T00:00:00Z", nextReviewAt: "2050-01-01T00:00:00Z", internalNotes: privateMarker };
  }
  function document(index = 0) {
    const item = plain(products[index]);
    return { ...item, _id: `product-${item.id}`, _type: "product", productId: item.id, publicationStatus: "published", quote: quotation(), image: { url: `https://cdn.sanity.io/images/localtest/production/synthetic${index}-1200x1200.webp`, width: 1200, height: 1200 }, source: { workbookName: "SYNTHETIC_INTERNAL_SOURCE.xlsx", sheet: privateMarker, row: 987654321 }, serverToken: privateMarker };
  }
  const mapped = () => mapSanityProduct(document(), boundary, now);
  check("exactly 11 unique stable IDs and slugs", () => {
    assert.equal(products.length, 11); assert.equal(new Set(products.map((item) => item.id)).size, 11); assert.equal(new Set(products.map((item) => item.slug)).size, 11);
    products.forEach((item, index) => assert.equal(item.id, `cxy-${String(index + 1).padStart(2, "0")}`));
  });
  check("category counts remain 2 soups, 5 drinks and 4 dried", () => { for (const [category, count] of [["soups", 2], ["drinks", 5], ["dried", 4]]) assert.equal(products.filter((item) => item.category === category).length, count); });
  check("contact configuration preserves exact company email/name and defaults to no direct WhatsApp URL", () => {
    assert.equal(companyContact.email, "1847820623@qq.com");
    assert.equal(companyContact.whatsappName, "@Lintao Hengdeyuan");
    assert.equal(getVerifiedWhatsAppUrl(), null);
    const source = readFileSync(path.join(root, "src/config/company-contact.ts"), "utf8");
    assert.equal(source.includes("ZVQC54C7DMCRF1"), false, "The withdrawn historical link must not be a default");
  });
  for (const value of [undefined, null, "", " ", "@Lintao Hengdeyuan", "javascript:alert(1)", "http://wa.me/message/ABCDEF", "https://example.com/message/ABCDEF", "https://wa.me.evil.example/message/ABCDEF", "https://user@wa.me/message/ABCDEF", "https://wa.me:444/message/ABCDEF", "https://wa.me/message/ABCDEF#fragment", "https://wa.me/message/ABCDEF?token=secret", "https://wa.me/0123456789", "https://wa.me/123", "https://api.whatsapp.com/send?phone=123456789&text=secret", "https://api.whatsapp.com/send?phone=123456789&phone=987654321", true, 123]) check(`unsafe/unconfirmed WhatsApp configuration rejected: ${String(value)}`, () => {
    assert.equal(parseVerifiedWhatsAppUrl(value), null);
    const contactModule = createLoader({ environment: { COMPANY_VERIFIED_WHATSAPP_URL: value } }).loadSource("src/config/company-contact.ts");
    assert.equal(contactModule.getVerifiedWhatsAppUrl(), null);
  });
  for (const value of ["https://wa.me/message/SYNTHETIC123", "https://wa.me/12345678901", "https://api.whatsapp.com/send?phone=12345678901"]) check(`confirmed URL validation accepts only exact supported format: ${value}`, () => {
    assert.equal(parseVerifiedWhatsAppUrl(value), value);
    assert.equal(createLoader({ environment: { COMPANY_VERIFIED_WHATSAPP_URL: value } }).loadSource("src/config/company-contact.ts").getVerifiedWhatsAppUrl(), value);
  });
  check("all seeds retain verified 50 cartons MOQ and no initialized amount", () => {
    for (const item of products) { assert.equal(item.moq.quantity, 50); assert.equal(item.moq.unit.zh, "箱"); assert.equal(item.moq.unit.en, "cartons"); assert.equal(item.moq.reviewStatus, "verified"); assert.equal(item.quote.mode, "inquiry"); assert.equal(item.quote.amount, null); }
  });
  for (const item of products) check(`${item.id} seed keeps bilingual content/image/packaging, never quote fields`, () => {
    const visible = toPublicProduct(item, now); noCommercial(visible); assert.equal(visible.moq.quantity, 50); assert.equal(visible.image.src, item.image.src); assert.deepEqual(plain(visible.packaging), plain(item.packaging));
    for (const locale of ["zh", "en"]) { assert.equal(visible.content[locale].name, item.content[locale].name); assert.equal(visible.content[locale].introduction, item.content[locale].introduction); }
  });
  check("valid CMS document retains expected public product shape", () => { const item = mapped(); assert.equal(item.id, "cxy-01"); assert.equal(item.slug, products[0].slug); assert.equal(item.image.width, 1200); assert.equal(item.moq.quantity, 50); noCommercial(item); });
  const invalidDocuments = [
    ["null", () => null], ["array", () => []], ["unknown type", (item) => ({ ...item, _type: "other" })],
    ["draft", (item) => ({ ...item, _id: "drafts.product-cxy-01" })], ["release version", (item) => ({ ...item, _id: "versions.release.product-cxy-01" })],
    ["archived", (item) => ({ ...item, publicationStatus: "archived" })], ["pending", (item) => ({ ...item, publicationStatus: "pending_review" })],
    ["unknown category", (item) => ({ ...item, category: "invented" })], ["unsafe slug", (item) => ({ ...item, slug: "../studio" })],
    ["missing Chinese name", (item) => { item.content.zh.name = ""; return item; }],
    ["string MOQ", (item) => { item.moq.quantity = "50"; return item; }], ["nonfinite MOQ", (item) => { item.moq.quantity = Infinity; return item; }],
    ["external image", (item) => { item.image.url = "https://example.invalid/image.webp"; return item; }],
    ["wrong image project", (item) => { item.image.url = item.image.url.replace("/localtest/", "/other/"); return item; }],
    ["wrong image dataset", (item) => { item.image.url = item.image.url.replace("/production/", "/other/"); return item; }],
    ["image URL query", (item) => { item.image.url += "?token=synthetic"; return item; }],
    ["zero image width", (item) => { item.image.width = 0; return item; }], ["oversized image", (item) => { item.image.height = 20001; return item; }],
  ];
  for (const [name, mutate] of invalidDocuments) check(`mapper rejects ${name}`, () => assert.throws(() => mapSanityProduct(mutate(document()), boundary, now), CatalogUnavailableError));
  for (const status of ["archived", "pending_review"]) check(`${status} record has no public projection`, () => assert.equal(toPublicProduct({ ...mapped(), publicationStatus: status }, now), undefined));
  check("unverified MOQ is hidden without hiding valid product", () => { const item = mapped(); item.moq.reviewStatus = "pending_review"; assert.equal(toPublicProduct(item, now).moq, null); });
  check("confirmed MOQ validation retains integer/unit checks", () => {
    assert.equal(schema.validateConfirmedMoq({ quantity: 50, unit: { zh: "箱", en: "cartons" }, reviewStatus: "verified" }), true);
    for (const quantity of [0, -1, "50", true, Infinity, 0.5]) assert.equal(typeof schema.validateConfirmedMoq({ quantity, unit: { zh: "箱", en: "cartons" }, reviewStatus: "verified" }), "string");
    assert.equal(typeof schema.validateConfirmedMoq({ quantity: 50, unit: { zh: "箱", en: "" }, reviewStatus: "verified" }), "string");
  });
  const modes = ["inquiry", "public", "fixed-term", "ongoing", "unknown"];
  const times = [new Date("1990-01-01T00:00:00Z"), now, new Date("2050-01-01T00:00:00Z"), new Date("2200-01-01T00:00:00Z"), new Date(NaN)];
  for (const mode of modes) for (const reviewStatus of ["verified", "pending_review"]) for (let index = 0; index < times.length; index += 1) check(`${mode}/${reviewStatus}/time-${index}: no public quote at every boundary`, () => {
    const item = document(); item.quote = { ...quotation(mode), reviewStatus }; const normalized = mapSanityProduct(item, boundary, times[index]);
    noCommercial(normalized); noCommercial(toPublicProduct(normalized, times[index])); noCommercial(toPublicProduct({ ...products[0], publicationStatus: "published", quote: item.quote }, times[index]));
    assert.equal(getPublicFobQuote(item.quote, times[index]), null); assert.equal(mode === "inquiry" ? validatePublicFobQuote(item.quote) : typeof validatePublicFobQuote(item.quote), mode === "inquiry" ? true : "string");
  });
  for (const [name, quote] of [["missing", undefined], ["null", null], ["array", []], ["scalar", "private"], ["Boolean", true]]) check(`malformed ${name} quotation never affects safe product`, () => { const item = document(); item.quote = quote; const result = toPublicProduct(mapSanityProduct(item, boundary, now), now); assert.equal(result.id, "cxy-01"); noCommercial(result); });
  for (const [name, input] of [["CMS mapper", document()], ["public DTO", { ...products[0], publicationStatus: "published" }]]) check(`${name} never reads hostile quote getter`, () => {
    Object.defineProperty(input, "quote", { enumerable: true, get() { throw new Error("Quotation must not be read"); } }); noCommercial(name === "CMS mapper" ? mapSanityProduct(input, boundary, now) : toPublicProduct(input, now));
  });
  check("disabled compatibility helper reads neither quotation nor time", () => { const hostile = new Proxy({}, { get() { throw new Error("No quote/time access"); } }); assert.equal(getPublicFobQuote(hostile, hostile), null); });
  check("public DTO deeply whitelists nested content, image, packaging and MOQ units", () => {
    const item = { ...plain(products[0]), publicationStatus: "published", unknown: privateMarker }; item.content.zh.amount = privateAmount; item.content.en.internalNotes = privateMarker; item.image.serverToken = privateMarker; item.packaging.internalCost = privateAmount; item.packaging.itemSpec.currency = "USD"; item.moq.unit.internalNotes = privateMarker; noCommercial(toPublicProduct(item, now));
  });
  check("malformed private source references do not break valid product", () => { for (const source of [undefined, null, true, "internal", { row: 0 }]) { const item = document(); item.source = source; noCommercial(toPublicProduct(mapSanityProduct(item, boundary, now), now)); } });
  check("availability errors retain no upstream secret", () => { const error = new CatalogUnavailableError(privateMarker); assert.equal(error.message.includes(privateMarker), false); assert.equal(Object.hasOwn(error, "cause"), false); });
  check("legacy Studio quote is hidden/read-only, optional and has no public-price publication validator", () => {
    const field = schema.product.fields.find((item) => item.name === "quote"); assert.equal(field.hidden, true); assert.equal(field.readOnly, true); assert.equal(field.validation, undefined); assert.equal(schema.productQuote.readOnly, true); assert.equal(schema.productQuote.validation, undefined);
    if (schema.product.initialValue.quote !== undefined) {
      assert.equal(schema.product.initialValue.quote.mode, "inquiry");
      assert.equal(schema.product.initialValue.quote.amount, undefined);
    }
  });
  for (const [name, query] of Object.entries(queries)) check(`${name} excludes all commercial/source fields and unknown spread`, () => {
    assert.equal(/\bquote\b|quoteMode|amount|currency|tradeTerm|portOfLoading|incotermsVersion|validFrom|validUntil|lastPriceCheckedAt|nextReviewAt|internalCost|internalNotes|workbookName|\bsheet\b|\brow\b/.test(query), false);
    assert.equal(query.includes('publicationStatus == "published"'), true); assert.equal(query.includes('path("drafts.**")'), true); assert.equal(query.includes('path("versions.**")'), true); assert.equal(query.includes("..."), name === "publishedProductBySlugQuery", "Only detail slice syntax may contain dots");
  });
  function rawDataset() { return products.flatMap((_, index) => {
    const item = document(index); const assetId = `image-synthetic${index}-1200x1200-webp`;
    return [{ ...item, slug: { current: item.slug }, image: { asset: { _ref: assetId } }, quote: quotation(modes[index % modes.length]) }, { _id: assetId, _type: "sanity.imageAsset", url: item.image.url, metadata: { dimensions: { width: 1200, height: 1200 } } }];
  }); }
  check("real GROQ returns 11 safe products and excludes drafts/releases/archived/pending", async () => {
    const dataset = rawDataset(); const sample = dataset[0]; dataset.push({ ...sample, _id: "drafts.product-private" }, { ...sample, _id: "versions.release.product-private" }, { ...sample, _id: "archived-product", publicationStatus: "archived" }, { ...sample, _id: "pending-product", publicationStatus: "pending_review" });
    const result = await (await evaluate(parse(queries.publishedProductsQuery), { dataset })).get(); assert.equal(result.length, 11); noCommercial(result); for (const item of result) noCommercial(toPublicProduct(mapSanityProduct(item, boundary, now), now));
  });
  for (const product of products) check(`${product.id} real parameterized detail GROQ excludes commercial data`, async () => { const result = await (await evaluate(parse(queries.publishedProductBySlugQuery), { dataset: rawDataset(), params: { slug: product.slug } })).get(); assert.equal(result.length, 1); assert.equal(result[0].productId, product.id); noCommercial(result); });
  function adapter({ environment = validEnvironment, result = [document()], sdkError = null } = {}) { const loader = createLoader({ environment, result, sdkError }); return { ...loader, ...loader.loadSource("src/lib/catalogue.ts"), ErrorType: loader.loadSource("src/lib/sanity/errors.ts").CatalogUnavailableError }; }
  function noRequest(instance) { assert.equal(instance.state.configurations.length, 0); assert.equal(instance.state.requests.length, 0); }
  async function unavailable(instance, run) { await assert.rejects(run, (error) => { assert.equal(error instanceof instance.ErrorType, true); assert.equal(error.message, "The product catalogue is temporarily unavailable."); assert.equal(Object.hasOwn(error, "cause"), false); assert.equal(JSON.stringify(error).includes(privateMarker), false); return true; }); }
  check("adapter module is inert without environment or seed load", () => { const instance = adapter({ environment: {} }); noRequest(instance); assert.equal(instance.loadedPaths().includes("src/data/products.ts"), false); });
  for (const method of ["list", "detail"]) check(`missing configuration refuses ${method} with no SDK/static fallback`, async () => { const instance = adapter({ environment: {} }); await unavailable(instance, () => method === "list" ? instance.listPublishedProducts() : instance.getPublicProduct(products[0].slug)); noRequest(instance); });
  const badConfigurations = [["missing token", { ...validEnvironment, SANITY_API_READ_TOKEN: undefined }], ["short token", { ...validEnvironment, SANITY_API_READ_TOKEN: "short" }], ["whitespace token", { ...validEnvironment, SANITY_API_READ_TOKEN: "synthetic token with spaces-00000" }], ["invalid project", { ...validEnvironment, NEXT_PUBLIC_SANITY_PROJECT_ID: "../unsafe" }], ["invalid dataset", { ...validEnvironment, NEXT_PUBLIC_SANITY_DATASET: "bad dataset" }]];
  for (const [name, environment] of badConfigurations) check(`adapter rejects ${name} before SDK creation`, async () => { const instance = adapter({ environment }); await unavailable(instance, () => instance.listPublishedProducts()); noRequest(instance); });
  check("configured list uses published/no-CDN/no-store, never returns server token", async () => {
    const instance = adapter(); const result = await instance.listPublishedProducts(); assert.equal(result.length, 1); noCommercial(result);
    const config = instance.state.configurations[0]; assert.equal(config.token, validEnvironment.SANITY_API_READ_TOKEN); assert.equal(config.perspective, "published"); assert.equal(config.useCdn, false); assert.equal(config.stega, false); assert.equal(config.maxRetries, 0); assert.equal(config.timeout, 10000);
    assert.equal(instance.state.requests[0].query, queries.publishedProductsQuery); assert.deepEqual(plain(instance.state.requests[0].parameters), {}); assert.deepEqual(plain(instance.state.requests[0].options), { cache: "no-store", perspective: "published", stega: false }); assert.equal(JSON.stringify(result).includes(validEnvironment.SANITY_API_READ_TOKEN), false); assert.equal(instance.loadedPaths().includes("src/data/products.ts"), false);
  });
  check("detail slug stays a parameter in the fixed query", async () => { const instance = adapter(); const result = await instance.getPublicProduct(products[0].slug); assert.equal(result.id, "cxy-01"); noCommercial(result); const request = instance.state.requests[0]; assert.equal(request.query, queries.publishedProductBySlugQuery); assert.equal(request.query.includes(products[0].slug), false); assert.deepEqual(plain(request.parameters), { slug: products[0].slug }); assert.equal(request.options.cache, "no-store"); });
  check("empty catalogue has no seed fallback", async () => assert.equal((await adapter({ result: [] }).listPublishedProducts()).length, 0));
  check("removed seed slug has no seed fallback", async () => assert.equal(await adapter({ result: [] }).getPublicProduct(products[0].slug), undefined));
  check("SDK exceptions discard secret response data", async () => { const error = new Error(privateMarker); error.response = { token: privateMarker }; const instance = adapter({ sdkError: error }); await unavailable(instance, () => instance.listPublishedProducts()); });
  for (const [name, result] of [["non-array", { error: privateMarker }], ["malformed record", [document(), { _id: "broken" }]], ["multiple detail matches", [document(), document()]]]) check(`adapter fails closed: ${name}`, async () => { const instance = adapter({ result }); await unavailable(instance, () => name === "multiple detail matches" ? instance.getPublicProduct(products[0].slug) : instance.listPublishedProducts()); });
  check("duplicate IDs refuse entire list", async () => { const second = document(); second._id = "product-second"; second.slug = "different-slug"; const instance = adapter({ result: [document(), second] }); await unavailable(instance, () => instance.listPublishedProducts()); });
  check("duplicate slugs refuse entire list", async () => { const second = document(1); second.slug = document().slug; const instance = adapter({ result: [document(), second] }); await unavailable(instance, () => instance.listPublishedProducts()); });
  check("mismatched detail slug fails closed", async () => { const item = document(); item.slug = "different-slug"; const instance = adapter({ result: [item] }); await unavailable(instance, () => instance.getPublicProduct(products[0].slug)); });
  for (const [name, mutate] of invalidDocuments.filter(([name]) => ["draft", "release version", "archived", "pending"].includes(name))) check(`native Publish cannot bypass ${name} gate despite verified old price`, async () => { const instance = adapter({ result: [mutate(document())] }); await unavailable(instance, () => instance.listPublishedProducts()); });
  for (const slug of ["../studio", 'test"] | *[true]', "UPPERCASE", "", "bad%2fslug"]) check(`unsafe slug rejected before SDK: ${JSON.stringify(slug)}`, async () => { const instance = adapter(); assert.equal(await instance.getPublicProduct(slug), undefined); noRequest(instance); });
  for (const mode of modes) check(`adapter omits historical ${mode} price fields`, async () => { const item = document(); item.quote = quotation(mode); const result = await adapter({ result: [item] }).listPublishedProducts(); assert.equal(result.length, 1); noCommercial(result); });
  check("adapter does not access hostile historical quote getter", async () => { const item = document(); Object.defineProperty(item, "quote", { enumerable: true, get() { throw new Error("Do not read quote"); } }); noCommercial(await adapter({ result: [item] }).listPublishedProducts()); });
  const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8").replace(/^@import\s+["']tailwindcss["'];\s*/m, "");
  const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  async function renderWebsite(locale, seedIndex = null, sdkError = null, { quote, instant, environment = validEnvironment } = {}) {
    const pathname = seedIndex === null ? `/${locale}` : `/${locale}/products/${products[seedIndex].slug}`;
    const records = seedIndex === null ? products.map((_, index) => document(index)) : [document(seedIndex)];
    if (quote !== undefined) for (const item of records) if (item.productId === "cxy-01") item.quote = quote;
    const loader = createLoader({ environment, result: records, pathname, sdkError, instant });
    const page = loader.loadSource(seedIndex === null ? "src/app/[locale]/page.tsx" : "src/app/[locale]/products/[slug]/page.tsx"); const layout = loader.loadSource("src/app/[locale]/layout.tsx");
    const params = Promise.resolve({ locale, ...(seedIndex === null ? {} : { slug: products[seedIndex].slug }) });
    const metadata = await page.generateMetadata({ params }); const layoutMetadata = await layout.generateMetadata({ params }); noCommercial(metadata); noCommercial(layoutMetadata);
    const tree = await layout.default({ params, children: await page.default({ params }) });
    const title = typeof metadata.title === "string" ? metadata.title : layoutMetadata.title.default;
    const html = ("<!doctype html>" + renderToStaticMarkup(tree)).replace("<head>", `<head><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(metadata.description ?? layoutMetadata.description)}"><style>${css}</style>`);
    noPriceMarkup(html); return { pathname, html, metadata };
  }
  for (const locale of ["zh", "en"]) {
    const label = locale === "zh" ? "联系供应商获取报价" : "Contact Supplier for a Quote";
    check(`${locale} homepage: all 11 cards, native inquiry anchors, real focusable contact target and no prices`, async () => {
      const fixture = await renderWebsite(locale); assert.equal((fixture.html.match(/class="product-card"/g) ?? []).length, 11);
      const anchors = [...fixture.html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter((match) => match[1].includes("product-inquiry-link")); assert.equal(anchors.length, 11);
      for (const [, attrs, body] of anchors) { assert.equal(attrs.includes('href="#contact"'), true); assert.equal(body.includes(label), true); assert.equal(/aria-disabled|tabindex="-1"/.test(attrs), false); }
      assert.equal(/<section[^>]*id="contact"[^>]*tabindex="-1"/.test(fixture.html) || /<section[^>]*tabindex="-1"[^>]*id="contact"/.test(fixture.html), true);
      for (const product of products) { assert.equal(fixture.html.includes(escape(product.content[locale].name)), true); assert.equal(fixture.html.includes(`/${locale}/products/${product.slug}`), true); }
      assert.equal(fixture.html.includes("scroll-behavior: smooth"), true); assert.equal(fixture.html.includes("prefers-reduced-motion: reduce"), true); renderedInquiryPages.set(fixture.pathname, fixture.html);
    });
    check(`${locale} CMS-unavailable homepage retains contact target without stale products/prices`, async () => {
      const fixture = await renderWebsite(locale, null, new Error(privateMarker)); assert.equal(fixture.html.includes('id="contact"'), true); assert.equal(fixture.html.includes('class="product-card"'), false); assert.equal(fixture.metadata.robots.index, false);
    });
    for (const unavailable of [false, true]) check(`${locale} contact ${unavailable ? "during CMS outage" : "on the homepage"} keeps exact email and non-clickable WhatsApp name`, async () => {
      const fixture = await renderWebsite(locale, null, unavailable ? new Error(privateMarker) : null);
      const contact = /<section\b[^>]*\bid="contact"[^>]*>[\s\S]*?<\/section>/.exec(fixture.html)?.[0];
      assert.equal(typeof contact, "string", "The real contact section must exist");
      assert.equal(contact.includes("WhatsApp Business"), true);
      assert.equal(contact.includes("@Lintao Hengdeyuan"), true);
      assert.equal(contact.includes("1847820623@qq.com"), true);
      const anchors = [...contact.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
      assert.equal(anchors.length, 1, "Only the approved company email has a direct link until an official WhatsApp URL is supplied");
      assert.equal(anchors.filter(([, attrs]) => attrs.includes('href="mailto:1847820623@qq.com"')).length, 1);
      assert.equal(/wa\.me|api\.whatsapp\.com|ZVQC54C7DMCRF1/.test(contact), false, "Do not expose a guessed or withdrawn WhatsApp URL");
      assert.equal(/<button\b|aria-disabled|href="(?:#|)"/.test(contact), false, "No disabled or empty fake WhatsApp control");
      assert.equal(locale === "zh" ? contact.includes("直达链接") : /direct link/i.test(contact), true, "Explain that the official direct link is still required");
      for (const [, attrs, body] of anchors) {
        assert.equal(/href\s*=\s*["']tel:/i.test(attrs), false, "Do not invent a telephone number");
        assert.equal(body, "1847820623@qq.com", "Keep the company-provided email address visible and clickable without changes");
      }
    });
    check(`${locale} optional future approved WhatsApp configuration renders safely without changing contact identity`, async () => {
      const value = "https://wa.me/message/SYNTHETIC123";
      const fixture = await renderWebsite(locale, null, null, { environment: { ...validEnvironment, COMPANY_VERIFIED_WHATSAPP_URL: value } });
      const contact = /<section\b[^>]*\bid="contact"[^>]*>[\s\S]*?<\/section>/.exec(fixture.html)?.[0];
      assert.equal(typeof contact, "string");
      const links = [...contact.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
      const link = links.find(([, attributes]) => attributes.includes(`href="${value}"`));
      assert.ok(link, "A manually configured supported URL may become a link");
      assert.equal(link[1].includes('target="_blank"'), true);
      const rel = /\brel="([^"]*)"/.exec(link[1])?.[1].split(/\s+/) ?? [];
      assert.ok(rel.includes("noopener") && rel.includes("noreferrer"));
      assert.equal(contact.includes("@Lintao Hengdeyuan"), true);
      assert.equal(contact.includes('href="mailto:1847820623@qq.com"'), true);
      assert.equal(links.length, 2);
    });
    check(`${locale} invalid optional WhatsApp configuration leaves no public link or value`, async () => {
      const value = "https://unapproved.invalid/SYNTHETIC_PRIVATE_CONTACT_SENTINEL";
      const fixture = await renderWebsite(locale, null, null, { environment: { ...validEnvironment, COMPANY_VERIFIED_WHATSAPP_URL: value } });
      assert.equal(fixture.html.includes(value), false);
      assert.equal(fixture.html.includes("SYNTHETIC_PRIVATE_CONTACT_SENTINEL"), false);
      assert.equal((fixture.html.match(/class="contact-whatsapp-link"/g) ?? []).length, 0);
    });
    // Deliberately invented fixture; never copy a company quotation into this test.
    const syntheticScheduledAmount = 2468.13;
    const syntheticAmountPattern = String(syntheticScheduledAmount).replace(".", "[.,]");
    const syntheticScheduledPricePattern = new RegExp(String.raw`(?:USD\s*${syntheticAmountPattern}|${syntheticAmountPattern}\s*USD|"amount"\s*:\s*${syntheticAmountPattern})`);
    for (const mode of ["public", "ongoing"]) for (const instant of ["2031-12-31T23:59:59.999Z", "2032-01-01T00:00:00.000Z", "2033-01-01T00:00:00.000Z"]) check(`SYNTHETIC CXY-01 USD ${syntheticScheduledAmount} verified ${mode}/${instant}/${locale}: HTML, SEO, preview, GROQ and DTO remain inquiry`, async () => {
      const quote = { ...quotation(mode), amount: syntheticScheduledAmount, validFrom: "2032-01-01T00:00:00Z", validUntil: mode === "ongoing" ? null : "2033-01-01T00:00:00Z" };
      const assertNoSyntheticAmount = (value) => { noCommercial(value); assert.equal(JSON.stringify(value).includes(String(syntheticScheduledAmount)), false, "Synthetic scheduled amount must never escape"); };
      for (const index of [null, 0]) {
        const fixture = await renderWebsite(locale, index, null, { quote, instant });
        noPriceMarkup(fixture.html); assertNoSyntheticAmount(fixture.metadata);
        assert.doesNotMatch(fixture.html, syntheticScheduledPricePattern);
        assert.equal(fixture.html.includes(label), true);
      }
      const item = { ...document(), quote };
      assertNoSyntheticAmount(mapSanityProduct(item, boundary, new Date(instant)));
      assertNoSyntheticAmount(toPublicProduct({ ...products[0], publicationStatus: "published", quote }, new Date(instant)));
      const dataset = rawDataset(); dataset[0].quote = quote;
      assertNoSyntheticAmount(await (await evaluate(parse(queries.publishedProductsQuery), { dataset })).get());
      assertNoSyntheticAmount(await (await evaluate(parse(queries.publishedProductBySlugQuery), { dataset, params: { slug: products[0].slug } })).get());
      const { ProductPreview } = createLoader({ environment: validEnvironment, previewLocale: locale, instant }).loadSource("src/sanity/product-preview.tsx");
      item.slug = { current: item.slug }; item.image = { asset: { _ref: "image-synthetic0-1200x1200-webp" } };
      const html = renderToStaticMarkup(React.createElement(ProductPreview, { document: { displayed: item } }));
      noPriceMarkup(html); assert.doesNotMatch(html, syntheticScheduledPricePattern); assert.equal(html.includes(label), true);
    });
    for (let index = 0; index < products.length; index += 1) check(`${products[index].id}/${locale} detail HTML/metadata preserves content and MOQ, links to correct contact`, async () => {
      const fixture = await renderWebsite(locale, index); const product = products[index]; assert.equal(fixture.metadata.title, product.content[locale].name); assert.equal(fixture.metadata.description, product.content[locale].summary);
      assert.equal(fixture.html.includes(escape(product.content[locale].introduction)), true); assert.equal(fixture.html.includes(escape(product.packaging.itemSpec[locale])), true); assert.equal(fixture.html.includes(`50 ${locale === "zh" ? "箱" : "cartons"}`), true);
      const anchors = [...fixture.html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter((match) => /detail-contact|commercial-inquiry-link/.test(match[1])); assert.equal(anchors.length >= 1, true);
      for (const [, attrs, body] of anchors) { assert.equal(attrs.includes(`href="/${locale}#contact"`), true); assert.equal(body.includes(label), true); assert.equal(/aria-disabled|tabindex="-1"/.test(attrs), false); } renderedInquiryPages.set(fixture.pathname, fixture.html);
    });
    for (const mode of modes) check(`${locale} Studio preview ignores ${mode} historical prices and hostile getter`, () => {
      const loader = createLoader({ environment: validEnvironment, previewLocale: locale }); const { ProductPreview } = loader.loadSource("src/sanity/product-preview.tsx");
      const item = document(); item.slug = { current: item.slug }; item.image = { asset: { _ref: "image-synthetic0-1200x1200-webp" } }; item.quote = quotation(mode); Object.defineProperty(item, "quote", { enumerable: true, get() { throw new Error("Preview must not read quote"); } });
      const html = renderToStaticMarkup(React.createElement(ProductPreview, { document: { displayed: item } })); noPriceMarkup(html); assert.equal(html.includes(label), true); assert.equal(html.includes(escape(products[0].content[locale].name)), true);
    });
  }
} catch (error) { failures += 1; console.error(`FATAL offline setup: ${error instanceof Error ? error.message : String(error)}`); }
for (const [index, test] of cases.entries()) {
  try { await test.run(); console.log(`PASS ${String(index + 1).padStart(2, "0")} ${test.name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${String(index + 1).padStart(2, "0")} ${test.name}: ${error instanceof Error ? error.message : String(error)}`); }
}
console.log(`Offline CMS checks: ${cases.length} cases, ${failures} failure${failures === 1 ? "" : "s"}. No CMS connection attempted. ${renderedInquiryPages.size} synthetic HTML pages retained in memory; this is not browser or Next HTTP/RSC validation.`);
if (failures > 0) process.exitCode = 1;
