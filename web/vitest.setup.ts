// Carrega .env.local para os testes de integração, que rodam contra o
// projeto Supabase real (ver tests/integration/*). Testes unitários não
// precisam disso, mas carregar aqui é inofensivo para eles.
import { existsSync } from "node:fs";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
