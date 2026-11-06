export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || ios;
}

export function isIosDevice(userAgent: string = typeof navigator === "undefined" ? "" : navigator.userAgent): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  if (typeof navigator === "undefined") return false;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export type PwaInstallKind = "installed" | "one-tap" | "ios-shortcut" | "unsupported";

export function classifyPwaInstall(input: {
  standalone: boolean;
  ios: boolean;
  canPrompt: boolean;
  hasServiceWorker: boolean;
}): PwaInstallKind {
  if (input.standalone) return "installed";
  if (input.canPrompt) return "one-tap";
  if (input.ios) return "ios-shortcut";
  if (!input.hasServiceWorker) return "unsupported";
  return "unsupported";
}
