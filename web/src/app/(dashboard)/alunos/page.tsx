import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { SelectNative } from "@/components/ui/select-native";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa",
  transferido: "Transferido",
  cancelada: "Cancelada",
};

function initials(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

export default async function AlunosPage(props: PageProps<"/alunos">) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const escolaId =
    typeof searchParams.escolaId === "string" ? searchParams.escolaId : "";
  const anoLetivoId =
    typeof searchParams.anoLetivoId === "string"
      ? searchParams.anoLetivoId
      : "";
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ data: escolas }, { data: anosLetivos }] = await Promise.all([
    supabase.from("escolas").select("id, nome").order("nome"),
    supabase
      .from("anos_letivos")
      .select("id, ano")
      .order("ano", { ascending: false }),
  ]);

  let query = supabase
    .from("matriculas")
    .select(
      "*, alunos(nome, data_nascimento, responsavel_nome, responsavel_telefone), escolas(nome), anos_letivos(ano)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (escolaId) query = query.eq("escola_id", escolaId);
  if (anoLetivoId) query = query.eq("ano_letivo_id", anoLetivoId);

  const { data: matriculas, count } = await query;
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  const filterHref = (params: Record<string, string>) => {
    const usp = new URLSearchParams({ escolaId, anoLetivoId, ...params });
    for (const [key, value] of [...usp.entries()]) {
      if (!value) usp.delete(key);
    }
    return `/alunos?${usp.toString()}`;
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Alunos matriculados
        </h1>
        <span className="font-display text-3xl font-semibold text-primary">
          {count ?? 0}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Cadastro oficial da rede municipal de ensino.
      </p>

      <form
        className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-secondary/40 p-3"
        method="get"
      >
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Escola</label>
          <SelectNative
            name="escolaId"
            defaultValue={escolaId}
            className="min-w-48 bg-card"
          >
            <option value="">Todas as escolas</option>
            {escolas?.map((escola) => (
              <option key={escola.id} value={escola.id}>
                {escola.nome}
              </option>
            ))}
          </SelectNative>
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Ano letivo</label>
          <SelectNative
            name="anoLetivoId"
            defaultValue={anoLetivoId}
            className="min-w-32 bg-card"
          >
            <option value="">Todos</option>
            {anosLetivos?.map((ano) => (
              <option key={ano.id} value={ano.id}>
                {ano.ano}
              </option>
            ))}
          </SelectNative>
        </div>
        <button
          type="submit"
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <th className="py-3 pl-4 pr-4">Aluno</th>
                <th className="py-3 pr-4">Escola</th>
                <th className="py-3 pr-4">Ano letivo</th>
                <th className="py-3 pr-4">Série</th>
                <th className="py-3 pr-4">Responsável</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {matriculas?.map((matricula) => (
                <tr
                  key={matricula.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="py-2.5 pl-4 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(matricula.alunos?.nome ?? "?")}
                      </span>
                      <span className="font-medium">
                        {matricula.alunos?.nome}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {matricula.escolas?.nome}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {matricula.anos_letivos?.ano}
                  </td>
                  <td className="py-2.5 pr-4">{matricula.serie ?? "—"}</td>
                  <td className="py-2.5 pr-4">
                    {matricula.alunos?.responsavel_nome}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge
                      variant={
                        matricula.status === "ativa" ? "default" : "outline"
                      }
                    >
                      {STATUS_LABEL[matricula.status] ?? matricula.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {matriculas?.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <GraduationCap className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhuma matrícula encontrada.
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
              href={filterHref({ page: String(page - 1) })}
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
              href={filterHref({ page: String(page + 1) })}
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
