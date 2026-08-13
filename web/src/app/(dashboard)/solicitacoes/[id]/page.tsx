import Link from "next/link";
import { ArrowLeft, CircleCheck, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { AprovacaoForm } from "./aprovacao-form";

const ANEXO_TIPO_LABEL: Record<string, string> = {
  certidao_nascimento: "Certidão de nascimento",
  foto: "Foto do aluno",
  comprovante_residencia: "Comprovante de residência",
  outro: "Outro documento",
};

const URL_ASSINADA_VALIDADE_SEGUNDOS = 60 * 10; // 10 minutos

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

  const { data: anexos } = await supabase
    .from("solicitacao_anexos")
    .select("id, tipo, nome_arquivo, caminho_storage")
    .eq("solicitacao_id", id);

  const anexosComUrl = await Promise.all(
    (anexos ?? []).map(async (anexo) => {
      const { data } = await supabase.storage
        .from("documentos-matricula")
        .createSignedUrl(anexo.caminho_storage, URL_ASSINADA_VALIDADE_SEGUNDOS);
      return { ...anexo, url: data?.signedUrl ?? null };
    }),
  );

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

      {anexosComUrl.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">
            Documentos enviados
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {anexosComUrl.map((anexo) => (
              <li key={anexo.id}>
                {anexo.url ? (
                  <a
                    href={anexo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    <FileText className="size-4" />
                    {ANEXO_TIPO_LABEL[anexo.tipo] ?? anexo.tipo}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    {ANEXO_TIPO_LABEL[anexo.tipo] ?? anexo.tipo} (link
                    indisponível)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
