"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { getStudioEnvironment } from "./src/sanity/studio-config";
import { ProductPreview } from "./src/sanity/product-preview";

const environment = getStudioEnvironment();

// No fake project, default dataset, read token or browser token is supplied.
const config = environment ? defineConfig({
  ...environment,
  name: "lily-trade-hub",
  title: "婵乡源产品管理 / Product Studio",
  basePath: "/studio",
  plugins: [structureTool({
    defaultDocumentNode: (builder, { schemaType }) => schemaType === "product"
      ? builder.document().id("product-editor").views([
        builder.view.form().id("editor").title("编辑 / Edit"),
        // View titles are localized; Structure IDs must remain URL-safe ASCII.
        builder.view.component(ProductPreview).id("preview").title("手机预览 / Mobile preview"),
      ])
      : builder.document().views([builder.view.form()]),
  })],
  schema: { types: schemaTypes },
}) : null;

export default config;
