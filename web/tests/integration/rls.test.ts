// Testes de integração contra o projeto Supabase real (não há Supabase local
// neste projeto). Precisam de NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY em
// .env.local (carregado por vitest.setup.ts) e do usuário de teste da
// secretaria (ver TESTE_SECRETARIA_EMAIL abaixo).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TESTE_SECRETARIA_EMAIL = "teste.secretaria2@raposos.mg.gov.br";
const TESTE_SECRETARIA_SENHA = "TesteSenh4Segura!2027";
const MARCADOR = `RLSTEST-${Date.now()}`;

let anon: SupabaseClient;
let auth: SupabaseClient;
let escolaId: string;
let anoLetivoId: string;

beforeAll(async () => {
  anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  auth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { error } = await auth.auth.signInWithPassword({
    email: TESTE_SECRETARIA_EMAIL,
    password: TESTE_SECRETARIA_SENHA,
  });
  if (error) {
    throw new Error(
      `Não foi possível logar com o usuário de teste da secretaria: ${error.message}`,
    );
  }

  const { data: escolas } = await anon.from("escolas").select("id").limit(1);
  const { data: anosLetivos } = await anon
    .from("anos_letivos")
    .select("id")
    .eq("status", "ativo")
    .limit(1);
  escolaId = escolas![0].id;
  anoLetivoId = anosLetivos![0].id;
});

afterAll(async () => {
  await auth.from("solicitacoes_matricula").delete().like("aluno_nome", `${MARCADOR}%`);
  await auth.from("alunos").delete().like("nome", `${MARCADOR}%`);
});

describe("tabelas de referência (escolas, anos_letivos)", () => {
  it("anônimo consegue ler escolas", async () => {
    const { data, error } = await anon.from("escolas").select("id").limit(1);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("anônimo não consegue escrever em escolas", async () => {
    const { error } = await anon
      .from("escolas")
      .insert({ nome: `${MARCADOR}-Escola Falsa` });
    expect(error).not.toBeNull();
  });
});

describe("solicitacoes_matricula (superfície pública)", () => {
  it("anônimo consegue inserir solicitação com consentimento_lgpd=true", async () => {
    const { error } = await anon.from("solicitacoes_matricula").insert({
      tipo: "nova",
      escola_id: escolaId,
      ano_letivo_id: anoLetivoId,
      aluno_nome: `${MARCADOR}-aluno-ok`,
      aluno_data_nascimento: "2019-01-01",
      responsavel_nome: "Responsável Teste",
      responsavel_telefone: "31999990000",
      consentimento_lgpd: true,
      consentimento_lgpd_em: new Date().toISOString(),
    });
    expect(error).toBeNull();
  });

  it("anônimo NÃO consegue inserir solicitação sem consentimento_lgpd", async () => {
    const { error } = await anon.from("solicitacoes_matricula").insert({
      tipo: "nova",
      escola_id: escolaId,
      ano_letivo_id: anoLetivoId,
      aluno_nome: `${MARCADOR}-aluno-sem-consentimento`,
      aluno_data_nascimento: "2019-01-01",
      responsavel_nome: "Responsável Teste",
      responsavel_telefone: "31999990000",
      consentimento_lgpd: false,
    });
    expect(error).not.toBeNull();
  });

  it("anônimo NÃO consegue ler solicitações (só a secretaria)", async () => {
    const { data, error } = await anon
      .from("solicitacoes_matricula")
      .select("id");
    // RLS sem policy de SELECT para anon: sem erro, mas 0 linhas.
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("secretaria autenticada consegue ler a solicitação inserida", async () => {
    const { data, error } = await auth
      .from("solicitacoes_matricula")
      .select("id, status")
      .eq("aluno_nome", `${MARCADOR}-aluno-ok`);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].status).toBe("pendente");
  });
});

describe("alunos e matriculas (cadastro oficial)", () => {
  it("anônimo NÃO consegue inserir aluno", async () => {
    const { error } = await anon.from("alunos").insert({
      nome: `${MARCADOR}-aluno`,
      data_nascimento: "2019-01-01",
      responsavel_nome: "x",
      responsavel_telefone: "31999990000",
    });
    expect(error).not.toBeNull();
  });

  it("secretaria autenticada consegue criar aluno e matrícula, e a constraint única bloqueia duplicata", async () => {
    const { data: aluno, error: alunoError } = await auth
      .from("alunos")
      .insert({
        nome: `${MARCADOR}-aluno-oficial`,
        data_nascimento: "2019-01-01",
        responsavel_nome: "Responsável Teste",
        responsavel_telefone: "31999990000",
      })
      .select("id")
      .single();
    expect(alunoError).toBeNull();

    const { error: matriculaError } = await auth.from("matriculas").insert({
      aluno_id: aluno!.id,
      escola_id: escolaId,
      ano_letivo_id: anoLetivoId,
    });
    expect(matriculaError).toBeNull();

    const { error: duplicataError } = await auth.from("matriculas").insert({
      aluno_id: aluno!.id,
      escola_id: escolaId,
      ano_letivo_id: anoLetivoId,
    });
    expect(duplicataError?.code).toBe("23505");

    await auth.from("matriculas").delete().eq("aluno_id", aluno!.id);
  });
});
