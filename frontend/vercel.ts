import { defineConfig } from "vercel/config";

function resolveApiOrigin(): string {
  const apiOrigin = process.env.API_ORIGIN?.trim() ?? "";
  const vercelEnv = process.env.VERCEL_ENV?.trim() ?? "";

  if (apiOrigin.length === 0) {
    if (vercelEnv === "production") {
      throw new Error("Missing required API_ORIGIN for production deploy.");
    }
    if (vercelEnv === "preview") {
      throw new Error("Missing required API_ORIGIN for preview deploy.");
    }
    return "http://localhost:8000";
  }

  let parsed: URL;
  try {
    parsed = new URL(apiOrigin);
  } catch {
    throw new Error(`Invalid API_ORIGIN URL: ${apiOrigin}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`API_ORIGIN must use http or https protocol: ${apiOrigin}`);
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("API_ORIGIN must be an origin only (no path, query, or hash).");
  }

  return parsed.origin;
}

const apiBase = `${resolveApiOrigin()}/api`;

export default defineConfig({
  outputDirectory: "dist",
  framework: "vite",
  rewrites: [
    { source: "/api", destination: apiBase },
    { source: "/api/:path*", destination: `${apiBase}/:path*` },
    { source: "/(.*)", destination: "/index.html" }
  ],
  headers: [
    {
      source: "/assets/(.*)",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" }
      ]
    },
    {
      source: "/(.*\\.webmanifest|manifest\\.json)",
      headers: [
        { key: "Cache-Control", value: "no-cache" },
        { key: "Content-Type", value: "application/manifest+json" }
      ]
    },
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        { key: "X-DNS-Prefetch-Control", value: "on" }
      ]
    }
  ]
});
