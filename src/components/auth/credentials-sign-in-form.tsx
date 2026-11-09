import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CredentialsSignInForm({ error }: { error?: string | null }) {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/",
      });
    } catch (err) {
      // signIn bem-sucedido lança redirect — precisa propagar
      if (isRedirectError(err)) throw err;
      if (err instanceof AuthError) {
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
