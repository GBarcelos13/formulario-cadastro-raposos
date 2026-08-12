"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { solicitacaoMatriculaSchema } from "@/lib/schemas/solicitacao";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type EnviarSolicitacaoState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function enviarSolicitacao(
  _prevState: EnviarSolicitacaoState,
  formData: FormData,
): Promise<EnviarSolicitacaoState> {
  const raw = {
    tipo: formData.get("tipo"),
    escolaId: formData.get("escolaId"),
    anoLetivoId: formData.get("anoLetivoId"),
    alunoNome: formData.get("alunoNome"),
    alunoDataNascimento: formData.get("alunoDataNascimento"),
    alunoDocumento: formData.get("alunoDocumento") ?? "",
    seriePretendida: formData.get("seriePretendida"),
    responsavelNome: formData.get("responsavelNome"),
    responsavelTelefone: formData.get("responsavelTelefone"),
    responsavelEmail: formData.get("responsavelEmail") ?? "",
    observacoes: formData.get("observacoes") ?? "",
    consentimentoLgpd: formData.get("consentimentoLgpd") === "on",
    website: formData.get("website") ?? "",
    turnstileToken: formData.get("cf-turnstile-response"),
  };

  const parsed = solicitacaoMatriculaSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Confira os campos destacados e tente novamente.",
      fieldErrors,
    };
  }

  // Honeypot preenchido: finge sucesso para não sinalizar ao bot que foi pego.
  if (parsed.data.website) {
    return { status: "success" };
  }

  const requestHeaders = await headers();
  const ipOrigem =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const turnstileOk = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    ipOrigem ?? undefined,
  );
  if (!turnstileOk) {
    return {
      status: "error",
      message: "Não foi possível confirmar que você não é um robô. Tente novamente.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("solicitacoes_matricula").insert({
    tipo: parsed.data.tipo,
    escola_id: parsed.data.escolaId,
    ano_letivo_id: parsed.data.anoLetivoId,
    aluno_nome: parsed.data.alunoNome,
    aluno_data_nascimento: parsed.data.alunoDataNascimento,
    aluno_documento: parsed.data.alunoDocumento || null,
    serie_pretendida: parsed.data.seriePretendida,
    responsavel_nome: parsed.data.responsavelNome,
    responsavel_telefone: parsed.data.responsavelTelefone,
    responsavel_email: parsed.data.responsavelEmail || null,
    observacoes: parsed.data.observacoes || null,
    consentimento_lgpd: true,
    consentimento_lgpd_em: new Date().toISOString(),
    ip_origem: ipOrigem,
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível enviar sua solicitação agora. Tente novamente em instantes.",
    };
  }

  return {
    status: "success",
    message: "Solicitação enviada! A secretaria vai analisar e entrar em contato se precisar de algo.",
  };
}
