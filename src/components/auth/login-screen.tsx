import { EntraSignInButton } from "@/components/auth/entra-sign-in-button";
import { LocalDevSignInButtons } from "@/components/auth/local-dev-sign-in-buttons";
import { Icon } from "@/components/ui/icon";
import { Sparkles } from "lucide-react";
import { appConfig } from "@/config/app";
import { isEntraConfigured, isLocalDevBypassEnabled } from "@/lib/dev-auth";

export function LoginScreen() {
  const entra = isEntraConfigured();
  const dev = isLocalDevBypassEnabled();

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-accent px-10 py-12 text-white lg:flex">
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-spark" aria-hidden />
        <div>
          <p className="text-sm font-medium tracking-wide text-white/80">Meta RH</p>
          <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">{appConfig.name}</h1>
          <p className="mt-4 max-w-sm text-base text-white/85">
            Comunicados claros, no celular e no computador. Feito por e para pessoas.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/75">
          <Icon icon={Sparkles} className="text-spark" />
          Identidade Meta RH
        </p>
      </section>

      <section className="flex items-center justify-center bg-bg px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-semibold text-accent">Meta RH</p>
            <h1 className="mt-1 text-2xl font-bold text-fg">{appConfig.name}</h1>
          </div>
          <div className="rounded-lg border border-border bg-surface p-8 shadow">
            <h2 className="text-lg font-semibold text-fg">Entrar</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {entra
                ? "Use a conta corporativa Microsoft. Não há senha nesta aplicação."
                : dev
                  ? "Ambiente local: entre com um perfil de teste. Entra ID não está configurado."
                  : "Microsoft Entra ID ainda não está configurado neste ambiente."}
            </p>
            <div className="mt-6 space-y-3">
              <EntraSignInButton />
              <LocalDevSignInButtons />
              {!entra && !dev ? (
                <p className="text-sm text-fg-muted" role="status">
                  Na Vercel, defina AUTH_MICROSOFT_ENTRA_ID_ID, AUTH_MICROSOFT_ENTRA_ID_SECRET,
                  AUTH_MICROSOFT_ENTRA_ID_ISSUER e AUTH_URL (URL HTTPS do deploy). Login local
                  (AUTH_DEV_BYPASS) só funciona em localhost — nunca em produção.
                </p>
              ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
