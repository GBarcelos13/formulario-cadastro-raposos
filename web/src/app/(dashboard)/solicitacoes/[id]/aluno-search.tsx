"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AlunoEncontrado = { id: string; nome: string; data_nascimento: string };

export function AlunoSearch({
  onSelect,
}: {
  onSelect: (aluno: AlunoEncontrado | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [buscaResultados, setBuscaResultados] = useState<AlunoEncontrado[]>(
    [],
  );
  const [selecionado, setSelecionado] = useState<AlunoEncontrado | null>(null);

  const buscaAtiva = !selecionado && query.trim().length >= 3;
  const resultados = buscaAtiva ? buscaResultados : [];

  useEffect(() => {
    if (!buscaAtiva) return;

    const supabase = createClient();
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("alunos")
        .select("id, nome, data_nascimento")
        .ilike("nome", `%${query.trim()}%`)
        .limit(10);
      setBuscaResultados(data ?? []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, buscaAtiva]);

  if (selecionado) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
        <span>
          Vinculado a <strong>{selecionado.nome}</strong> (já cadastrado)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelecionado(null);
            setQuery("");
            onSelect(null);
          }}
        >
          Desvincular
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Input
        placeholder="Buscar aluno já cadastrado pelo nome (opcional)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {resultados.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-border text-sm">
          {resultados.map((aluno) => (
            <li key={aluno.id} className="border-b border-border last:border-0">
              <button
                type="button"
                className="w-full px-3 py-2 text-left transition-colors hover:bg-secondary"
                onClick={() => {
                  setSelecionado(aluno);
                  onSelect(aluno);
                }}
              >
                {aluno.nome} — nascido em{" "}
                {new Date(aluno.data_nascimento).toLocaleDateString("pt-BR")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Não encontrou? Deixe em branco para criar um cadastro novo.
      </p>
    </div>
  );
}
