import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isNextRedirect(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("digest" in error) || typeof (error as { digest?: unknown }).digest !== "string") {
    return false;
  }
  return (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");
}

export function CredentialsSignInForm({ error }: { error?: string | null }) {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      // redirect:false evita que o NEXT_REDIRECT do Auth.js vaze para o error.tsx
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        redirect("/login?error=credentials");
      }
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      if (err instanceof AuthError) {
        redirect("/login?error=credentials");
      }
      throw err;
    }

    redirect("/");
  }

  return (
    <form action={login} className="space-y-3">
      <Input
        id="email"
        name="email"
        type="text"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        label="E-mail"
        autoComplete="username"
        required
        placeholder="voce@empresa.com"
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Senha"
        autoComplete="current-password"
        required
        minLength={5}
        error={error ? "E-mail ou senha inválidos." : undefined}
      />
      <Button type="submit" className="w-full">
        Entrar
      </Button>
    </form>
  );
}
