import type { NextConfig } from "next";
import { getStudioEnvironment } from "./src/sanity/studio-config";

const studioEnvironment = getStudioEnvironment();

const nextConfig: NextConfig = {
  // Operator-only diagnostics must never be copied into a server deployment trace.
  outputFileTracingExcludes: { "/*": ["./.private-ops/**/*"] },
  images: {
    maximumRedirects: 0,
    // No wildcard project/dataset and no arbitrary CMS-supplied image hosts.
    remotePatterns: studioEnvironment ? [{
      protocol: "https",
      hostname: "cdn.sanity.io",
      port: "",
      pathname: `/images/${studioEnvironment.projectId}/${studioEnvironment.dataset}/**`,
      search: "",
    }] : [],
  },
};

export default nextConfig;
