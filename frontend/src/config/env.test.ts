import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnvModule() {
  vi.resetModules();
  return import("@/config/env");
}

describe("ENV config", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("defaults to development with /api and fallback feature flags", async () => {
    vi.unstubAllEnvs();
    const { ENV } = await loadEnvModule();

    expect(ENV.APP_ENV).toBe("development");
    expect(ENV.API_BASE_URL).toBe("/api");
    expect(ENV.FEATURE_IMPORT).toBe(true);
    expect(ENV.FEATURE_AUDIT).toBe(false);
  });

  it("normalizes production config and blocks cross-origin absolute API URL", async () => {
    vi.stubEnv("VITE_APP_ENV", "production");
    vi.stubEnv("VITE_API_BASE_URL", " https://api.example.com ");
    vi.stubEnv("VITE_SENTRY_DSN", " https://dsn.example ");
    vi.stubEnv("VITE_RELEASE", " release-123 ");
    vi.stubEnv("VITE_FEATURE_IMPORT", "YES");
    vi.stubEnv("VITE_FEATURE_AUDIT", "on");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { ENV } = await loadEnvModule();

    expect(ENV.APP_ENV).toBe("production");
    expect(ENV.API_BASE_URL).toBe("/api");
    expect(ENV.SENTRY_DSN).toBe("https://dsn.example");
    expect(ENV.RELEASE).toBe("release-123");
    expect(ENV.FEATURE_IMPORT).toBe(true);
    expect(ENV.FEATURE_AUDIT).toBe(true);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back to /api for invalid absolute URL in production", async () => {
    vi.stubEnv("VITE_APP_ENV", "production");
    vi.stubEnv("VITE_API_BASE_URL", "http://%");

    const { ENV } = await loadEnvModule();
    expect(ENV.API_BASE_URL).toBe("/api");
  });

  it("keeps configured base URL in non-production and normalizes unknown app env", async () => {
    vi.stubEnv("VITE_APP_ENV", "qa");
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.stubEnv("VITE_SENTRY_DSN", "   ");
    vi.stubEnv("VITE_RELEASE", "   ");
    vi.stubEnv("VITE_FEATURE_IMPORT", "0");
    vi.stubEnv("VITE_FEATURE_AUDIT", "true");

    const { ENV } = await loadEnvModule();

    expect(ENV.APP_ENV).toBe("development");
    expect(ENV.API_BASE_URL).toBe("https://api.example.com");
    expect(ENV.SENTRY_DSN).toBeNull();
    expect(ENV.RELEASE).toBe("dev-local");
    expect(ENV.FEATURE_IMPORT).toBe(false);
    expect(ENV.FEATURE_AUDIT).toBe(true);
  });
});
