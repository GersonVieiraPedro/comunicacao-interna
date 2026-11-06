import { describe, expect, it } from "vitest";
import { classifyPwaInstall } from "@/lib/pwa-install";

describe("classifyPwaInstall", () => {
  it("já instalado", () => {
    expect(
      classifyPwaInstall({ standalone: true, ios: false, canPrompt: true, hasServiceWorker: true }),
    ).toBe("installed");
  });

  it("Android/Chrome com evento de instalar", () => {
    expect(
      classifyPwaInstall({ standalone: false, ios: false, canPrompt: true, hasServiceWorker: true }),
    ).toBe("one-tap");
  });

  it("iOS no Safari (atalho manual)", () => {
    expect(
      classifyPwaInstall({ standalone: false, ios: true, canPrompt: false, hasServiceWorker: true }),
    ).toBe("ios-shortcut");
  });
});
