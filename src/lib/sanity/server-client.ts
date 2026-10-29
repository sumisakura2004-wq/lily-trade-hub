import "server-only";

import { createClient } from "@sanity/client";
import { CatalogUnavailableError } from "./errors";

export interface SanityReadConfiguration {
  readonly projectId: string;
  readonly dataset: string;
  readonly token: string;
}

// Do not construct a client at module load: local builds need no CMS account.
export function getSanityReadConfiguration(): SanityReadConfiguration {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const token = process.env.SANITY_API_READ_TOKEN;

  if (!projectId || !/^[a-z0-9]{1,32}$/.test(projectId) ||
    !dataset || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset) ||
    !token || token.length < 20 || token.length > 4096 || /\s/.test(token)) {
    throw new CatalogUnavailableError();
  }

  return { projectId, dataset, token };
}

export function createSanityReadClient(configuration: SanityReadConfiguration) {
  return createClient({
    ...configuration,
    apiVersion: "2025-02-19",
    useCdn: false,
    perspective: "published",
    stega: false,
    timeout: 10_000,
    maxRetries: 0,
  });
}
