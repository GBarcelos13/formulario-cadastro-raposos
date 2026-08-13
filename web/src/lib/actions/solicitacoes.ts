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
    certidaoNascimento: formData.get("certidaoNascimento"),
    foto: formData.get("foto"),
    comprovanteResidencia: formData.get("comprovanteResidencia"),
    outroDocumento: formData.get("outroDocumento"),
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

  // Gerado aqui (em vez de deixar o banco gerar) porque precisamos do id
  // para nomear os arquivos no Storage antes de gravar `solicitacao_anexos`.
  // Também evita ter que ler a linha de volta depois do insert — o que
  // falharia, já que anon não tem SELECT em solicitacoes_matricula.
  const solicitacaoId = crypto.randomUUID();

  const supabase = await createClient();
  const { error } = await supabase.from("solicitacoes_matricula").insert({
    id: solicitacaoId,
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

  await enviarAnexos(supabase, solicitacaoId, [
    { tipo: "certidao_nascimento", arquivo: parsed.data.certidaoNascimento },
    { tipo: "foto", arquivo: parsed.data.foto },
    { tipo: "comprovante_residencia", arquivo: parsed.data.comprovanteResidencia },
    { tipo: "outro", arquivo: parsed.data.outroDocumento },
  ]);

  return {
    status: "success",
    message: "Solicitação enviada! A secretaria vai analisar e entrar em contato se precisar de algo.",
  };
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Envia os anexos (se houver) para o Storage e registra os metadados.
 * Falha de upload não derruba a solicitação principal — o formulário já foi
 * aceito nesse ponto; um anexo que falhou pode ser pedido de novo pela
 * secretaria durante a análise, mas a matrícula em si não deve travar por
 * causa de um arquivo (rede instável em celular, arquivo corrompido etc.).
 */
async function enviarAnexos(
  supabase: SupabaseServerClient,
  solicitacaoId: string,
  candidatos: Array<{ tipo: string; arquivo: File | undefined }>,
): Promise<void> {
  const anexos = candidatos.filter(
    (c): c is { tipo: string; arquivo: File } => c.arquivo !== undefined,
  );

  for (const { tipo, arquivo } of anexos) {
    const nomeSanitizado = arquivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const caminho = `${solicitacaoId}/${tipo}-${Date.now()}-${nomeSanitizado}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos-matricula")
      .upload(caminho, arquivo, { contentType: arquivo.type });

    if (uploadError) continue;

    await supabase.from("solicitacao_anexos").insert({
      solicitacao_id: solicitacaoId,
      tipo,
      nome_arquivo: arquivo.name,
      caminho_storage: caminho,
      tamanho_bytes: arquivo.size,
    });
  }
}
