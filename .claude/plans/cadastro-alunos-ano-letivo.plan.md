# Plan: Cadastro de Alunos por Ano Letivo

**Source PRD**: `.claude/prds/cadastro-alunos-ano-letivo.prd.md`
**Selected Milestone**: 1 — Cadastro básico por ano letivo
**Complexity**: Medium

## Summary
Primeiro projeto técnico do zero: nenhum código existe ainda, só a especificação funcional (`plataforma_gestao_escolar_fluxos.md`) e o PRD. O sistema tem duas pontas: (1) um **formulário público, sem login**, para os pais enviarem dados de matrícula/rematrícula do aluno; (2) uma **fila de aprovação** para a Secretaria de Educação de Raposos-MG revisar cada solicitação — ao aprovar, os dados são copiados automaticamente para o cadastro oficial do aluno por ano letivo (6 escolas), sem redigitação; a secretaria confirma/edita antes de confirmar, mantendo aprovação humana obrigatória. Toda solicitação aprovada vira um registro persistido, consultável em relatórios. A arquitetura é dimensionada para tráfego público em rajada (pico de envios perto do prazo de matrícula), com baixa latência e proteção contra abuso, sem over-engineering para uma escala que não existe.

## Calibração de escala (antes do design)
Diferente da primeira versão deste plano, "aguentar inúmeros acessos simultâneos" agora é real, não hipotético: **os pais são quem envia o formulário**, então o tráfego de pico é proporcional ao número de famílias das 6 escolas tentando enviar perto do prazo — um padrão clássico de rajada (igual inscrição de vestibular/concurso). O lado da secretaria continua sendo dezenas de usuários concorrentes; o lado público é a parte que precisa de desenho para pico.

Duas implicações diretas de design:
1. **Caminho de escrita do formulário público precisa ser simples e sem contenção** — inserção isolada numa tabela própria (`solicitacoes_matricula`), sem locks compartilhados, sem depender de contagem/sequência sensível a concorrência.
2. **Superfície pública exige proteção que a área interna não precisa**: rate limiting, CAPTCHA leve, validação estrita de entrada (dado não confiável, é fronteira do sistema) e aviso de privacidade/consentimento (LGPD, dado de criança/adolescente).

## Arquitetura proposta
Não há stack definida ainda — decisão tomada nesta fase, alinhada às skills/regras já configuradas no seu ambiente (shadcn-ui, Tailwind, Supabase, Next.js/Vercel best practices):

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Server Components reduzem JS no cliente → carregamento rápido tanto no formulário público quanto no dashboard; deploy gerenciado (Vercel) escala automaticamente sem operação manual, absorvendo o pico de matrícula sem provisionamento prévio |
| Dados | Postgres via Supabase | Transacional, força integridade referencial (aluno↔matrícula↔escola↔ano letivo); Row Level Security separa o que é público (inserir solicitação) do que é restrito (ler/editar cadastro oficial); connection pooling nativo (PgBouncer) evita esgotamento de conexões sob rajada |
| Auth | Supabase Auth | Login restrito à equipe da secretaria; formulário do pai é público e não autenticado por decisão de escopo (ver PRD) |
| Anti-abuso | Rate limiting por IP (edge middleware) + CAPTCHA leve (Cloudflare Turnstile) + honeypot | Formulário público sem login é alvo natural de spam/bots/reenvio acidental, especialmente perto do prazo |
| Cache/perf | React Query (client, área da secretaria) + índices de banco dedicados + paginação nas listagens | Evita recarregar tudo a cada ação; consultas mais usadas (fila de solicitações, listagem de alunos) ficam por índice, não full scan |
| Hospedagem | Vercel (frontend) + Supabase Cloud (banco) | Ambas gerenciadas e elásticas — absorvem o pico de envios sem dimensionamento manual prévio |

## Modelo de dados (núcleo da robustez)
- `escolas` (id, nome, ...)
- `anos_letivos` (id, ano, status: ativo/encerrado)
- `solicitacoes_matricula` (id, tipo: nova/rematrícula, escola_id FK, ano_letivo_id FK, dados do aluno, dados do responsável, consentimento_lgpd boolean + timestamp, status: pendente/processada, ip_origem, created_at) — **tabela de escrita pública**, isolada do cadastro oficial; todo envio do pai cai aqui primeiro
- `alunos` (id, nome, data_nascimento, documento, dados de responsável, created_at, updated_at) — cadastro oficial, escrito só pela secretaria
- `matriculas` (id, aluno_id FK, escola_id FK, ano_letivo_id FK, turma, série, status, data_matricula, solicitacao_origem_id FK opcional) — vínculo aluno↔escola↔ano; `solicitacao_origem_id` rastreia de qual solicitação essa matrícula foi redigitada, sem promovê-la automaticamente
- `audit_log` (usuário, timestamp, ação, registro afetado) — atende ao princípio de rastreabilidade já definido na especificação funcional
- Índices: `solicitacoes_matricula(status, created_at)` (fila da secretaria), `matriculas(ano_letivo_id, escola_id)`, `alunos(nome)` (busca), constraint única `(aluno_id, ano_letivo_id)` para impedir matrícula duplicada no mesmo ano

