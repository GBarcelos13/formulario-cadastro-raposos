import Image from "next/image";
import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectTo =
    typeof searchParams.redirectTo === "string"
      ? searchParams.redirectTo
      : "/solicitacoes";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-card p-8 shadow-lg duration-500">
        <Image
          src="/logo-prefeitura.jpg"
          alt="Prefeitura de Raposos"
          width={56}
          height={56}
          className="rounded-full"
          priority
        />
        <h1 className="mt-4 font-display text-xl font-semibold tracking-tight">
          Secretaria de Educação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso restrito à equipe da secretaria — Prefeitura de Raposos.
        </p>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
