// Pipeline completo contra o Supabase real: pai envia solicitação (anon) ->
// secretaria aprova (authenticated) -> vira aluno + matrícula -> solicitação
// processada -> audit_log. Mesma lógica de src/lib/actions/aprovacao.ts,
// exercitada direto no banco (sem passar pelo Turnstile, que exige navegador).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const TESTE_SECRETARIA_EMAIL = "teste.secretaria2@raposos.mg.gov.br";
const TESTE_SECRETARIA_SENHA = "TesteSenh4Segura!2027";
const MARCADOR = `FLUXOTEST-${Date.now()}`;

let anon: SupabaseClient;
let auth: SupabaseClient;
let escolaId: string;
let anoLetivoId: string;
const idsParaLimpar = { matriculas: [] as string[], alunos: [] as string[] };

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
    throw new Error(`Login da secretaria de teste falhou: ${error.message}`);
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
  if (idsParaLimpar.matriculas.length) {
    await auth.from("matriculas").delete().in("id", idsParaLimpar.matriculas);
  }
  if (idsParaLimpar.alunos.length) {
    await auth.from("alunos").delete().in("id", idsParaLimpar.alunos);
  }
  await auth
    .from("solicitacoes_matricula")
    .delete()
    .like("aluno_nome", `${MARCADOR}%`);
});

describe("fluxo completo: solicitação pública -> aprovação -> matrícula oficial", () => {
  it("pai envia, secretaria vê na fila, aprova e a matrícula aparece na listagem oficial", async () => {
    const nomeAluno = `${MARCADOR}-aluno`;

    // 1. Pai envia (anon insert, sem .select() — anon não tem SELECT nessa
    // tabela; encadear .select() aqui provocaria falha de RLS na RETURNING).
    const { error: insertError } = await anon
      .from("solicitacoes_matricula")
      .insert({
        tipo: "nova",
        escola_id: escolaId,
        ano_letivo_id: anoLetivoId,
        aluno_nome: nomeAluno,
        aluno_data_nascimento: "2018-05-10",
        responsavel_nome: "Responsável Fluxo Teste",
        responsavel_telefone: "31999990000",
        consentimento_lgpd: true,
        consentimento_lgpd_em: new Date().toISOString(),
        ip_origem: "127.0.0.1",
      });
    expect(insertError).toBeNull();

    // 2. Secretaria vê a solicitação pendente na fila.
    const { data: pendentes } = await auth
      .from("solicitacoes_matricula")
      .select("id")
      .eq("status", "pendente")
      .eq("aluno_nome", nomeAluno);
    expect(pendentes).toHaveLength(1);
    const solicitacaoId = pendentes![0].id;

    // 3. Secretaria aprova: cria aluno + matrícula.
    const { data: aluno, error: alunoError } = await auth
      .from("alunos")
      .insert({
        nome: nomeAluno,
        data_nascimento: "2018-05-10",
        responsavel_nome: "Responsável Fluxo Teste",
        responsavel_telefone: "31999990000",
      })
      .select("id")
      .single();
    expect(alunoError).toBeNull();
    idsParaLimpar.alunos.push(aluno!.id);

    const { data: matricula, error: matriculaError } = await auth
      .from("matriculas")
      .insert({
        aluno_id: aluno!.id,
        escola_id: escolaId,
        ano_letivo_id: anoLetivoId,
        solicitacao_origem_id: solicitacaoId,
      })
      .select("id")
      .single();
    expect(matriculaError).toBeNull();
    idsParaLimpar.matriculas.push(matricula!.id);

    // 4. Marca a solicitação como processada.
    const { error: statusError } = await auth
      .from("solicitacoes_matricula")
      .update({ status: "processada" })
      .eq("id", solicitacaoId);
    expect(statusError).toBeNull();

    // 5. Grava auditoria.
    const { data: userData } = await auth.auth.getUser();
    const { error: auditError } = await auth.from("audit_log").insert({
      usuario_id: userData.user!.id,
      acao: "aprovar_solicitacao",
      tabela: "matriculas",
      registro_id: matricula!.id,
      detalhes: { solicitacao_id: solicitacaoId, teste: true },
    });
    expect(auditError).toBeNull();

    // 6. A matrícula aparece corretamente com os joins usados em /alunos.
    const { data: matriculaCompleta, error: joinError } = await auth
      .from("matriculas")
      .select("*, alunos(nome), escolas(nome), anos_letivos(ano)")
      .eq("id", matricula!.id)
      .single();
    expect(joinError).toBeNull();
    expect(matriculaCompleta!.alunos.nome).toBe(nomeAluno);

    // 7. A solicitação já não aparece mais como pendente.
    const { data: aindaPendente } = await auth
      .from("solicitacoes_matricula")
      .select("status")
      .eq("id", solicitacaoId)
      .single();
    expect(aindaPendente!.status).toBe("processada");
  }, 20_000);
});
