import { z } from "zod";

// Usado ao aprovar uma solicitação de matrícula/rematrícula — copia os dados
// da solicitação para o cadastro oficial (alunos + matriculas). A secretaria
// confirma/edita antes de confirmar; ver src/lib/actions/aprovacao.ts.
export const aprovarSolicitacaoSchema = z.object({
  solicitacaoId: z.uuid(),
  escolaId: z.uuid(),
  anoLetivoId: z.uuid(),
  // Presente só em rematrícula, quando a secretaria vincula a um aluno já
  // cadastrado em vez de criar um registro novo.
  alunoIdExistente: z.uuid().optional().or(z.literal("")),
  nome: z.string().trim().min(3, "Informe o nome completo do aluno."),
  dataNascimento: z.iso.date({ error: "Data de nascimento inválida." }),
  documento: z.string().trim().optional().or(z.literal("")),
  responsavelNome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do responsável."),
  responsavelTelefone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido com DDD."),
  responsavelEmail: z.email({ error: "E-mail inválido." }).optional().or(z.literal("")),
  turma: z.string().trim().optional().or(z.literal("")),
  serie: z.string().trim().optional().or(z.literal("")),
});

export type AprovarSolicitacaoInput = z.infer<typeof aprovarSolicitacaoSchema>;
