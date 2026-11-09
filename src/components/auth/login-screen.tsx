import { CredentialsSignInForm } from "@/components/auth/credentials-sign-in-form";
import { EntraSignInButton } from "@/components/auth/entra-sign-in-button";
import { LocalDevSignInButtons } from "@/components/auth/local-dev-sign-in-buttons";
import { Icon } from "@/components/ui/icon";
import { Sparkles } from "lucide-react";
import { appConfig } from "@/config/app";
import { isEntraConfigured, isLocalDevBypassEnabled } from "@/lib/dev-auth";

export function LoginScreen({ error }: { error?: string | null }) {
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
                <p className="text-xs text-fg-muted">
                  Bypass local ativo (somente desenvolvimento).
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
