// Rode com: node --env-file=.env.local scripts/load-test.mjs
//
// 1. Popula um volume realista de dados (marcados com prefixo LOADTEST-, só
//    pra esse teste) para os índices terem efeito real na análise do
//    planejador — tabela quase vazia faz o Postgres preferir sequential scan
//    mesmo com índice, então testar performance sem volume não prova nada.
// 2. Simula uma rajada de envios do formulário público usando processos Node
//    independentes (um por envio) — importante: testar com Promise.all numa
//    única instância de cliente subestima a concorrência real, porque todas
//    as requisições compartilham o mesmo pool de conexão HTTP do processo.
//    Em produção cada envio roda numa função serverless isolada, com sua
//    própria conexão — processos separados aqui reproduzem isso de verdade.
// 3. Mede latência das listagens paginadas da secretaria sob concorrência.
// 4. Remove todos os dados de teste ao final (e confere que removeu mesmo).
import { createClient } from "@supabase/supabase-js";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const auth = createClient(url, key);

const PREFIXO = "LOADTEST-";
const N_ALUNOS = 500;
const N_SOLICITACOES_BURST = 40;
const N_LEITURAS_CONCORRENTES = 20;

function percentil(valores, p) {
  const ordenado = [...valores].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (ordenado.length - 1));
  return ordenado[idx];
}

async function medir(promessa) {
  const inicio = performance.now();
  const resultado = await promessa;
  return { ms: performance.now() - inicio, resultado };
}

/** Dispara um insert num processo Node filho isolado (ver nota no topo). */
function inserirEmProcessoIsolado(idx, escolaId, anoLetivoId) {
  return new Promise((resolve) => {
    const inicio = performance.now();
    let resultado = { ok: false, message: "processo encerrou sem responder" };
    const child = fork(
      path.join(__dirname, "_load-test-worker.mjs"),
      [String(idx), escolaId, anoLetivoId],
      { stdio: "ignore" },
    );
    child.on("message", (msg) => {
      resultado = msg;
    });
    child.on("exit", () => {
      resolve({ idx, ms: performance.now() - inicio, ...resultado });
    });
  });
}

const { data: signInData, error: signInError } = await auth.auth.signInWithPassword({
  email: "teste.secretaria2@raposos.mg.gov.br",
  password: "TesteSenh4Segura!2027",
});
if (signInError || !signInData.session) {
  console.error("Não foi possível logar como secretaria de teste:", signInError?.message);
  process.exit(1);
}

const { data: escolas } = await auth.from("escolas").select("id");
const { data: anosLetivos } = await auth
  .from("anos_letivos")
  .select("id")
  .eq("status", "ativo");
const escolaId = escolas?.[0]?.id;
const anoLetivoId = anosLetivos?.[0]?.id;

console.log(`\n== 1. Populando ${N_ALUNOS} alunos + matrículas de teste ==`);
const alunosParaCriar = Array.from({ length: N_ALUNOS }, (_, i) => ({
  nome: `${PREFIXO}Aluno ${i}`,
  data_nascimento: "2018-01-01",
  responsavel_nome: `${PREFIXO}Responsável ${i}`,
  responsavel_telefone: "31999990000",
}));

const alunosCriados = [];
const LOTE = 100;
for (let i = 0; i < alunosParaCriar.length; i += LOTE) {
  const lote = alunosParaCriar.slice(i, i + LOTE);
  const { data, error } = await auth.from("alunos").insert(lote).select("id");
  if (error) {
    console.error("Erro ao popular alunos:", error.message);
    process.exit(1);
  }
  alunosCriados.push(...data);
}

const matriculasParaCriar = alunosCriados.map((aluno, i) => ({
  aluno_id: aluno.id,
  escola_id: escolas[i % escolas.length].id,
  ano_letivo_id: anoLetivoId,
}));
for (let i = 0; i < matriculasParaCriar.length; i += LOTE) {
  const lote = matriculasParaCriar.slice(i, i + LOTE);
  const { error } = await auth.from("matriculas").insert(lote);
  if (error) {
    console.error("Erro ao popular matrículas:", error.message);
    process.exit(1);
  }
}
console.log(`${alunosCriados.length} alunos e matrículas criados.`);

