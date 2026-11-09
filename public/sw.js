/* Central de Comunicação Interna — service worker (push + click) */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Nova comunicação interna",
    body: "Confira o novo comunicado publicado.",
    url: "/",
    priority: "NORMAL",
    communicationId: null,
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload inválido: usa texto padrão
  }

  const urgent = data.priority === "URGENT" || data.priority === "IMPORTANT";
  // Tag única evita substituição silenciosa da notificação anterior no iOS/Android
  const tag = `cci-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  event.waitUntil(
    self.registration.showNotification(data.title || "Nova comunicação interna", {
      body: data.body || "Confira o novo comunicado publicado.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: {
        url: data.url || "/",
        communicationId: data.communicationId || null,
      },
      tag,
      renotify: true,
      // explícito: tocar som padrão do sistema
      silent: false,
      requireInteraction: urgent,
      vibrate: urgent ? [220, 100, 220, 100, 220] : [180, 80, 180],
      timestamp: Date.now(),
    }),
  );
});

async function trackNotificationOpen(communicationId) {
  if (!communicationId) return;
  try {
    await fetch("/api/notifications/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communicationId }),
    });
  } catch {
    // tracking best-effort
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  const communicationId = event.notification.data?.communicationId || null;
  event.waitUntil(
    Promise.all([
      trackNotificationOpen(communicationId),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
    ]),
  );
});
