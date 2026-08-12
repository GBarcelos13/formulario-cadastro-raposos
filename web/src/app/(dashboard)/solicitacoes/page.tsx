import Link from "next/link";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

export default async function SolicitacoesPage(
  props: PageProps<"/solicitacoes">,
) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const {
    data: solicitacoes,
    count,
    error,
  } = await supabase
    .from("solicitacoes_matricula")
    .select("*, escolas(nome), anos_letivos(ano)", { count: "exact" })
    .eq("status", "pendente")
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Solicitações pendentes
        </h1>
        <span className="font-display text-3xl font-semibold text-primary">
          {count ?? 0}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Matrículas e rematrículas aguardando análise.
      </p>

      {error && (
        <p className="mt-4 text-sm text-destructive">
          Não foi possível carregar as solicitações agora.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <th className="py-3 pl-4 pr-4">Aluno</th>
                <th className="py-3 pr-4">Tipo</th>
                <th className="py-3 pr-4">Escola</th>
                <th className="py-3 pr-4">Série</th>
                <th className="py-3 pr-4">Responsável</th>
                <th className="py-3 pr-4">Telefone</th>
                <th className="py-3 pr-4">Enviado em</th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {solicitacoes?.map((solicitacao) => (
                <tr
                  key={solicitacao.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="py-3 pl-4 pr-4 font-medium">
                    {solicitacao.aluno_nome}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={
                        solicitacao.tipo === "nova" ? "default" : "secondary"
                      }
                    >
                      {solicitacao.tipo === "nova" ? "Nova" : "Rematrícula"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {solicitacao.escolas?.nome ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {solicitacao.serie_pretendida ?? "—"}
                  </td>
                  <td className="py-3 pr-4">{solicitacao.responsavel_nome}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {solicitacao.responsavel_telefone}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {new Date(solicitacao.created_at).toLocaleDateString(
                      "pt-BR",
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <Link
                      href={`/solicitacoes/${solicitacao.id}`}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Analisar
                    </Link>
                  </td>
                </tr>
              ))}
              {solicitacoes?.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Inbox className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhuma solicitação pendente.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          {page > 1 && (
            <Link
              href={`/solicitacoes?page=${page - 1}`}
              className="text-primary hover:underline"
            >
              Anterior
            </Link>
          )}
          <span className="text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/solicitacoes?page=${page + 1}`}
              className="text-primary hover:underline"
            >
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
