import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { MatriculaForm } from "./matricula-form";

export default async function MatriculaPage() {
  const supabase = await createClient();

  const [{ data: escolas }, { data: anosLetivos }] = await Promise.all([
    supabase.from("escolas").select("id, nome").order("nome"),
    supabase
      .from("anos_letivos")
      .select("id, ano")
      .eq("status", "ativo")
      .order("ano", { ascending: false }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <header className="relative overflow-hidden bg-primary text-primary-foreground">
        {/* Cordilheira decorativa — eco do brasão do município, sem reusá-lo literalmente. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-background"
        >
          <path
            fill="currentColor"
            fillOpacity="0.12"
            d="M0 160 L120 90 L230 150 L340 60 L470 140 L600 40 L740 130 L860 70 L1000 150 L1120 90 L1200 140 L1200 200 L0 200 Z"
          />
          <path
            fill="currentColor"
            fillOpacity="0.22"
            d="M0 190 L150 130 L280 175 L420 110 L560 180 L700 100 L840 170 L980 120 L1200 185 L1200 200 L0 200 Z"
          />
        </svg>

        <div className="relative mx-auto max-w-xl px-6 pt-10 pb-20 animate-in fade-in slide-in-from-top-2 duration-700">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-prefeitura.jpg"
              alt="Prefeitura de Raposos"
              width={44}
              height={44}
              className="rounded-full ring-2 ring-primary-foreground/40"
              priority
            />
            <div className="text-sm/tight font-medium tracking-wide text-primary-foreground/80 uppercase">
              Prefeitura de Raposos
              <br />
              Secretaria de Educação
            </div>
          </div>

          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Matrícula e rematrícula escolar
          </h1>
          <p className="mt-3 max-w-md text-primary-foreground/85">
            Preencha os dados do seu filho ou filha para solicitar a matrícula
            ou rematrícula na rede municipal de ensino. A secretaria vai
            analisar e entrar em contato se precisar de algo.
          </p>
        </div>
      </header>

      <div className="mx-auto -mt-10 max-w-xl px-6 pb-16">
        <MatriculaForm escolas={escolas ?? []} anosLetivos={anosLetivos ?? []} />
      </div>
    </main>
  );
}
