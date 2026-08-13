import { z } from "zod";

// Usado tanto na validação (schema abaixo) quanto na renderização do select
// no formulário público (ver matricula-form.tsx).
export const SERIES_DISPONIVEIS = {
  "Educação Infantil": [
    "Berçário",
    "Maternal I",
    "Maternal II",
    "Pré I",
    "Pré II",
  ],
  "Ensino Fundamental": [
    "1º ano",
    "2º ano",
    "3º ano",
    "4º ano",
    "5º ano",
    "6º ano",
    "7º ano",
    "8º ano",
    "9º ano",
  ],
} as const;

const TODAS_AS_SERIES = Object.values(SERIES_DISPONIVEIS).flat() as [
  string,
  ...string[],
];

// Mesmos limites do bucket `documentos-matricula` (ver migration
// 20260813145042_solicitacao_anexos.sql) — mantidos em sincronia manualmente.
export const ANEXO_TAMANHO_MAXIMO_MB = 5;
export const ANEXO_MIME_TYPES_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

// O navegador envia o arquivo direto pro Supabase Storage (ver
// matricula-form.tsx) — a Server Action nunca vê os bytes do arquivo, só
// esses metadados, entregues como JSON num campo hidden do form. Isso evita
// o limite de tamanho/tempo de execução de Server Actions na Vercel.
const anexoMetadataSchema = z.object({
  caminho: z.string().min(1),
  nomeArquivo: z.string().min(1),
  tamanhoBytes: z.number().int().positive(),
});

function jsonVazioViraIndefinido(value: unknown): unknown {
  if (typeof value !== "string" || value === "") return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

const anexoOpcional = z.preprocess(
  jsonVazioViraIndefinido,
  anexoMetadataSchema.optional(),
);

// Mesma definição usada no formulário público (client) e na Server Action
// que grava em `solicitacoes_matricula` (server) — ver
// supabase/migrations/20260811213723_schema_inicial.sql para o schema do banco.
export const solicitacaoMatriculaSchema = z.object({
  // Gerado no navegador (ver matricula-form.tsx) antes de qualquer upload,
  // para nomear os arquivos no Storage. A Server Action usa o mesmo id ao
  // criar a solicitação, em vez de gerar um novo.
  solicitacaoId: z.uuid(),
  tipo: z.enum(["nova", "rematricula"], {
    error: "Selecione o tipo de solicitação.",
  }),
  escolaId: z.uuid({ error: "Selecione a escola." }),
  anoLetivoId: z.uuid({ error: "Selecione o ano letivo." }),
  alunoNome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do aluno."),
  alunoDataNascimento: z.iso.date({
    error: "Informe uma data de nascimento válida.",
  }),
  alunoDocumento: z.string().trim().optional().or(z.literal("")),
  seriePretendida: z.enum(TODAS_AS_SERIES, {
    error: "Selecione a série pretendida.",
  }),
  responsavelNome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do responsável."),
  responsavelTelefone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido com DDD."),
  responsavelEmail: z.email({ error: "E-mail inválido." }).optional().or(z.literal("")),
  observacoes: z.string().trim().optional().or(z.literal("")),
  certidaoNascimento: anexoOpcional,
  foto: anexoOpcional,
  comprovanteResidencia: anexoOpcional,
  outroDocumento: anexoOpcional,
  consentimentoLgpd: z.literal(true, {
    error: "É necessário concordar com o uso dos dados para enviar a solicitação.",
  }),
  // Honeypot: campo invisível para humanos. Bots que preenchem tudo caem aqui.
  website: z.string().max(0, "").optional().or(z.literal("")),
  turnstileToken: z.string().min(1, "Verificação de segurança pendente."),
});

export type SolicitacaoMatriculaInput = z.infer<typeof solicitacaoMatriculaSchema>;
