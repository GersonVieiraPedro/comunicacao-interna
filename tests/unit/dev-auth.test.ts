import { afterEach, describe, expect, it, vi } from "vitest";
import { isEntraConfigured, isLocalDevBypassEnabled } from "@/lib/dev-auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isLocalDevBypassEnabled", () => {
  it("liga só em localhost com flag e fora de produção", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("AUTH_DEV_BYPASS", "true");
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    expect(isLocalDevBypassEnabled()).toBe(true);
  });

  it("aceita AUTH_ALLOW_DEV_LOGIN como alias da fábrica", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("AUTH_ALLOW_DEV_LOGIN", "true");
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    expect(isLocalDevBypassEnabled()).toBe(true);
  });

  it("recusa produção", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DEV_BYPASS", "true");
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    expect(isLocalDevBypassEnabled()).toBe(false);
  });

  it("recusa host não local", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_DEV_BYPASS", "true");
    vi.stubEnv("AUTH_URL", "https://comunicacao.empresa.example");
    expect(isLocalDevBypassEnabled()).toBe(false);
  });
});

describe("isEntraConfigured", () => {
  it("ignora placeholders de local-dev", () => {
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_ID", "local-dev");
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_SECRET", "local-dev");
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_ISSUER", "https://login.microsoftonline.com/ci/v2.0");
    expect(isEntraConfigured()).toBe(false);
  });

  it("recusa issuer com tenant inválido (ex.: /ci/)", () => {
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_ID", "540b1267-b84d-4dc9-9331-aaaaaaaaaaaa");
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_SECRET", "not-a-placeholder-secret-value");
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_ISSUER", "https://login.microsoftonline.com/ci/v2.0");
    expect(isEntraConfigured()).toBe(false);
  });

  it("aceita issuer com tenant GUID", () => {
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_ID", "540b1267-b84d-4dc9-9331-aaaaaaaaaaaa");
    vi.stubEnv("AUTH_MICROSOFT_ENTRA_ID_SECRET", "not-a-placeholder-secret-value");
    vi.stubEnv(
      "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
      "https://login.microsoftonline.com/11111111-2222-3333-4444-555555555555/v2.0",
    );
    expect(isEntraConfigured()).toBe(true);
  });
});
