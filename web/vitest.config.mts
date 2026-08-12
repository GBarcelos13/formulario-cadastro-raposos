import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Só os schemas (lógica pura) entram na cobertura medida por teste
      // unitário. As Server Actions em src/lib/actions/** dependem de
      // next/headers em escopo de request e são validadas via os testes de
      // integração (tests/integration/**) contra o Supabase real, não por
      // cobertura de teste unitário — mockar o runtime do Next.js só para
      // contar linhas não agregaria confiança real aqui.
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
