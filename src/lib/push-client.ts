/** Helpers de Web Push no browser (sem Node). */

export function cleanPublicVapidKey(value: string | undefined | null): string {
  return (value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
}

export function urlBase64ToUint8Array(base64String: string) {
  const cleaned = cleanPublicVapidKey(base64String);
  const padding = "=".repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as { standalone?: boolean }).standalone)
  );
}

export function pushSupportMessage(): string | null {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    if (isIosDevice() && !isStandaloneDisplay()) {
      return "No iPhone, abra a Central pelo ícone da Tela de Início para ativar notificações.";
    }
    return "Este navegador não oferece Web Push.";
  }
  if (isIosDevice() && !isStandaloneDisplay()) {
    return "No iPhone/iPad, abra pelo ícone da Tela de Início (não pelo Safari).";
  }
  return null;
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("SERVICE_WORKER_UNAVAILABLE");
  }
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) {
    await existing.update().catch(() => undefined);
    return navigator.serviceWorker.ready;
  }
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function registerPushSubscription(): Promise<{ ok: true } | { ok: false; message: string }> {
  const blocked = pushSupportMessage();
  if (blocked) return { ok: false, message: blocked };

  const publicKey = cleanPublicVapidKey(process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY);
  if (!publicKey) {
    return {
      ok: false,
      message: "Chave VAPID pública ausente. Peça ao admin para configurar NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY e fazer redeploy.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      message:
        permission === "denied"
          ? "Notificações bloqueadas neste aparelho. Libere em Ajustes / configurações do site e tente de novo."
          : "Permissão não concedida.",
    };
  }

  try {
    const registration = await ensureServiceWorker();
    const current = await registration.pushManager.getSubscription();
    if (current) {
      await current.unsubscribe().catch(() => undefined);
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const payload = subscription.toJSON();
    if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
      return { ok: false, message: "O navegador não retornou uma subscription válida." };
    }
    const response = await fetch("/api/push/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: payload.endpoint,
        keys: { p256dh: payload.keys.p256dh, auth: payload.keys.auth },
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        message: `Falha ao salvar no servidor (${response.status}). ${detail.slice(0, 120)}`,
      };
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/applicationServerKey|InvalidAccessError|AbortError/i.test(message)) {
      return {
        ok: false,
        message:
          "Chave VAPID incompatível neste build. Confirme NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY na Vercel e faça Redeploy; depois ative de novo.",
      };
    }
    return { ok: false, message: `Não foi possível ativar: ${message}` };
  }
}

export async function readLocalPushState(): Promise<{
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  support: string | null;
}> {
  const support = pushSupportMessage();
  if (!("Notification" in window)) {
    return { permission: "unsupported", subscribed: false, support };
  }
  let subscribed = false;
  try {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        subscribed = Boolean(sub);
      }
    }
  } catch {
    subscribed = false;
  }
  return {
    permission: Notification.permission,
    subscribed,
    support,
  };
}
