// Rode com: node --env-file=.env.local scripts/seed-demo-alunos.mjs
// Cria 10 cadastros fictícios (alunos + matrículas) para servir de dado de
// demonstração/estilização das telas. Não são dados de teste descartáveis —
// ficam no banco até serem removidos manualmente pela secretaria.
import { createClient } from "@supabase/supabase-js";

const auth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const { error: signInError } = await auth.auth.signInWithPassword({
  email: "teste.secretaria2@raposos.mg.gov.br",
  password: "TesteSenh4Segura!2027",
});
if (signInError) {
  console.error("Login falhou:", signInError.message);
  process.exit(1);
}

const { data: escolas } = await auth.from("escolas").select("id, nome");
const { data: anosLetivos } = await auth
  .from("anos_letivos")
  .select("id")
  .eq("status", "ativo")
  .limit(1);
const anoLetivoId = anosLetivos[0].id;

const alunos = [
  { nome: "Ana Clara Souza Ferreira", nascimento: "2019-03-12", serie: "1º ano", responsavel: "Fernanda Souza Ferreira", tel: "31988001001" },
  { nome: "Pedro Henrique Oliveira Santos", nascimento: "2018-07-22", serie: "2º ano", responsavel: "Marcos Oliveira Santos", tel: "31988001002" },
  { nome: "Maria Eduarda Costa Almeida", nascimento: "2020-01-15", serie: "Pré II", responsavel: "Juliana Costa Almeida", tel: "31988001003" },
  { nome: "João Miguel Rodrigues Lima", nascimento: "2017-11-05", serie: "3º ano", responsavel: "Roberto Rodrigues Lima", tel: "31988001004" },
  { nome: "Sophia Vitória Pereira Gomes", nascimento: "2016-09-30", serie: "4º ano", responsavel: "Camila Pereira Gomes", tel: "31988001005" },
  { nome: "Gabriel Augusto Martins Silva", nascimento: "2015-04-18", serie: "5º ano", responsavel: "André Martins Silva", tel: "31988001006" },
  { nome: "Isabela Cristina Barbosa Rocha", nascimento: "2019-06-25", serie: "Maternal II", responsavel: "Patrícia Barbosa Rocha", tel: "31988001007" },
  { nome: "Lucas Gabriel Nunes Carvalho", nascimento: "2014-02-14", serie: "6º ano", responsavel: "Fabiano Nunes Carvalho", tel: "31988001008" },
  { nome: "Laura Beatriz Fernandes Dias", nascimento: "2013-12-01", serie: "7º ano", responsavel: "Simone Fernandes Dias", tel: "31988001009" },
  { nome: "Enzo Rafael Cardoso Teixeira", nascimento: "2012-08-09", serie: "8º ano", responsavel: "Ricardo Cardoso Teixeira", tel: "31988001010" },
];

for (const [i, dados] of alunos.entries()) {
  const escola = escolas[i % escolas.length];

  const { data: aluno, error: alunoError } = await auth
    .from("alunos")
    .insert({
      nome: dados.nome,
      data_nascimento: dados.nascimento,
      responsavel_nome: dados.responsavel,
      responsavel_telefone: dados.tel,
    })
    .select("id")
    .single();
  if (alunoError) {
    console.error(`Erro ao criar ${dados.nome}:`, alunoError.message);
    continue;
  }

  const { error: matriculaError } = await auth.from("matriculas").insert({
    aluno_id: aluno.id,
    escola_id: escola.id,
    ano_letivo_id: anoLetivoId,
    serie: dados.serie,
    status: "ativa",
  });
  if (matriculaError) {
    console.error(`Erro na matrícula de ${dados.nome}:`, matriculaError.message);
    continue;
  }

  console.log(`OK — ${dados.nome} (${dados.serie}) — ${escola.nome}`);
}
