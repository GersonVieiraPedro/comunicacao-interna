import { ValidationError } from "@/lib/errors";

export type AzureContainerSas = {
  /** https://account.blob.core.windows.net/container */
  containerBaseUrl: string;
  /** Query string incluindo ?sv=...&sig=... */
  sasQuery: string;
  account: string;
  container: string;
};

/** Aceita URL completa do container com SAS (como AZURE_BLOB_TOKEN). */
export function parseAzureBlobToken(token: string): AzureContainerSas {
  const trimmed = token.trim();
  if (!trimmed) throw new ValidationError("AZURE_BLOB_TOKEN vazio.");

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ValidationError("AZURE_BLOB_TOKEN deve ser a URL do container com SAS.");
  }

  if (!url.hostname.endsWith(".blob.core.windows.net")) {
    throw new ValidationError("AZURE_BLOB_TOKEN precisa apontar para blob.core.windows.net.");
  }
  if (!url.search || !/[?&]sig=/i.test(url.search)) {
    throw new ValidationError("AZURE_BLOB_TOKEN precisa incluir SAS (?sv=...&sig=...).");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 1) {
    throw new ValidationError("AZURE_BLOB_TOKEN sem nome de container.");
  }

  const container = parts[0];
  const account = url.hostname.split(".")[0] ?? "";
  const containerBaseUrl = `${url.origin}/${container}`;

  return {
    containerBaseUrl,
    sasQuery: url.search,
    account,
    container,
  };
}

export function azureBlobObjectUrl(containerBaseUrl: string, blobName: string, sasQuery: string) {
  const cleanName = blobName.replace(/^\/+/, "");
  return `${containerBaseUrl}/${cleanName}${sasQuery}`;
}

export function isAzureStoredPath(pathOrUrl: string) {
  return pathOrUrl.startsWith("azure:");
}

export function azureRelativePath(pathOrUrl: string) {
  return pathOrUrl.replace(/^azure:/, "").replace(/^\/+/, "");
}