## Pattern Grounding
| Category | Source | Pattern |
|---|---|---|
| Naming | — | Nenhum código existe no projeto ainda — este plano estabelece as convenções iniciais (ver Tasks) |
| Errors | — | Nenhum padrão prévio — validação estrita no formulário público (é fronteira com dado não confiável), erro amigável na UI, log detalhado no server, conforme regras globais do usuário |
| Tests | — | Nenhum padrão prévio — testes unitários + integração desde o primeiro CRUD, incluindo o caminho público |

## Files to Change
| File | Action | Why |
|---|---|---|
| `package.json`, `next.config.ts`, `tsconfig.json` | CREATE | Bootstrap do projeto Next.js + TypeScript |
| `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` | CREATE | Clientes Supabase (browser e server) |
| `supabase/migrations/*.sql` | CREATE | Schema: escolas, anos_letivos, solicitacoes_matricula, alunos, matriculas, audit_log + RLS policies |
| `src/proxy.ts` | CREATE | Rate limiting por IP na rota pública do formulário (Next.js 16 renomeou Middleware para Proxy — mesma função, novo nome de arquivo/export) |
| `src/app/matricula/page.tsx` | CREATE | Formulário público (sem login) de matrícula/rematrícula, com CAPTCHA e consentimento LGPD |
| `src/lib/schemas/solicitacao.ts` | CREATE | Validação (zod) do formulário público — mesma definição usada no client e no server |
| `src/lib/actions/solicitacoes.ts` | CREATE | Server Action pública para inserir solicitação (sem autenticação, com rate limit + captcha check) |
| `src/app/(auth)/login/page.tsx` | CREATE | Login restrito à equipe da secretaria |
| `src/app/(dashboard)/solicitacoes/page.tsx` | CREATE | Fila de solicitações recebidas, pendente → processada |
| `src/app/(dashboard)/alunos/page.tsx` | CREATE | Listagem paginada de alunos por ano letivo/escola (cadastro oficial) |
| `src/app/(dashboard)/alunos/[id]/page.tsx` | CREATE | Consulta/edição de aluno |
| `src/app/(dashboard)/alunos/novo/page.tsx` | CREATE | Formulário de novo cadastro oficial, pré-preenchível a partir de uma solicitação |
| `src/lib/schemas/aluno.ts` | CREATE | Validação (zod) dos dados do aluno — cadastro oficial |
| `src/lib/actions/alunos.ts` | CREATE | Server Actions para criar/editar/consultar aluno (grava em `audit_log`) |
| `tests/solicitacoes.test.ts`, `tests/alunos.test.ts` | CREATE | Testes de CRUD, RLS e do caminho público |

## Tasks

### Task 1: Bootstrap do projeto
- **Action**: Criar projeto Next.js (App Router, TS), configurar Tailwind + shadcn/ui, conectar projeto Supabase
- **Mirror**: N/A — primeiro código do projeto
- **Validate**: `npm run dev` sobe sem erro; `npx tsc --noEmit` limpo

### Task 2: Schema do banco + RLS
- **Action**: Migrations para `escolas`, `anos_letivos`, `solicitacoes_matricula`, `alunos`, `matriculas`, `audit_log`; policies permitindo INSERT público (anônimo) só em `solicitacoes_matricula`, e restringindo todo o resto a usuários autenticados da secretaria
- **Mirror**: Convenção Supabase padrão de migrations versionadas
- **Validate**: `supabase db push` aplica sem erro; teste confirma que anônimo consegue inserir solicitação mas não ler/editar `alunos` ou `matriculas`

### Task 3: Formulário público de matrícula/rematrícula
- **Action**: Página pública `/matricula` com formulário (dados do aluno + responsável + escola + tipo nova/rematrícula), CAPTCHA (Turnstile), checkbox de consentimento LGPD com aviso de privacidade, rate limiting por IP no middleware
- **Mirror**: N/A — primeira superfície pública do projeto
- **Validate**: Envio válido cria registro em `solicitacoes_matricula`; envio sem consentimento é bloqueado; rajada simulada (ex: 100 envios/min de IPs variados) não derruba a rota nem estoura conexões do banco

