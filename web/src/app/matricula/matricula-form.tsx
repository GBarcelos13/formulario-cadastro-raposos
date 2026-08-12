"use client";

import { useActionState } from "react";
import Script from "next/script";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectNative } from "@/components/ui/select-native";
import {
  enviarSolicitacao,
  type EnviarSolicitacaoState,
} from "@/lib/actions/solicitacoes";
import { SERIES_DISPONIVEIS } from "@/lib/schemas/solicitacao";

type Escola = { id: string; nome: string };
type AnoLetivo = { id: string; ano: number };

const initialState: EnviarSolicitacaoState = { status: "idle" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <legend className="px-1 text-xs font-semibold tracking-wide text-accent uppercase">
      {children}
    </legend>
  );
}

export function MatriculaForm({
  escolas,
  anosLetivos,
}: {
  escolas: Escola[];
  anosLetivos: AnoLetivo[];
}) {
  const [state, formAction, pending] = useActionState(
    enviarSolicitacao,
    initialState,
  );

  const fieldError = (name: string) => state.fieldErrors?.[name];

  if (state.status === "success") {
    return (
      <div className="animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-card p-8 text-center shadow-lg duration-500">
        <CheckCircle2
          className="mx-auto size-12 text-accent"
          strokeWidth={1.5}
        />
        <h2 className="mt-4 font-display text-xl font-semibold">
          Solicitação enviada!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="relative animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-border bg-card p-6 shadow-lg duration-700 sm:p-8"
    >
      {/* Honeypot — invisível para pessoas, visível para bots simples. */}
      <div className="absolute left-[-9999px] top-auto" aria-hidden="true">
        <label htmlFor="website">Não preencha este campo</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <Label htmlFor="tipo">Tipo de solicitação</Label>
          <SelectNative id="tipo" name="tipo" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            <option value="nova">Matrícula nova</option>
            <option value="rematricula">Rematrícula</option>
          </SelectNative>
          {fieldError("tipo") && (
            <p className="text-sm text-destructive">{fieldError("tipo")}</p>
          )}
        </div>

        <div className="col-span-2 grid gap-2 sm:col-span-1">
          <Label htmlFor="anoLetivoId">Ano letivo</Label>
          <SelectNative
            id="anoLetivoId"
            name="anoLetivoId"
            required
            defaultValue={anosLetivos[0]?.id ?? ""}
          >
            <option value="" disabled>
              Selecione
            </option>
            {anosLetivos.map((ano) => (
              <option key={ano.id} value={ano.id}>
                {ano.ano}
              </option>
            ))}
          </SelectNative>
          {fieldError("anoLetivoId") && (
            <p className="text-sm text-destructive">
              {fieldError("anoLetivoId")}
            </p>
          )}
        </div>

        <div className="col-span-2 grid gap-2">
          <Label htmlFor="escolaId">Escola</Label>
          <SelectNative id="escolaId" name="escolaId" required defaultValue="">
            <option value="" disabled>
              Selecione a escola
            </option>
            {escolas.map((escola) => (
              <option key={escola.id} value={escola.id}>
                {escola.nome}
              </option>
            ))}
          </SelectNative>
          {fieldError("escolaId") && (
            <p className="text-sm text-destructive">
              {fieldError("escolaId")}
            </p>
          )}
        </div>
      </div>

      <fieldset
        className="animate-in fade-in slide-in-from-bottom-2 mt-6 grid gap-4 rounded-xl border border-border bg-secondary/40 p-4 duration-700"
        style={{ animationDelay: "80ms", animationFillMode: "backwards" }}
      >
        <SectionLabel>Dados do aluno</SectionLabel>

        <div className="grid gap-2">
          <Label htmlFor="alunoNome">Nome completo</Label>
          <Input id="alunoNome" name="alunoNome" required />
          {fieldError("alunoNome") && (
            <p className="text-sm text-destructive">
              {fieldError("alunoNome")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="alunoDataNascimento">Nascimento</Label>
            <Input
              id="alunoDataNascimento"
              name="alunoDataNascimento"
              type="date"
              required
            />
            {fieldError("alunoDataNascimento") && (
              <p className="text-sm text-destructive">
                {fieldError("alunoDataNascimento")}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seriePretendida">Série pretendida</Label>
            <SelectNative
              id="seriePretendida"
              name="seriePretendida"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Selecione
              </option>
              {Object.entries(SERIES_DISPONIVEIS).map(([grupo, series]) => (
                <optgroup key={grupo} label={grupo}>
                  {series.map((serie) => (
                    <option key={serie} value={serie}>
                      {serie}
                    </option>
                  ))}
                </optgroup>
              ))}
            </SelectNative>
            {fieldError("seriePretendida") && (
              <p className="text-sm text-destructive">
                {fieldError("seriePretendida")}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="alunoDocumento">
            Certidão de nascimento ou CPF (opcional)
          </Label>
          <Input id="alunoDocumento" name="alunoDocumento" />
        </div>
      </fieldset>

      <fieldset
        className="animate-in fade-in slide-in-from-bottom-2 mt-4 grid gap-4 rounded-xl border border-border bg-secondary/40 p-4 duration-700"
        style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
      >
        <SectionLabel>Dados do responsável</SectionLabel>

        <div className="grid gap-2">
          <Label htmlFor="responsavelNome">Nome completo</Label>
          <Input id="responsavelNome" name="responsavelNome" required />
          {fieldError("responsavelNome") && (
            <p className="text-sm text-destructive">
              {fieldError("responsavelNome")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="responsavelTelefone">Telefone (DDD)</Label>
            <Input
              id="responsavelTelefone"
              name="responsavelTelefone"
              type="tel"
              placeholder="(31) 90000-0000"
              required
            />
            {fieldError("responsavelTelefone") && (
              <p className="text-sm text-destructive">
                {fieldError("responsavelTelefone")}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="responsavelEmail">E-mail (opcional)</Label>
            <Input
              id="responsavelEmail"
              name="responsavelEmail"
              type="email"
            />
            {fieldError("responsavelEmail") && (
              <p className="text-sm text-destructive">
                {fieldError("responsavelEmail")}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <div className="mt-4 grid gap-2">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea id="observacoes" name="observacoes" rows={3} />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-border p-3">
        <Checkbox
          id="consentimentoLgpd"
          name="consentimentoLgpd"
          required
          className="mt-0.5"
        />
        <Label
          htmlFor="consentimentoLgpd"
          className="text-sm font-normal text-muted-foreground"
        >
          Autorizo o uso dos dados informados neste formulário pela Prefeitura
          Municipal de Raposos exclusivamente para fins de matrícula escolar,
          conforme a Lei Geral de Proteção de Dados (LGPD).
        </Label>
      </div>
      {fieldError("consentimentoLgpd") && (
        <p className="mt-2 text-sm text-destructive">
          {fieldError("consentimentoLgpd")}
        </p>
      )}

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile mt-4"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />

      {state.status === "error" && state.message && (
        <p className="mt-4 text-sm text-destructive">{state.message}</p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-6 w-full">
        {pending ? "Enviando..." : "Enviar solicitação"}
      </Button>
    </form>
  );
}
