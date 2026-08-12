import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/solicitacoes", "/alunos"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Atualiza a sessão Supabase a cada request (refresh de token) e redireciona
 * para /login quando uma rota protegida da secretaria é acessada sem sessão.
 * Chamada pelo proxy (src/proxy.ts) — ver AGENTS.md: Next.js 16 renomeou
 * Middleware para Proxy.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() dispara o refresh do token quando necessário e é a forma
  // recomendada de validar a sessão em código de servidor (evita confiar
  // em getSession(), que não revalida o JWT).
  const { data } = await supabase.auth.getClaims();

  if (isProtected(request.nextUrl.pathname) && !data?.claims) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
