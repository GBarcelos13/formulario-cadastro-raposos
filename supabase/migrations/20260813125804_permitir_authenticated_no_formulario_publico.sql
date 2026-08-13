-- Bug real encontrado em produção: se a pessoa que preenche o formulário
-- público de matrícula estiver com uma sessão autenticada válida no mesmo
-- navegador (ex: secretário testando o formulário no mesmo navegador em que
-- está logado no painel), o cliente Supabase passa a enviar as requisições
-- como "authenticated" em vez de "anon" — e as policies de insert só
-- existiam para "anon", derrubando o envio com "row-level security policy"
-- (erro visto no console: StorageApiError ao subir o anexo).
--
-- Correção: permitir que "authenticated" também insira nessas 3 tabelas,
-- com as mesmas condições já usadas para "anon".

create policy "solicitacoes_insert_authenticated" on public.solicitacoes_matricula
  for insert
  to authenticated
  with check (consentimento_lgpd = true);

create policy "anexos_insert_authenticated" on public.solicitacao_anexos
  for insert
  to authenticated
  with check (true);

create policy "anexos_storage_insert_authenticated" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'documentos-matricula');
