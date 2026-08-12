import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { NavLinks } from "./nav-links";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa em profundidade: o proxy (src/proxy.ts) já bloqueia rotas
  // protegidas sem sessão, mas Server Components não devem confiar apenas
  // nisso — cada um valida a própria sessão.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-chart-3" />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-prefeitura.jpg"
            alt="Prefeitura de Raposos"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">
              Secretaria de Educação
            </p>
            <p className="text-xs text-muted-foreground">
              Prefeitura de Raposos
            </p>
          </div>
        </div>

        <NavLinks />

        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
