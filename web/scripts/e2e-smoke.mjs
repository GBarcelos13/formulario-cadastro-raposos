// Rode com: node --env-file=.env.local scripts/e2e-smoke.mjs
// Simula o pipeline completo (sem passar pelo Turnstile, que exige navegador):
// pai envia solicitação (anon) -> secretaria aprova (authenticated) -> vira
// aluno + matrícula -> solicitação marcada como processada -> audit_log.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const anon = createClient(url, key);
const auth = createClient(url, key);

function assert(condition, message) {
  console.log(`${condition ? "OK  " : "FAIL"} — ${message}`);
  if (!condition) process.exitCode = 1;
}

const { data: escolas } = await anon.from("escolas").select("id").limit(1);
const { data: anosLetivos } = await anon
  .from("anos_letivos")
  .select("id")
  .eq("status", "ativo")
  .limit(1);

const escolaId = escolas?.[0]?.id;
const anoLetivoId = anosLetivos?.[0]?.id;
assert(!!escolaId, "encontrou uma escola semeada");
assert(!!anoLetivoId, "encontrou o ano letivo ativo (2027)");

// 1. Pai envia solicitação (anon insert) — igual à Server Action real, sem
// .select() depois: anon não tem policy de leitura em solicitacoes_matricula,
// então encadear .select() aqui provocaria uma falha de RLS na cláusula
// RETURNING (mesma pegadinha do "UPDATE exige SELECT policy", mas para INSERT).
const marcador = `smoke-${Date.now()}`;
const { error: insertError } = await anon.from("solicitacoes_matricula").insert({
  tipo: "nova",
  escola_id: escolaId,
  ano_letivo_id: anoLetivoId,
  aluno_nome: marcador,
  aluno_data_nascimento: "2018-05-10",
  responsavel_nome: "Responsável Smoke Teste",
  responsavel_telefone: "31999990000",
  consentimento_lgpd: true,
  consentimento_lgpd_em: new Date().toISOString(),
  ip_origem: "127.0.0.1",
});

assert(!insertError, `pai consegue enviar solicitação (${insertError?.message ?? "sem erro"})`);

// 2. Secretaria loga.
const { data: signInData, error: signInError } = await auth.auth.signInWithPassword({
  email: "teste.secretaria2@raposos.mg.gov.br",
  password: "TesteSenh4Segura!2027",
});
assert(!signInError && !!signInData.session, "secretaria consegue logar");

// 3. Secretaria vê a solicitação na fila (só ela tem SELECT nessa tabela).
const { data: pendentes, error: listError } = await auth
  .from("solicitacoes_matricula")
  .select("id")
  .eq("status", "pendente")
  .eq("aluno_nome", marcador);
assert(
  !listError && pendentes?.length === 1,
  "secretaria autenticada vê a solicitação pendente",
);
const solicitacao = pendentes?.[0];

// 4. Secretaria aprova: cria aluno + matrícula (mesma lógica de src/lib/actions/aprovacao.ts).
const { data: novoAluno, error: alunoError } = await auth
  .from("alunos")
  .insert({
    nome: marcador,
    data_nascimento: "2018-05-10",
    responsavel_nome: "Responsável Smoke Teste",
    responsavel_telefone: "31999990000",
  })
  .select("id")
  .single();
assert(!alunoError, `cria registro oficial do aluno (${alunoError?.message ?? "sem erro"})`);

const { data: matricula, error: matriculaError } = await auth
  .from("matriculas")
  .insert({
    aluno_id: novoAluno?.id,
    escola_id: escolaId,
    ano_letivo_id: anoLetivoId,
    solicitacao_origem_id: solicitacao?.id,
  })
  .select("id")
  .single();
assert(!matriculaError, `cria matrícula vinculada ao ano letivo (${matriculaError?.message ?? "sem erro"})`);

const { error: statusError } = await auth
  .from("solicitacoes_matricula")
  .update({ status: "processada" })
  .eq("id", solicitacao?.id ?? "");
assert(!statusError, "marca solicitação como processada");

const { data: userData } = await auth.auth.getUser();
const { error: auditError } = await auth.from("audit_log").insert({
  usuario_id: userData.user?.id,
  acao: "aprovar_solicitacao",
  tabela: "matriculas",
  registro_id: matricula?.id,
  detalhes: { solicitacao_id: solicitacao?.id, smoke_test: true },
});
assert(!auditError, "grava entrada de auditoria");

// 5. Confere que a matrícula aparece na listagem oficial (join usado em /alunos).
const { data: matriculaCompleta, error: joinError } = await auth
  .from("matriculas")
  .select("*, alunos(nome), escolas(nome), anos_letivos(ano)")
  .eq("id", matricula?.id ?? "")
  .single();
assert(
  !joinError && matriculaCompleta?.alunos?.nome === marcador,
  "matrícula aparece corretamente com os joins usados em /alunos",
);

// 6. Duplicar a mesma matrícula (mesmo aluno + ano letivo) deve ser bloqueado.
const { error: dupError } = await auth.from("matriculas").insert({
  aluno_id: novoAluno?.id,
  escola_id: escolaId,
  ano_letivo_id: anoLetivoId,
});
assert(
  dupError?.code === "23505",
  `constraint única bloqueia matrícula duplicada (${dupError?.code ?? "não bloqueou!"})`,
);

// Limpeza dos dados de teste — verifica de verdade, não assume sucesso
// (RLS pode bloquear o delete silenciosamente: 0 linhas afetadas, sem erro).
const { count: c1 } = await auth
  .from("matriculas")
  .delete({ count: "exact" })
  .eq("id", matricula?.id ?? "");
const { count: c2 } = await auth
  .from("alunos")
  .delete({ count: "exact" })
  .eq("id", novoAluno?.id ?? "");
const { count: c3 } = await auth
  .from("solicitacoes_matricula")
  .delete({ count: "exact" })
  .eq("id", solicitacao?.id ?? "");
assert(
  c1 === 1 && c2 === 1 && c3 === 1,
  `limpeza removeu os 3 registros de teste (matricula=${c1}, aluno=${c2}, solicitacao=${c3})`,
);
