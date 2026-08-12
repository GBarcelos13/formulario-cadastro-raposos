// Rode com: node --env-file=.env.local scripts/seed-demo-solicitacoes.mjs
// Cria 10 solicitações de matrícula/rematrícula pendentes, como um pai teria
// enviado pelo formulário público, para popular a fila de análise da
// secretaria com dados de demonstração.
import { createClient } from "@supabase/supabase-js";

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const { data: escolas } = await anon.from("escolas").select("id, nome");
const { data: anosLetivos } = await anon
  .from("anos_letivos")
  .select("id")
  .eq("status", "ativo")
  .limit(1);
const anoLetivoId = anosLetivos[0].id;

const solicitacoes = [
  { tipo: "nova", nome: "Heitor Augusto Ribeiro Nunes", nascimento: "2019-02-10", serie: "1º ano", responsavel: "Aline Ribeiro Nunes", tel: "31987002001" },
  { tipo: "rematricula", nome: "Alice Ferreira Moura", nascimento: "2018-05-19", serie: "2º ano", responsavel: "Diego Ferreira Moura", tel: "31987002002" },
  { tipo: "nova", nome: "Davi Lucca Santos Ramos", nascimento: "2020-08-03", serie: "Pré I", responsavel: "Tatiane Santos Ramos", tel: "31987002003" },
  { tipo: "rematricula", nome: "Manuela Cardoso Freitas", nascimento: "2017-01-27", serie: "3º ano", responsavel: "Bruno Cardoso Freitas", tel: "31987002004" },
  { tipo: "nova", nome: "Bernardo Costa Azevedo", nascimento: "2016-11-14", serie: "4º ano", responsavel: "Renata Costa Azevedo", tel: "31987002005" },
  { tipo: "rematricula", nome: "Helena Martins Correia", nascimento: "2015-06-08", serie: "5º ano", responsavel: "Felipe Martins Correia", tel: "31987002006" },
  { tipo: "nova", nome: "Theo Almeida Barros", nascimento: "2019-09-22", serie: "Maternal I", responsavel: "Bianca Almeida Barros", tel: "31987002007" },
  { tipo: "rematricula", nome: "Valentina Rocha Pires", nascimento: "2014-03-30", serie: "6º ano", responsavel: "Leandro Rocha Pires", tel: "31987002008" },
  { tipo: "nova", nome: "Arthur Sales Monteiro", nascimento: "2013-10-05", serie: "7º ano", responsavel: "Priscila Sales Monteiro", tel: "31987002009" },
  { tipo: "rematricula", nome: "Cecília Nogueira Teixeira", nascimento: "2012-12-17", serie: "8º ano", responsavel: "Vinícius Nogueira Teixeira", tel: "31987002010" },
];

for (const [i, dados] of solicitacoes.entries()) {
  const escola = escolas[i % escolas.length];
  const { error } = await anon.from("solicitacoes_matricula").insert({
    tipo: dados.tipo,
    escola_id: escola.id,
    ano_letivo_id: anoLetivoId,
    aluno_nome: dados.nome,
    aluno_data_nascimento: dados.nascimento,
    serie_pretendida: dados.serie,
    responsavel_nome: dados.responsavel,
    responsavel_telefone: dados.tel,
    consentimento_lgpd: true,
    consentimento_lgpd_em: new Date().toISOString(),
    ip_origem: "127.0.0.1",
  });
  if (error) {
    console.error(`Erro em ${dados.nome}:`, error.message);
    continue;
  }
  console.log(`OK — ${dados.nome} (${dados.tipo}, ${dados.serie}) — ${escola.nome}`);
}
