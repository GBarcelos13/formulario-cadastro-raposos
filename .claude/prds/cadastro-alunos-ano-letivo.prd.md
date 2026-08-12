# Cadastro de Alunos por Ano Letivo — Secretaria de Educação de Raposos-MG

## Problem
A Secretaria Municipal de Educação de Raposos-MG centraliza o cadastro de alunos das 6 escolas municipais de forma totalmente manual (papel), sem controle centralizado. Hoje os pais entregam os dados de matrícula/rematrícula por papel, e a secretaria redigita tudo manualmente — processo lento e difícil de gerir. Não existe um sistema efetivamente em uso para essa finalidade — apesar de a prefeitura manter um contrato ativo com outro fornecedor (Edutec) que nominalmente cobre matrícula/rematrícula. Sem uma solução, a secretaria entra no próximo ano letivo sem visibilidade real sobre os cadastros das 6 escolas, e enfrenta um pico de recebimento de formulários concentrado no período de matrícula.

## Evidence
- Relato direto do Secretário de Educação de Raposos-MG: a demanda partiu dele, informando que o sistema atualmente contratado (Edutec) não atende mais e não está sendo utilizado pelas escolas.
- Cadastro é feito em papel há anos, sem controle — relatado pelo secretário.
- Achado complementar (via portal de transparência): existe contrato ativo com a Edutec (nº 64, ~R$800k/ano) cujo escopo formal inclui matrícula/rematrícula para as 6 escolas — confirma que o sistema pago existe no papel, mas está em desuso na prática, consistente com o relato do secretário.

## Users
- **Primary**: Secretaria Municipal de Educação de Raposos-MG — equipe administrativa que recebe e efetiva o cadastro de alunos das 6 escolas municipais.
- **Secondary**: Pais/responsáveis — enviam o formulário de matrícula/rematrícula publicamente, sem login. Não têm portal, dashboard ou acompanhamento de status nesta fase; o envio é a única interação.
- **Not for**: escolas estaduais (fora da jurisdição da prefeitura), professores/diário de classe.

## Hypothesis
We believe **um formulário público de matrícula/rematrícula para os pais, somado a um cadastro simples de alunos por ano letivo para a secretaria** will **eliminar o papel em ambas as pontas e dar controle centralizado sobre os cadastros das 6 escolas municipais** for **a Secretaria de Educação de Raposos-MG**.
We'll know we're right when **pelo menos 80% dos cadastros de alunos do ano letivo forem feitos a partir de formulários recebidos pelo sistema**.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| % de cadastros de alunos feitos pelo sistema | ≥ 80% | Total de alunos cadastrados no sistema ÷ total de matrículas efetivas nas 6 escolas no ano letivo |

## Scope
**MVP** — Duas pontas:
1. **Formulário público** (sem login) para pais enviarem dados de matrícula ou rematrícula do aluno, para qualquer uma das 6 escolas.
2. **Fila + aprovação da secretaria**: a secretaria revisa cada solicitação recebida; ao aprovar, os dados são copiados automaticamente para o cadastro oficial do aluno (vinculado ao ano letivo), sem redigitação do zero — a secretaria confirma/edita antes de confirmar. A secretaria continua sendo o gatekeeper (aprovação humana obrigatória), mas toda solicitação aprovada vira um registro de aluno persistido, disponível para consultas e relatórios futuros.

**Out of scope**
- Login/conta e portal completo dos pais (acompanhamento de status, histórico, dashboard) — adiado; nesta fase o pai só envia o formulário, sem acompanhar depois.
- Promoção totalmente automática sem revisão da secretaria — a aprovação humana continua obrigatória antes de qualquer solicitação virar registro oficial; o que é automático é a cópia dos dados, não a decisão de aprovar.
- Bilhetes e comunicação com famílias — adiado.
- Solicitação de documentos (histórico, declarações) — adiado.
- Solicitação de agenda/reuniões/eventos — adiado.
- Módulo financeiro — adiado.
- Relatórios avançados/dashboards — adiado; MVP cobre só o cadastro em si.

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Cadastro básico por ano letivo | Secretaria consegue cadastrar, editar e consultar alunos das 6 escolas pelo sistema | complete | `.claude/plans/cadastro-alunos-ano-letivo.plan.md` |
| 2 | Carga inicial de dados | Base de alunos já matriculados é importada, sem perda de histórico | pending | — |
| 3 | Adoção nas 6 escolas | As 6 escolas usam o sistema como fonte oficial no ciclo de matrícula/rematrícula em curso | pending | — |

## Open Questions
- [x] Como os pais acessam o formulário? → Formulário público, sem login.
- [x] O que a secretaria faz com o que recebe? → Redigita manualmente no cadastro oficial (formulário do pai é solicitação, não vira registro automaticamente).
- [x] Cobre matrícula nova, rematrícula, ou as duas? → As duas.
- [x] Solicitação vira registro oficial automaticamente ou a secretaria redigita do zero? → Vira registro automaticamente ao ser aprovada pela secretaria (dados copiados, sem redigitação); aprovação humana continua obrigatória.
- [ ] Qual o volume real de alunos/matrículas nas 6 escolas? (necessário para dimensionar pico de envio do formulário)
- [ ] O prazo citado ("início de agosto") já passou considerando a data atual (11/08/2026) — qual é o marco real: início do período de rematrícula, início do próximo ano letivo, ou outro?
- [ ] A promessa de contratação é apenas informal até o momento — qual o processo formal esperado (dispensa por valor, nova licitação, substituição do contrato vigente com a Edutec)?
- [ ] Quais campos/dados mínimos a secretaria exige no cadastro do aluno? (ainda não levantado — vale definir o mesmo formulário para pai e para o cadastro oficial da secretaria)
- [ ] Existe intenção de substituir formalmente o contrato com a Edutec, ou o sistema rodaria em paralelo por enquanto?
- [ ] Como o pai identifica/localiza uma solicitação já enviada (ex: em caso de erro), já que não há login nem acompanhamento de status nesta fase?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Promessa de contratação é informal, sem processo ou orçamento formal ainda | Alta | Alto — projeto pode não avançar após a entrega | Formalizar escopo/aprovação por escrito com o secretário antes de investir em desenvolvimento pesado |
| Contrato vigente com a Edutec (inexigibilidade + adesão a ata de registro de preços) pode gerar resistência administrativa a um sistema paralelo | Média | Média | Validar com a secretaria a intenção real: substituição ou uso paralelo |
| Prazo apertado (ano letivo se aproximando) sem volume de alunos conhecido | Média | Média | Levantar volume real com a secretaria o quanto antes |
| Mudança de hábito (papel → sistema) nas 6 escolas pode não atingir a meta de 80% | Média | Alto — falha direta na métrica de sucesso | Planejar treinamento/onboarding das escolas como parte da entrega, não só o software |
| Formulário público sem login é alvo de spam/bots/envios duplicados, especialmente perto do prazo | Média | Média — polui a fila da secretaria | Rate limiting por IP + CAPTCHA leve (ex: Cloudflare Turnstile) + honeypot |
| Pico de envios concentrado nos últimos dias do prazo de matrícula/rematrícula | Alta | Alto — indisponibilidade no momento mais crítico | Arquitetura serverless com autoscaling (ver plano técnico) + carga de teste antes do prazo real |
| Coleta de dados de criança/adolescente via formulário público sem login levanta exigência de LGPD (consentimento do responsável, base legal, aviso de privacidade) | Alta | Alto — risco jurídico para a prefeitura | Incluir consentimento explícito e aviso de privacidade no formulário; validar redação com a secretaria/jurídico antes do lançamento |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
