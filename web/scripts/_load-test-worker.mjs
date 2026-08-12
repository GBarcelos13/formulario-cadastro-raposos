// Worker chamado por load-test.mjs via fork() — um processo por envio,
// simulando uma submissão independente do formulário público. Não rode
// diretamente; precisa das mesmas env vars (repassadas pelo processo pai).
import { createClient } from "@supabase/supabase-js";

const [idx, escolaId, anoLetivoId] = process.argv.slice(2);

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const { error } = await anon.from("solicitacoes_matricula").insert({
  tipo: "nova",
  escola_id: escolaId,
  ano_letivo_id: anoLetivoId,
  aluno_nome: `LOADTEST-Solicitação ${idx}`,
  aluno_data_nascimento: "2019-01-01",
  responsavel_nome: `LOADTEST-Responsável ${idx}`,
  responsavel_telefone: "31999990000",
  consentimento_lgpd: true,
  consentimento_lgpd_em: new Date().toISOString(),
  ip_origem: `127.0.0.${Number(idx) % 255}`,
});

// IPC em vez de exit code: mais confiável para módulos ESM com top-level
// await — o código de saída do processo pode não refletir o resultado do
// insert de forma consistente.
process.send?.({ ok: !error, message: error?.message });
process.exit(0);
