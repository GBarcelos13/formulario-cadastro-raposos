import Link from "next/link";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { AprovacaoForm } from "./aprovacao-form";

export default async function SolicitacaoDetalhePage(
  props: PageProps<"/solicitacoes/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: solicitacao } = await supabase
    .from("solicitacoes_matricula")
    .select("*, escolas(nome), anos_letivos(ano)")
    .eq("id", id)
    .maybeSingle();

  if (!solicitacao) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/solicitacoes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Fila de solicitações
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {solicitacao.aluno_nome}
        </h1>
        <Badge variant={solicitacao.tipo === "nova" ? "default" : "secondary"}>
          {solicitacao.tipo === "nova" ? "Matrícula nova" : "Rematrícula"}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {solicitacao.escolas?.nome} · Ano letivo{" "}
        {solicitacao.anos_letivos?.ano}
        {solicitacao.serie_pretendida &&
          ` · ${solicitacao.serie_pretendida}`}
      </p>

      {solicitacao.status === "processada" ? (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
          <CircleCheck className="size-5 shrink-0 text-accent" />
          Esta solicitação já foi processada.
        </div>
      ) : (
        <AprovacaoForm solicitacao={solicitacao} />
      )}
    </div>
  );
}