console.log(
  `\n== 2. Rajada: ${N_SOLICITACOES_BURST} envios do formulário público em processos independentes ==`,
);
const resultadosRajada = await Promise.all(
  Array.from({ length: N_SOLICITACOES_BURST }, (_, i) =>
    inserirEmProcessoIsolado(i, escolaId, anoLetivoId),
  ),
);
const falhasRajada = resultadosRajada.filter((r) => !r.ok);
const latenciasRajada = resultadosRajada.map((r) => r.ms);

console.log(`Falhas: ${falhasRajada.length}/${N_SOLICITACOES_BURST}`);
if (falhasRajada.length > 0) {
  console.log("Detalhe das falhas:", falhasRajada.map((f) => f.message));
}
console.log(
  `Latência por request — p50: ${percentil(latenciasRajada, 50).toFixed(0)}ms | p95: ${percentil(latenciasRajada, 95).toFixed(0)}ms | max: ${Math.max(...latenciasRajada).toFixed(0)}ms`,
);
console.log(
  `(inclui overhead de iniciar um processo Node por request — em produção, cada envio já é uma função serverless independente sem esse custo extra)`,
);

console.log(
  `\n== 3. Leituras concorrentes (fila da secretaria + listagem de alunos) ==`,
);
const resultadosLeitura = await Promise.all(
  Array.from({ length: N_LEITURAS_CONCORRENTES }, (_, i) =>
    medir(
      i % 2 === 0
        ? auth
            .from("solicitacoes_matricula")
            .select("*, escolas(nome), anos_letivos(ano)", { count: "exact" })
            .eq("status", "pendente")
            .order("created_at", { ascending: false })
            .range(0, 19)
        : auth
            .from("matriculas")
            .select(
              "*, alunos(nome, data_nascimento, responsavel_nome, responsavel_telefone), escolas(nome), anos_letivos(ano)",
              { count: "exact" },
            )
            .order("created_at", { ascending: false })
            .range(0, 19),
    ),
  ),
);
const falhasLeitura = resultadosLeitura.filter((r) => r.resultado.error);
const latenciasLeitura = resultadosLeitura.map((r) => r.ms);

console.log(`Falhas: ${falhasLeitura.length}/${N_LEITURAS_CONCORRENTES}`);
console.log(
  `Latência por request — p50: ${percentil(latenciasLeitura, 50).toFixed(0)}ms | p95: ${percentil(latenciasLeitura, 95).toFixed(0)}ms | max: ${Math.max(...latenciasLeitura).toFixed(0)}ms`,
);

console.log(`\n== 4. Limpando dados de teste (prefixo ${PREFIXO}) ==`);
await auth.from("matriculas").delete().in(
  "aluno_id",
  alunosCriados.map((a) => a.id),
);
const { count: alunosRemovidos } = await auth
  .from("alunos")
  .delete({ count: "exact" })
  .like("nome", `${PREFIXO}%`);
const { count: solicitacoesRemovidas } = await auth
  .from("solicitacoes_matricula")
  .delete({ count: "exact" })
  .like("aluno_nome", `${PREFIXO}%`);

const { count: restamAlunos } = await auth
  .from("alunos")
  .select("id", { count: "exact", head: true })
  .like("nome", `${PREFIXO}%`);
const { count: restamSolicitacoes } = await auth
  .from("solicitacoes_matricula")
  .select("id", { count: "exact", head: true })
  .like("aluno_nome", `${PREFIXO}%`);

console.log(
  `Removidos: ${alunosRemovidos} alunos, ${solicitacoesRemovidas} solicitações.`,
);
console.log(
  restamAlunos === 0 && restamSolicitacoes === 0
    ? "Limpeza confirmada — nenhum dado de teste restante."
    : `ATENÇÃO: ainda restam ${restamAlunos} alunos e ${restamSolicitacoes} solicitações de teste.`,
);
