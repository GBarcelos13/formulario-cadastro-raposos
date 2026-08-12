import { describe, expect, it } from "vitest";
import { aprovarSolicitacaoSchema } from "@/lib/schemas/aprovacao";

const payloadValido = {
  solicitacaoId: "234c917a-7f27-46d5-9454-c618555dfe2d",
  escolaId: "234c917a-7f27-46d5-9454-c618555dfe2d",
  anoLetivoId: "2dde9abe-0b6b-4191-bee9-08241cbbda0a",
  alunoIdExistente: "",
  nome: "Maria da Silva",
  dataNascimento: "2018-05-10",
  documento: "",
  responsavelNome: "João da Silva",
  responsavelTelefone: "31999990000",
  responsavelEmail: "",
  turma: "",
  serie: "",
};

describe("aprovarSolicitacaoSchema", () => {
  it("aceita um payload válido sem vincular a aluno existente", () => {
    const resultado = aprovarSolicitacaoSchema.safeParse(payloadValido);
    expect(resultado.success).toBe(true);
  });

  it("aceita um payload válido vinculando a um aluno existente", () => {
    const resultado = aprovarSolicitacaoSchema.safeParse({
      ...payloadValido,
      alunoIdExistente: "8e0a471f-18b7-4d5c-870e-e0b4a3a02b2c",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita alunoIdExistente que não é um uuid válido", () => {
    const resultado = aprovarSolicitacaoSchema.safeParse({
      ...payloadValido,
      alunoIdExistente: "abc123",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita nome do aluno muito curto", () => {
    const resultado = aprovarSolicitacaoSchema.safeParse({
      ...payloadValido,
      nome: "AB",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita data de nascimento inválida", () => {
    const resultado = aprovarSolicitacaoSchema.safeParse({
      ...payloadValido,
      dataNascimento: "não é uma data",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita telefone do responsável muito curto", () => {
    const resultado = aprovarSolicitacaoSchema.safeParse({
      ...payloadValido,
      responsavelTelefone: "123",
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita turma e série vazias (preenchidas depois pela secretaria)", () => {
    const resultado = aprovarSolicitacaoSchema.safeParse(payloadValido);
    expect(resultado.success).toBe(true);
  });

  it("rejeita solicitacaoId ausente", () => {
    const semSolicitacaoId: Record<string, unknown> = { ...payloadValido };
    delete semSolicitacaoId.solicitacaoId;
    const resultado = aprovarSolicitacaoSchema.safeParse(semSolicitacaoId);
    expect(resultado.success).toBe(false);
  });
});
