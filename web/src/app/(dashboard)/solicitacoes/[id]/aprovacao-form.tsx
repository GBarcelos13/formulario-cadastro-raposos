"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  aprovarSolicitacao,
  type AprovarSolicitacaoState,
} from "@/lib/actions/aprovacao";
import { AlunoSearch } from "./aluno-search";

interface Solicitacao {
  id: string;
  tipo: string;
  escola_id: string;
  ano_letivo_id: string;
  aluno_nome: string;
  aluno_data_nascimento: string;
  aluno_documento: string | null;
  responsavel_nome: string;
  responsavel_telefone: string;
  responsavel_email: string | null;
  observacoes: string | null;
  serie_pretendida: string | null;
}

const initialState: AprovarSolicitacaoState = { status: "idle" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <legend className="px-1 text-xs font-semibold tracking-wide text-accent uppercase">
      {children}
    </legend>
  );
}

export function AprovacaoForm({ solicitacao }: { solicitacao: Solicitacao }) {
  const [state, formAction, pending] = useActionState(
    aprovarSolicitacao,
    initialState,
  );
  const [alunoIdExistente, setAlunoIdExistente] = useState("");

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <form
      action={formAction}
      className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <input type="hidden" name="solicitacaoId" value={solicitacao.id} />
      <input type="hidden" name="escolaId" value={solicitacao.escola_id} />
      <input
        type="hidden"
        name="anoLetivoId"
        value={solicitacao.ano_letivo_id}
      />
      <input type="hidden" name="alunoIdExistente" value={alunoIdExistente} />

      {solicitacao.observacoes && (
        <div className="mb-5 rounded-xl border border-dashed border-border p-3 text-sm">
          <span className="font-medium">Observações do responsável: </span>
          {solicitacao.observacoes}
        </div>
      )}

      {solicitacao.tipo === "rematricula" && (
        <div className="mb-5 grid gap-2">
          <Label>Vincular a aluno já cadastrado</Label>
          <AlunoSearch
            onSelect={(aluno) => setAlunoIdExistente(aluno?.id ?? "")}
          />
        </div>
      )}

      <fieldset className="grid gap-4 rounded-xl border border-border bg-secondary/40 p-4">
        <SectionLabel>Dados do aluno</SectionLabel>

        <div className="grid gap-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input
            id="nome"
            name="nome"
            defaultValue={solicitacao.aluno_nome}
            required
          />
          {fieldError("nome") && (
            <p className="text-sm text-destructive">{fieldError("nome")}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dataNascimento">Data de nascimento</Label>
          <Input
            id="dataNascimento"
            name="dataNascimento"
            type="date"
            defaultValue={solicitacao.aluno_data_nascimento}
            required
          />
          {fieldError("dataNascimento") && (
            <p className="text-sm text-destructive">
              {fieldError("dataNascimento")}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="documento">Certidão de nascimento / CPF</Label>
          <Input
            id="documento"
            name="documento"
            defaultValue={solicitacao.aluno_documento ?? ""}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="serie">Série</Label>
            <Input
              id="serie"
              name="serie"
              defaultValue={solicitacao.serie_pretendida ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="turma">Turma</Label>
            <Input id="turma" name="turma" />
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-4 grid gap-4 rounded-xl border border-border bg-secondary/40 p-4">
        <SectionLabel>Dados do responsável</SectionLabel>

        <div className="grid gap-2">
          <Label htmlFor="responsavelNome">Nome completo</Label>
          <Input
            id="responsavelNome"
            name="responsavelNome"
            defaultValue={solicitacao.responsavel_nome}
            required
          />
          {fieldError("responsavelNome") && (
            <p className="text-sm text-destructive">
              {fieldError("responsavelNome")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="responsavelTelefone">Telefone</Label>
            <Input
              id="responsavelTelefone"
              name="responsavelTelefone"
              defaultValue={solicitacao.responsavel_telefone}
              required
            />
            {fieldError("responsavelTelefone") && (
              <p className="text-sm text-destructive">
                {fieldError("responsavelTelefone")}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="responsavelEmail">E-mail</Label>
            <Input
              id="responsavelEmail"
              name="responsavelEmail"
              type="email"
              defaultValue={solicitacao.responsavel_email ?? ""}
            />
          </div>
        </div>
      </fieldset>

      {state.status === "error" && state.message && (
        <p className="mt-4 text-sm text-destructive">{state.message}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="mt-6 w-full"
      >
        {pending ? "Confirmando..." : "Aprovar e criar matrícula"}
      </Button>
    </form>
  );
}
