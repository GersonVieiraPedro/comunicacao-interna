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

function isCredentialsFailure(error: unknown): boolean {
  if (error instanceof AuthError) return true;
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String((error as { name?: unknown }).name ?? "") : "";
  const type = "type" in error ? String((error as { type?: unknown }).type ?? "") : "";
  return name === "CredentialsSignin" || type === "CredentialsSignin";
}

export function CredentialsSignInForm({ error }: { error?: string | null }) {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/",
      });
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      if (isCredentialsFailure(err)) {
        redirect("/login?error=credentials");
      }
      throw err;
    }
  }

  return (
    <form action={login} className="space-y-3">
      <Input
        id="email"
        name="email"
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        label="Usuário"
        autoComplete="username"
        required
        placeholder="e-mail ou código do funcionário"
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Senha"
        autoComplete="current-password"
        required
        minLength={5}
        error={error ? "Usuário ou senha inválidos." : undefined}
      />
      <Button type="submit" className="w-full">
        Entrar
      </Button>
    </form>
  );
}
