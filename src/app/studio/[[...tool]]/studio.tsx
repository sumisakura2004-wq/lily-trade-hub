"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export function ProductStudio() {
  if (!config) return null;
  // Sanity authenticates the administrator with their own login session.
  return <NextStudio config={config} />;
}
