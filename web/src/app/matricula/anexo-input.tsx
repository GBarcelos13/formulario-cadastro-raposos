"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  ANEXO_MIME_TYPES_PERMITIDOS,
  ANEXO_TAMANHO_MAXIMO_MB,
} from "@/lib/schemas/solicitacao";

type Status = "idle" | "uploading" | "done" | "error";

interface AnexoMetadata {
  caminho: string;
  nomeArquivo: string;
  tamanhoBytes: number;
}

// Envia o arquivo direto pro Supabase Storage a partir do navegador — a
// Server Action do formulário nunca vê os bytes, só o hidden input com esse
// metadata em JSON. Evita o limite de tamanho/tempo de execução de Server
// Actions na Vercel (ver src/lib/actions/solicitacoes.ts).
export function AnexoInput({
  name,
  tipoStorage,
  label,
  accept,
  solicitacaoId,
  serverError,
  onUploadingChange,
}: {
  name: string;
  tipoStorage: string;
  label: string;
  accept: string;
  solicitacaoId: string;
  serverError?: string;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AnexoMetadata | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setStatus("idle");
      setMetadata(null);
      setErro(null);
      return;
    }

    if (file.size > ANEXO_TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setStatus("error");
      setErro(`Arquivo muito grande (máximo ${ANEXO_TAMANHO_MAXIMO_MB}MB).`);
      return;
    }
    if (!ANEXO_MIME_TYPES_PERMITIDOS.includes(file.type as never)) {
      setStatus("error");
      setErro("Formato não aceito. Envie PDF, JPG, PNG ou WEBP.");
      return;
    }

    setStatus("uploading");
    setErro(null);
    onUploadingChange(true);

    const nomeSanitizado = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const caminho = `${solicitacaoId}/${tipoStorage}-${Date.now()}-${nomeSanitizado}`;

    const supabase = createClient();
    const { error } = await supabase.storage
      .from("documentos-matricula")
      .upload(caminho, file, { contentType: file.type });

    onUploadingChange(false);

    if (error) {
      setStatus("error");
      setErro("Falha ao enviar. Tente novamente.");
      return;
    }

    setStatus("done");
    setMetadata({
      caminho,
      nomeArquivo: file.name,
      tamanhoBytes: file.size,
    });
  }

  function limpar() {
    setStatus("idle");
    setMetadata(null);
    setErro(null);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <input
        type="hidden"
        name={name}
        value={metadata ? JSON.stringify(metadata) : ""}
      />

      {status === "done" && metadata ? (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
          <span className="truncate">{metadata.nomeArquivo}</span>
          <button
            type="button"
            onClick={limpar}
            aria-label={`Remover ${label}`}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id={name}
            type="file"
            accept={accept}
            disabled={status === "uploading"}
            onChange={handleChange}
          />
          {status === "uploading" && (
            <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {(erro || serverError) && (
        <p className="text-sm text-destructive">{erro ?? serverError}</p>
      )}
    </div>
  );
}
