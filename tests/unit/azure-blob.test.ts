import { describe, expect, it } from "vitest";
import { azureBlobObjectUrl, parseAzureBlobToken } from "@/lib/azure-blob";

describe("azure-blob", () => {
  it("parseia URL de container com SAS", () => {
    const parsed = parseAzureBlobToken(
      "https://storageprodmicroapps.blob.core.windows.net/comunicacao-interna?sv=2024-11-04&ss=b&sig=abc123",
    );
    expect(parsed.account).toBe("storageprodmicroapps");
    expect(parsed.container).toBe("comunicacao-interna");
    expect(parsed.containerBaseUrl).toBe(
      "https://storageprodmicroapps.blob.core.windows.net/comunicacao-interna",
    );
    expect(parsed.sasQuery.startsWith("?")).toBe(true);
  });

  it("monta URL do objeto", () => {
    const url = azureBlobObjectUrl(
      "https://storageprodmicroapps.blob.core.windows.net/comunicacao-interna",
      "covers/a.jpg",
      "?sv=1&sig=x",
    );
    expect(url).toBe(
      "https://storageprodmicroapps.blob.core.windows.net/comunicacao-interna/covers/a.jpg?sv=1&sig=x",
    );
  });
});
