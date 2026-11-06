# PWA

- Manifest: `src/app/manifest.ts` (`display: standalone`, short_name Central, theme `#1f4e79`)
- Service worker: `public/sw.js` — `push` + `notificationclick`; sem cache agressivo de HTML autenticado
- Registro: `PwaRegister` no layout autenticado
- Ícone: `public/icon.svg`
- Mobile: bottom nav; header compacto
- Instalação:
  - **Chromium (Android/desktop):** botão **Instalar a Central** (`beforeinstallprompt`) — um toque.
  - **iOS Safari:** a Apple não expõe API de instalação. A UI mostra só os 2 toques obrigatórios (Compartilhar → Adicionar à Tela de Início).
- Já em `standalone`: o convite some.

Zero passo a passo para 400 pessoas no parque gerenciado: TI pode publicar um *web clip* / atalho pelo MDM (Intune). Aí o colaborador nem abre o Safari.

iOS: sem atalho na Tela de Início, Web Push não está disponível.
