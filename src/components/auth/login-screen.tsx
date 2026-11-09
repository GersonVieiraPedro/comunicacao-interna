import { CredentialsSignInForm } from "@/components/auth/credentials-sign-in-form";
import { EntraSignInButton } from "@/components/auth/entra-sign-in-button";
import { LocalDevSignInButtons } from "@/components/auth/local-dev-sign-in-buttons";
import { Icon } from "@/components/ui/icon";
import { BellRing, Smartphone, Sparkles } from "lucide-react";
import { appConfig } from "@/config/app";
import { isEntraConfigured, isLocalDevBypassEnabled } from "@/lib/dev-auth";

export function LoginScreen({ error }: { error?: string | null }) {
  const entra = isEntraConfigured();
  const dev = isLocalDevBypassEnabled();

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-accent px-10 py-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-spark/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-20 left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-spark" aria-hidden />
        <div className="relative">
          <p className="text-sm font-semibold tracking-[0.18em] text-white/75">META RH</p>
          <h1 className="mt-8 max-w-md text-5xl font-bold leading-[1.05] tracking-tight">
            {appConfig.name}
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/85">
            Comunicados claros, no celular e no computador. Feito por e para pessoas.
          </p>
          <ul className="mt-10 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Icon icon={BellRing} className="h-4 w-4 text-spark" />
              </span>
              Avisos com notificação no aparelho
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Icon icon={Smartphone} className="h-4 w-4 text-spark" />
              </span>
              Experiência pensada para o dia a dia mobile
            </li>
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/75">
          <Icon icon={Sparkles} className="text-spark" />
          Identidade Meta RH
        </p>
      </section>

      <section className="relative flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Meta RH</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg">{appConfig.name}</h1>
            <p className="mt-2 text-sm text-fg-muted">Entre para ver os comunicados da empresa.</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-surface p-8 shadow">
            <h2 className="text-xl font-bold tracking-tight text-fg">Entrar</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              Use o e-mail e a senha fornecidos pela equipe de comunicação.
            </p>
            <div className="mt-6 space-y-4">
              <CredentialsSignInForm error={error} />
              {entra ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                    Ou conta Microsoft
                  </p>
                  <EntraSignInButton />
                </div>
              ) : null}
              <LocalDevSignInButtons />
              {dev ? (
                <p className="text-xs text-fg-muted">Bypass local ativo (somente desenvolvimento).</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
