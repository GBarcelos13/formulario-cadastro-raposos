import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Rate limit em memória, por instância do servidor. Não é distribuído entre
// múltiplas instâncias serverless — suficiente para conter um bot batendo
// repetidamente numa mesma instância; a defesa principal contra abuso é o
// Turnstile (ver src/app/matricula/matricula-form.tsx). Se o abuso real
// mostrar que isso não basta, trocar por um rate limiter distribuído
// (ex: Upstash Redis) sem mudar a interface abaixo.
const JANELA_MS = 60_000;
const LIMITE_POR_JANELA = 10;
const acessosPorIp = new Map<string, { contagem: number; inicioJanela: number }>();

function estaDentroDoLimite(ip: string): boolean {
  const agora = Date.now();
  const registro = acessosPorIp.get(ip);

  if (!registro || agora - registro.inicioJanela > JANELA_MS) {
    acessosPorIp.set(ip, { contagem: 1, inicioJanela: agora });
    return true;
  }

  registro.contagem += 1;
  return registro.contagem <= LIMITE_POR_JANELA;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/matricula") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "desconhecido";

    if (!estaDentroDoLimite(ip)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um minuto e tente novamente." },
        { status: 429 },
      );
    }
  }

  // Refresh de sessão + guarda de autenticação das rotas da secretaria
  // (/solicitacoes, /alunos — ver src/lib/supabase/session.ts).
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
