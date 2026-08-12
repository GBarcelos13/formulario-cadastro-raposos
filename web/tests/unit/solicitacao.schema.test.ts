import { describe, expect, it } from "vitest";
import { solicitacaoMatriculaSchema } from "@/lib/schemas/solicitacao";

const payloadValido = {
  tipo: "nova" as const,
  escolaId: "234c917a-7f27-46d5-9454-c618555dfe2d",
  anoLetivoId: "2dde9abe-0b6b-4191-bee9-08241cbbda0a",
  alunoNome: "Maria da Silva",
  alunoDataNascimento: "2018-05-10",
  alunoDocumento: "",
  seriePretendida: "1º ano",
  responsavelNome: "João da Silva",
  responsavelTelefone: "31999990000",
  responsavelEmail: "",
  observacoes: "",
  consentimentoLgpd: true as const,
  website: "",
  turnstileToken: "token-valido",
};

describe("solicitacaoMatriculaSchema", () => {
  it("aceita um payload válido completo", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse(payloadValido);
    expect(resultado.success).toBe(true);
  });

  it("aceita 'rematricula' como tipo válido", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      tipo: "rematricula",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita tipo inválido", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      tipo: "outro",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita escolaId que não é um uuid", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      escolaId: "não-é-uuid",
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita uma série da Educação Infantil", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      seriePretendida: "Pré II",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita série fora da lista permitida", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      seriePretendida: "10º ano",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita quando a série pretendida não é informada", () => {
    const semSerie: Record<string, unknown> = { ...payloadValido };
    delete semSerie.seriePretendida;
    const resultado = solicitacaoMatriculaSchema.safeParse(semSerie);
    expect(resultado.success).toBe(false);
  });

  it("rejeita nome do aluno vazio", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      alunoNome: "AB",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita data de nascimento em formato inválido", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      alunoDataNascimento: "10/05/2018",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita telefone do responsável muito curto", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      responsavelTelefone: "123",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita e-mail do responsável inválido quando preenchido", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      responsavelEmail: "não-é-email",
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita e-mail do responsável vazio (opcional)", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      responsavelEmail: "",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita quando consentimentoLgpd não é exatamente true", () => {
    const semConsentimento = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      consentimentoLgpd: false,
    });
    expect(semConsentimento.success).toBe(false);
  });

  it("rejeita quando o honeypot (website) vem preenchido", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      website: "http://bot-preencheu-isso.com",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita quando falta o token do Turnstile", () => {
    const resultado = solicitacaoMatriculaSchema.safeParse({
      ...payloadValido,
      turnstileToken: "",
    });
    expect(resultado.success).toBe(false);
  });
});
