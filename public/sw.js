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
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // payload inválido: usa texto padrão
  }

  const urgent = data.priority === "URGENT" || data.priority === "IMPORTANT";

  event.waitUntil(
    self.registration.showNotification(data.title || "Nova comunicação interna", {
      body: data.body || "Confira o novo comunicado publicado.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url || "/" },
      tag: data.communicationId ? `comunicado-${data.communicationId}` : "comunicado",
      renotify: true,
      silent: false,
      requireInteraction: urgent,
      vibrate: urgent ? [200, 100, 200, 100, 200] : [160, 80, 160],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
