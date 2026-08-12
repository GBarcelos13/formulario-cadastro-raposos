// Rode com: node --env-file=.env.local scripts/verify-schema.mjs
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const results = [];

async function checkTableReadable(table) {
  const { error } = await supabase.from(table).select("id").limit(1);
  results.push({
    check: `SELECT em "${table}" como anon`,
    ok: !error,
    detail: error?.message ?? "ok",
  });
}

async function checkAnonInsertBlocked(table, row) {
  const { error } = await supabase.from(table).insert(row);
  results.push({
    check: `INSERT em "${table}" como anon deve ser BLOQUEADO`,
    ok: !!error,
    detail: error?.message ?? "PROBLEMA: insert passou sem erro",
  });
}

async function checkAnonInsertAllowed(table, row) {
  const { error } = await supabase.from(table).insert(row).select();
  results.push({
    check: `INSERT em "${table}" como anon (sem consentimento) deve ser BLOQUEADO`,
    ok: !!error,
    detail: error?.message ?? "PROBLEMA: insert passou sem erro",
  });
}

await checkTableReadable("escolas");
await checkTableReadable("anos_letivos");
await checkAnonInsertBlocked("alunos", {
  nome: "teste",
  data_nascimento: "2015-01-01",
  responsavel_nome: "teste",
  responsavel_telefone: "0000000000",
});
await checkAnonInsertBlocked("matriculas", {
  aluno_id: "00000000-0000-0000-0000-000000000000",
  escola_id: "00000000-0000-0000-0000-000000000000",
  ano_letivo_id: "00000000-0000-0000-0000-000000000000",
});
await checkAnonInsertAllowed("solicitacoes_matricula", {
  tipo: "nova",
  escola_id: "00000000-0000-0000-0000-000000000000",
  ano_letivo_id: "00000000-0000-0000-0000-000000000000",
  aluno_nome: "teste",
  aluno_data_nascimento: "2015-01-01",
  responsavel_nome: "teste",
  responsavel_telefone: "0000000000",
  consentimento_lgpd: false,
});

let allOk = true;
for (const r of results) {
  console.log(`${r.ok ? "OK  " : "FAIL"} — ${r.check} :: ${r.detail}`);
  if (!r.ok) allOk = false;
}
process.exit(allOk ? 0 : 1);
