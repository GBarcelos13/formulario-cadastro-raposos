-- A secretaria precisa poder remover solicitações (spam, duplicadas, testes)
-- da fila. Faltava essa policy — sem ela, nem a própria secretaria conseguia
-- apagar uma solicitação indevida.
create policy "solicitacoes_delete_authenticated" on public.solicitacoes_matricula
  for delete
  to authenticated
  using (true);
