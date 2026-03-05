import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("vite dev proxy config", () => {
  it("defines /api proxy with env target and localhost fallback", () => {
    const configPath = path.resolve(__dirname, "../../vite.config.ts");
    const source = readFileSync(configPath, "utf8");

    expect(source).toContain('"/api"');
    expect(source).toContain("target: process.env.VITE_DEV_API_TARGET || \"http://localhost:8000\"");
    expect(source).toContain("changeOrigin: true");
    expect(source).toContain("secure: false");
  });

  it("keeps PWA runtime caching safeguards and ordered auth exclusions", () => {
    const configPath = path.resolve(__dirname, "../../vite.config.ts");
    const source = readFileSync(configPath, "utf8");

    expect(source).toContain('registerType: "prompt"');
    expect(source).toContain('enabled: false');
    expect(source).toContain('start_url: "/app/transactions"');
    expect(source).toContain('display: "standalone"');

    const networkOnlyIndex = source.indexOf('handler: "NetworkOnly"');
    const networkFirstIndex = source.indexOf('handler: "NetworkFirst"');
    expect(networkOnlyIndex).toBeGreaterThan(-1);
    expect(networkFirstIndex).toBeGreaterThan(-1);
    expect(networkOnlyIndex).toBeLessThan(networkFirstIndex);

    expect(source).toContain('url.pathname.startsWith("/api/auth/")');
    expect(source).toContain('url.pathname === "/api/me"');
    expect(source).toContain('url.pathname === "/api/token"');
    expect(source).toContain('url.pathname === "/api/refresh"');
  });
});
