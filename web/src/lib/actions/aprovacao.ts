"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { aprovarSolicitacaoSchema } from "@/lib/schemas/aprovacao";

export type AprovarSolicitacaoState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function aprovarSolicitacao(
  _prevState: AprovarSolicitacaoState,
  formData: FormData,
): Promise<AprovarSolicitacaoState> {
  const raw = {
    solicitacaoId: formData.get("solicitacaoId"),
    escolaId: formData.get("escolaId"),
    anoLetivoId: formData.get("anoLetivoId"),
    alunoIdExistente: formData.get("alunoIdExistente") ?? "",
    nome: formData.get("nome"),
    dataNascimento: formData.get("dataNascimento"),
    documento: formData.get("documento") ?? "",
    responsavelNome: formData.get("responsavelNome"),
    responsavelTelefone: formData.get("responsavelTelefone"),
    responsavelEmail: formData.get("responsavelEmail") ?? "",
    turma: formData.get("turma") ?? "",
    serie: formData.get("serie") ?? "",
  };

  const parsed = aprovarSolicitacaoSchema.safeParse(raw);
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

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Sessão expirada. Faça login novamente." };
  }

  let alunoId = data.alunoIdExistente || null;

  if (alunoId) {
    // Rematrícula vinculada a um aluno já cadastrado: atualiza os dados
    // (podem ter mudado — telefone, endereço, etc.) em vez de recriar.
    const { error: updateError } = await supabase
      .from("alunos")
      .update({
        nome: data.nome,
        data_nascimento: data.dataNascimento,
        documento: data.documento || null,
        responsavel_nome: data.responsavelNome,
        responsavel_telefone: data.responsavelTelefone,
        responsavel_email: data.responsavelEmail || null,
      })
      .eq("id", alunoId);

    if (updateError) {
      return {
        status: "error",
        message: "Não foi possível atualizar o cadastro do aluno.",
      };
    }
  } else {
    const { data: novoAluno, error: insertError } = await supabase
      .from("alunos")
      .insert({
        nome: data.nome,
        data_nascimento: data.dataNascimento,
        documento: data.documento || null,
        responsavel_nome: data.responsavelNome,
        responsavel_telefone: data.responsavelTelefone,
        responsavel_email: data.responsavelEmail || null,
      })
      .select("id")
      .single();

    if (insertError || !novoAluno) {
      return {
        status: "error",
        message: "Não foi possível criar o cadastro do aluno.",
      };
    }
    alunoId = novoAluno.id;
  }

  const { data: matricula, error: matriculaError } = await supabase
    .from("matriculas")
    .insert({
      aluno_id: alunoId,
      escola_id: data.escolaId,
      ano_letivo_id: data.anoLetivoId,
      turma: data.turma || null,
      serie: data.serie || null,
      solicitacao_origem_id: data.solicitacaoId,
    })
    .select("id")
    .single();

  if (matriculaError) {
    const jaMatriculado = matriculaError.code === "23505"; // unique violation
    return {
      status: "error",
      message: jaMatriculado
        ? "Este aluno já possui matrícula ativa neste ano letivo."
        : "Não foi possível registrar a matrícula.",
    };
  }

  const { error: statusError } = await supabase
    .from("solicitacoes_matricula")
    .update({ status: "processada" })
    .eq("id", data.solicitacaoId);

  if (statusError) {
    return {
      status: "error",
      message:
        "Matrícula criada, mas não foi possível atualizar o status da solicitação.",
    };
  }

  await supabase.from("audit_log").insert({
    usuario_id: user.id,
    acao: "aprovar_solicitacao",
    tabela: "matriculas",
    registro_id: matricula.id,
    detalhes: {
      solicitacao_id: data.solicitacaoId,
      aluno_id: alunoId,
      aluno_reutilizado: Boolean(data.alunoIdExistente),
    },
  });

  redirect("/solicitacoes");
}
