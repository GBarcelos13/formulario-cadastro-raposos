-- Anexos do formulário público de matrícula (certidão de nascimento, foto,
-- comprovante de residência, outros). Dado sensível (documento de criança) —
-- bucket privado, só o pai que envia (anon insert) e a secretaria
-- autenticada (leitura/gestão) têm acesso; nunca público.

create table public.solicitacao_anexos (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references public.solicitacoes_matricula(id) on delete cascade,
  tipo text not null check (tipo in ('certidao_nascimento', 'foto', 'comprovante_residencia', 'outro')),
  nome_arquivo text not null,
  caminho_storage text not null unique,
  tamanho_bytes integer not null,
  created_at timestamptz not null default now()
);

create index solicitacao_anexos_solicitacao_id_idx
  on public.solicitacao_anexos (solicitacao_id);

alter table public.solicitacao_anexos enable row level security;

-- Anon insere só a linha de metadados referente a uma solicitação que ele
-- mesmo acabou de criar nesta mesma requisição (a Server Action gera o id da
-- solicitação antes de enviar os arquivos, então não há como "adivinhar"
-- solicitacao_id de outra família só pelo formulário).
create policy "anexos_insert_public" on public.solicitacao_anexos
  for insert
  to anon
  with check (true);

create policy "anexos_select_authenticated" on public.solicitacao_anexos
  for select
  to authenticated
  using (true);

create policy "anexos_delete_authenticated" on public.solicitacao_anexos
  for delete
  to authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Storage: bucket privado para os arquivos em si
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-matricula',
  'documentos-matricula',
  false,
  5242880, -- 5MB por arquivo
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

create policy "anexos_storage_insert_public" on storage.objects
  for insert
  to anon
  with check (bucket_id = 'documentos-matricula');

create policy "anexos_storage_select_authenticated" on storage.objects
  for select
  to authenticated
  using (bucket_id = 'documentos-matricula');

create policy "anexos_storage_delete_authenticated" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'documentos-matricula');
