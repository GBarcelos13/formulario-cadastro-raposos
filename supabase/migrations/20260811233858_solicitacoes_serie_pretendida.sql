-- O pai agora informa a série pretendida no formulário público de matrícula
-- (antes só a secretaria preenchia isso na aprovação). Nullable porque já
-- existe solicitação enviada antes dessa mudança — obrigatoriedade é
-- garantida na validação do formulário (zod), não no banco.
alter table public.solicitacoes_matricula
  add column serie_pretendida text;
