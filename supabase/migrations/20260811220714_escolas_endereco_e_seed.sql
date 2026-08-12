-- Adiciona endereço às escolas e popula dados reais (6 escolas municipais de
-- Raposos-MG + ano letivo 2027, marcado como ativo para receber solicitações).

alter table public.escolas
  add column endereco text;

insert into public.anos_letivos (ano, status)
values (2027, 'ativo');

insert into public.escolas (nome, endereco) values
  ('Escola Municipal Doutor Francisco dos Santos Cabral', 'Morro das Bicas, Raposos - MG'),
  ('Escola Municipal Sagrado Coração de Jesus', 'Centro, Raposos - MG'),
  ('Escola Municipal Professora Elizabete Carmo Santos Dias', 'Rua Sônia Silva Matos, Morro das Bicas, Raposos - MG'),
  ('Escola Municipal Francisco Diogo Félix', 'Vila Bela, Raposos - MG'),
  ('Escola Municipal Professora Maria Antônia de Souza França', 'Rua Randolfo Ferreira Tôrres, Recanto Feliz, Raposos - MG'),
  ('Escola Municipal Professora Maria José Augusta dos Santos Albuquerque', 'Novo Horizonte, Raposos - MG');