### Task 4: Autenticação e fila da secretaria
- **Action**: Login via Supabase Auth (e-mail/senha), proteção de rotas do dashboard, tela de fila (`/solicitacoes`) listando pendentes por escola/ano letivo, com ação "Aprovar" por solicitação (implementada na Task 5)
- **Mirror**: Padrão de middleware do Next.js para proteger rotas server-side
- **Validate**: Acesso a `/solicitacoes` ou `/alunos` sem sessão redireciona para `/login`; fila mostra solicitações mais recentes primeiro, paginada

### Task 5: Aprovação — solicitação vira cadastro oficial
- **Action**: Ação "Aprovar" na fila copia automaticamente os dados da `solicitacao_matricula` para `alunos`/`matriculas` (secretaria confirma/edita os campos copiados antes de confirmar — não redigita do zero); validação (zod) compartilhada com o formulário público; listagem paginada de alunos filtrável por escola e ano letivo; ao confirmar, marca a solicitação como "processada", grava `solicitacao_origem_id` e registra em `audit_log`
- **Mirror**: Server Actions do Next.js para mutações, evitando API routes redundantes
- **Validate**: Fluxo completo solicitação → aprovação → cadastro oficial funciona de ponta a ponta sem exigir redigitação de campos já enviados; constraint única impede duplicar matrícula no mesmo ano

### Task 6: Performance e resiliência sob carga
- **Action**: Paginação server-side + índices nas colunas de filtro (`ano_letivo_id`, `escola_id`, `nome`, `status` em solicitações); teste de carga simulando pico de envios do formulário público
- **Mirror**: N/A — primeira listagem/teste de carga do projeto
- **Validate**: `EXPLAIN ANALYZE` nas queries principais usa índice, não sequential scan; teste de carga no formulário público mantém latência aceitável (p95 < 1s) sob simulação de pico

### Task 7: Testes automatizados
- **Action**: Testes unitários da validação (zod, ambos os formulários) + testes de integração do caminho público, do CRUD interno e das RLS policies
- **Mirror**: N/A — primeira suíte de testes do projeto
- **Validate**: `npm run test` verde; cobertura ≥ 80% nos módulos de solicitações e alunos (regra global do usuário)

## Validation
```bash
npm run lint
npx tsc --noEmit
npm run test -- --coverage
npm run build
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Stack escolhida agora sem validação prévia do usuário | Média | Confirmar a stack (Next.js + Supabase) antes de iniciar Task 1 — é uma decisão reversível, mas cara de trocar depois |
| Campos exatos do formulário (pai e secretaria) ainda não levantados (Open Question do PRD) | Alta | Levantar com o secretário antes/durante a Task 2, para não remodelar o schema depois de populado |
| Promessa de contratação ainda informal (Risk já registrado no PRD) | Alta | Não investir nas Tasks 6–7 (perf/testes aprofundados) até haver confirmação formal, se o prazo apertar |
| RLS mal configurada pode expor `alunos`/`matriculas` ao público, ou bloquear o INSERT anônimo em `solicitacoes_matricula` | Baixa/Impacto alto | Task 2 inclui teste explícito de cada policy antes de liberar Tasks 3 e 5 |
| Formulário público sem login é alvo de spam/bots/envios duplicados perto do prazo | Média | Rate limiting por IP + CAPTCHA leve + honeypot (Task 3) |
| Pico de envios concentrado nos últimos dias do prazo derruba a rota pública | Alta | Arquitetura serverless com autoscaling + teste de carga antes do prazo real (Task 6) |
| Coleta de dados de criança/adolescente via formulário público levanta exigência de LGPD (consentimento, base legal, aviso de privacidade) | Alta | Checkbox de consentimento + aviso de privacidade obrigatórios no formulário (Task 3); validar redação com a secretaria/jurídico antes do lançamento |

## Acceptance
- [ ] Todas as Tasks completas
- [ ] Validation (lint, typecheck, test, build) passa
- [ ] Queries principais usam índice (não sequential scan) sob carga de teste
- [ ] RLS testada: anônimo só insere em `solicitacoes_matricula`; usuário da secretaria acessa fila e cadastro das 6 escolas
- [ ] Formulário público resiste a teste de carga simulando pico de matrícula sem degradar latência
