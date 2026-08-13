// Simula exatamente o fluxo novo: navegador sobe o arquivo direto pro
// Storage (anon), depois a "Server Action" insere a solicitação + metadata.
import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
const auth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const { data: escolas } = await anon.from("escolas").select("id").limit(1);
const { data: anosLetivos } = await anon
  .from("anos_letivos")
  .select("id")
  .eq("status", "ativo")
  .limit(1);

const solicitacaoId = crypto.randomUUID();
const marcador = `SMOKEANEXO-${Date.now()}`;

// 1. Upload direto (anon), como o navegador faria.
const conteudo = new Blob(["conteudo de teste"], { type: "application/pdf" });
const caminho = `${solicitacaoId}/certidao_nascimento-${Date.now()}-teste.pdf`;
const { error: uploadError } = await anon.storage
  .from("documentos-matricula")
  .upload(caminho, conteudo, { contentType: "application/pdf" });
console.log("1. upload direto (anon):", uploadError ? "ERRO: " + uploadError.message : "ok");

// 2. Insert da solicitação (como a Server Action faz).
const { error: insertError } = await anon.from("solicitacoes_matricula").insert({
  id: solicitacaoId,
  tipo: "nova",
  escola_id: escolas[0].id,
  ano_letivo_id: anosLetivos[0].id,
  aluno_nome: marcador,
  aluno_data_nascimento: "2019-01-01",
  serie_pretendida: "1º ano",
  responsavel_nome: "Responsavel Smoke",
  responsavel_telefone: "31999990000",
  consentimento_lgpd: true,
  consentimento_lgpd_em: new Date().toISOString(),
  ip_origem: "127.0.0.1",
});
console.log("2. insert da solicitação:", insertError ? "ERRO: " + insertError.message : "ok");

// 3. Insert do metadata do anexo (como a Server Action faz).
const { error: anexoError } = await anon.from("solicitacao_anexos").insert({
  solicitacao_id: solicitacaoId,
  tipo: "certidao_nascimento",
  nome_arquivo: "teste.pdf",
  caminho_storage: caminho,
  tamanho_bytes: conteudo.size,
});
console.log("3. insert do metadata do anexo:", anexoError ? "ERRO: " + anexoError.message : "ok");

// 4. Secretaria vê tudo certinho.
await auth.auth.signInWithPassword({
  email: "teste.secretaria2@raposos.mg.gov.br",
  password: "TesteSenh4Segura!2027",
});
const { data: solicitacao } = await auth
  .from("solicitacoes_matricula")
  .select("*, solicitacao_anexos(*)")
  .eq("id", solicitacaoId)
  .single();
console.log("4. secretaria enxerga a solicitação com anexo:", solicitacao?.solicitacao_anexos?.length === 1 ? "ok" : "PROBLEMA");

const { data: signedUrl } = await auth.storage
  .from("documentos-matricula")
  .createSignedUrl(caminho, 60);
console.log("5. secretaria consegue gerar link do anexo:", signedUrl?.signedUrl ? "ok" : "PROBLEMA");

// Limpeza.
await auth.storage.from("documentos-matricula").remove([caminho]);
await auth.from("solicitacoes_matricula").delete().eq("id", solicitacaoId);
console.log("6. limpeza concluída.");
