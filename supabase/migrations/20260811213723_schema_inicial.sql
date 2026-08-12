-- Schema inicial: cadastro de alunos por ano letivo (Secretaria de Educação de Raposos-MG)
-- Duas pontas: formulário público de matrícula/rematrícula (anon insert) e
-- cadastro oficial gerenciado pela secretaria (authenticated only).

-- ─────────────────────────────────────────────────────────────────────────
-- Tabelas de referência
-- ─────────────────────────────────────────────────────────────────────────

create table public.escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table public.anos_letivos (
  id uuid primary key default gen_random_uuid(),
  ano integer not null unique,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Solicitações públicas de matrícula/rematrícula (escrita anônima isolada)
-- ─────────────────────────────────────────────────────────────────────────

create table public.solicitacoes_matricula (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('nova', 'rematricula')),
  escola_id uuid not null references public.escolas(id),
  ano_letivo_id uuid not null references public.anos_letivos(id),
  aluno_nome text not null,
  aluno_data_nascimento date not null,
  aluno_documento text,
  responsavel_nome text not null,
  responsavel_telefone text not null,
  responsavel_email text,
  observacoes text,
  consentimento_lgpd boolean not null default false,
  consentimento_lgpd_em timestamptz,
  status text not null default 'pendente' check (status in ('pendente', 'processada')),
  ip_origem text,
  created_at timestamptz not null default now(),
  constraint consentimento_lgpd_obrigatorio check (consentimento_lgpd = true)
);

create index solicitacoes_matricula_status_created_idx
  on public.solicitacoes_matricula (status, created_at);

-- ─────────────────────────────────────────────────────────────────────────
-- Cadastro oficial (só a secretaria escreve; nasce de uma aprovação)
-- ─────────────────────────────────────────────────────────────────────────

create table public.alunos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_nascimento date not null,
  documento text,
  responsavel_nome text not null,
  responsavel_telefone text not null,
  responsavel_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index alunos_nome_idx on public.alunos (nome);

create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  escola_id uuid not null references public.escolas(id),
  ano_letivo_id uuid not null references public.anos_letivos(id),
  turma text,
  serie text,
  status text not null default 'ativa' check (status in ('ativa', 'transferido', 'cancelada')),
  data_matricula date not null default current_date,
  solicitacao_origem_id uuid references public.solicitacoes_matricula(id),
  created_at timestamptz not null default now(),
  unique (aluno_id, ano_letivo_id)
);

create index matriculas_ano_escola_idx
  on public.matriculas (ano_letivo_id, escola_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Auditoria (rastreabilidade — ver princípios da especificação funcional)
-- ─────────────────────────────────────────────────────────────────────────

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id),
  acao text not null,
  tabela text not null,
  registro_id uuid,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at automático em alunos
-- ─────────────────────────────────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger alunos_set_updated_at
  before update on public.alunos
  for each row
  execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table public.escolas enable row level security;
alter table public.anos_letivos enable row level security;
alter table public.solicitacoes_matricula enable row level security;
alter table public.alunos enable row level security;
alter table public.matriculas enable row level security;
alter table public.audit_log enable row level security;

-- escolas / anos_letivos: leitura pública (o formulário precisa listar as opções);
-- escrita só para a secretaria autenticada.
create policy "escolas_select_all" on public.escolas
  for select
  to anon, authenticated
  using (true);

create policy "escolas_write_authenticated" on public.escolas
  for all
  to authenticated
  using (true)
  with check (true);

create policy "anos_letivos_select_all" on public.anos_letivos
  for select
  to anon, authenticated
  using (true);

create policy "anos_letivos_write_authenticated" on public.anos_letivos
  for all
  to authenticated
  using (true)
  with check (true);

-- solicitacoes_matricula: qualquer pai (anon) pode inserir, mas não pode ler
-- nem alterar solicitações (evita vazar dados de outras famílias). Só a
-- secretaria autenticada lê e processa a fila.
create policy "solicitacoes_insert_public" on public.solicitacoes_matricula
  for insert
  to anon
  with check (consentimento_lgpd = true);

create policy "solicitacoes_select_authenticated" on public.solicitacoes_matricula
  for select
  to authenticated
  using (true);

create policy "solicitacoes_update_authenticated" on public.solicitacoes_matricula
  for update
  to authenticated
  using (true)
  with check (true);

-- alunos / matriculas: cadastro oficial, acesso só para a secretaria autenticada.
create policy "alunos_all_authenticated" on public.alunos
  for all
  to authenticated
  using (true)
  with check (true);

create policy "matriculas_all_authenticated" on public.matriculas
  for all
  to authenticated
  using (true)
  with check (true);

-- audit_log: só a secretaria autenticada grava e lê; ninguém edita/apaga
-- (log imutável — sem policy de update/delete, RLS nega por padrão).
create policy "audit_log_insert_authenticated" on public.audit_log
  for insert
  to authenticated
  with check (true);

create policy "audit_log_select_authenticated" on public.audit_log
  for select
  to authenticated
  using (true);
