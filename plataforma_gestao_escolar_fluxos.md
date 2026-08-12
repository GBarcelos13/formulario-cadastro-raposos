# Plataforma de Gestão Escolar

## 1. Visão Geral

Plataforma web de gestão escolar com dois ambientes principais:

- **Portal dos Pais/Responsáveis**
- **Portal da Escola/Diretoria**

O sistema deve centralizar cadastro, matrícula/rematrícula, comunicação, documentos e solicitações de agenda.

---

# 2. Arquitetura de Acesso

Cada perfil possui permissões próprias.

```text
Pais/Responsáveis
        │
        ▼
Cadastro / Login
        │
        ▼
Portal dos Pais
        │
        ├── Selecionar Filho
        ├── Dados do Aluno
        ├── Bilhetes e Comunicação
        ├── Solicitação de Documentos
        └── Solicitação de Agenda

Escola / Diretoria
        │
        ▼
Login Administrativo
        │
        ▼
Dashboard Administrativo
        │
        ├── Alunos Ativos
        ├── Matrículas
        ├── Rematrículas
        ├── Bilhetes
        ├── Comunicação
        ├── Documentos
        ├── Agendamentos
        ├── Eventos
        └── Relatórios
```

---

# 3. Fluxo Geral da Plataforma

```text
                    CADASTRO
                        │
                        ▼
         INSCRIÇÃO / REMATRÍCULA ONLINE
                        │
                        ▼
                 BANCO DE DADOS
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
PORTAL DOS PAIS                  PORTAL DA ESCOLA
        │                               │
        ▼                               ▼
Selecionar Filho                Dashboard Administrativo
        │                               │
        ├── Dados do Aluno              ├── Alunos Ativos
        ├── Bilhetes                    ├── Matrículas
        ├── Comunicação                 ├── Bilhetes
        ├── Solicitar Documentos        ├── Comunicação
        ├── Solicitar Reunião           ├── Solicitações de Documentos
        └── Solicitar Eventos           ├── Agendamentos
                                        ├── Eventos
                                        └── Relatórios
```

---

# 4. Portal dos Pais

Após realizar o login, o responsável acessa seu Dashboard.

Um único responsável poderá possuir vários filhos cadastrados.

## 4.1 Dashboard dos Pais

```text
LOGIN
   │
   ▼
Dashboard dos Pais
   │
   ├── Selecionar Filho
   │       ├── Filho 1
   │       ├── Filho 2
   │       └── Filho 3
   │
   ├── Dados do Aluno
   │
   ├── Bilhetes e Comunicação
   │
   ├── Solicitação de Documentos
   │
   └── Solicitação de Agenda
```

### Troca de Filho

O responsável poderá alternar entre todos os filhos utilizando o mesmo login.

Exemplo:

```text
Responsável: João Silva

▼ Selecionar Aluno

• Pedro Silva
• Maria Silva
• Ana Silva
```

Ao trocar o aluno, todas as informações apresentadas no portal devem ser relacionadas ao aluno selecionado.

---

# 5. Módulo: Dados do Aluno

O responsável poderá visualizar:

- Dados cadastrais
- Turma
- Série
- Professor responsável
- Horário
- Foto
- Situação da matrícula
- Informações dos responsáveis

### Permissão

O módulo será predominantemente de consulta para os pais.

A escola/diretoria poderá alterar os dados conforme suas permissões administrativas.

---

# 6. Módulo: Bilhetes e Comunicação

A comunicação é iniciada pela escola.

O pai/responsável recebe os comunicados e pode responder quando a escola exigir uma resposta.

## Funcionalidades para os Pais

- Receber comunicados
- Receber bilhetes
- Confirmar leitura
- Confirmar presença
- Responder "SIM"
- Responder "NÃO"

## Exemplo

```text
Passeio Escolar

Data: 15/08

Participará?

( ) Sim
( ) Não

☑ Confirmar Leitura
```

## Controle Administrativo

A escola poderá acompanhar:

- Quem recebeu
- Quem visualizou
- Quem confirmou leitura
- Quem respondeu SIM
- Quem respondeu NÃO
- Quem ainda não respondeu

---

# 7. Módulo: Solicitação de Documentos

O responsável poderá solicitar documentos diretamente pelo portal.

## Tipos de Documentos

Exemplos:

- Histórico Escolar
- Declaração de Matrícula
- Declaração de Frequência
- Transferência
- Outros documentos definidos pela escola

## Fluxo

```text
Pai
 │
 ▼
Solicita Documento
 │
 ▼
Escola recebe solicitação
 │
 ▼
Funcionário analisa
 │
 ▼
Produz documento
 │
 ▼
Faz upload
 │
 ▼
Pai recebe notificação
 │
 ▼
Download do documento
```

## Status

Cada solicitação poderá possuir um status:

```text
Recebido
   ↓
Em análise
   ↓
Documento anexado
   ↓
Enviado
   ↓
Finalizado
```

## Informações da Solicitação

Cada solicitação deverá registrar:

- Nome do aluno
- Responsável
- Tipo do documento
- Data da solicitação
- Prazo, quando aplicável
- Status
- Observações
- Documento anexado
- Data de conclusão

---

# 8. Módulo: Solicitação de Agenda

O responsável poderá solicitar compromissos com a escola.

O módulo deverá contemplar pelo menos:

- Reunião presencial
- Eventos
- Festa de aniversário
- Solicitações de utilização de espaço, quando aplicável

---

## 8.1 Reunião Presencial

O responsável poderá informar:

- Assunto
- Professor ou responsável desejado
- Data sugerida
- Observações

## Fluxo

```text
Pai
 │
 ▼
Solicita reunião
 │
 ▼
Escola recebe
 │
 ▼
Analisa disponibilidade
 │
 ├── Aprovar
 │
 ├── Alterar horário
 │
 ├── Reagendar
 │
 └── Cancelar
 │
 ▼
Responsável recebe atualização
```

---

# 9. Eventos / Festa de Aniversário

O responsável poderá solicitar um evento ou festa.

## Informações

- Data pretendida
- Tipo de evento
- Quantidade de convidados, quando aplicável
- Observações

## Fluxo

```text
Pai
 │
 ▼
Solicita evento
 │
 ▼
Escola recebe
 │
 ▼
Analisa solicitação
 │
 ├── Aprovar
 │
 ├── Rejeitar
 │
 ├── Solicitar alteração
 │
 └── Inserir observações
 │
 ▼
Responsável recebe notificação
```

---

# 10. Portal da Escola / Diretoria

O ambiente administrativo concentra as operações da escola.

```text
LOGIN
   │
   ▼
Dashboard Administrativo
   │
   ├── Alunos Ativos
   ├── Matrículas
   ├── Rematrículas
   ├── Bilhetes
   ├── Comunicação
   ├── Solicitação de Documentos
   ├── Solicitação de Agenda
   ├── Eventos
   ├── Relatórios
   └── Configurações
```

---

# 11. Dashboard Administrativo

O dashboard deverá apresentar indicadores importantes.

## Indicadores

```text
Alunos Ativos

Matrículas Pendentes

Rematrículas Pendentes

Bilhetes Enviados

Documentos Pendentes

Agendamentos Pendentes

Eventos Pendentes
```

Os indicadores podem funcionar como atalhos para as respectivas filas de trabalho.

---

# 12. Módulo: Alunos Ativos

A escola poderá:

- Cadastrar aluno manualmente
- Editar cadastro
- Desativar aluno
- Transferir aluno
- Alterar turma
- Alterar série

Também deverá receber automaticamente:

- Matrículas realizadas pelos pais
- Atualizações de cadastro
- Rematrículas

O objetivo é evitar redigitação desnecessária das informações.

---

# 13. Módulo: Matrículas

O processo de matrícula poderá ocorrer de forma online.

## Fluxo

```text
Responsável
     │
     ▼
Cadastro
     │
     ▼
Preenchimento dos dados do aluno
     │
     ▼
Envio da inscrição/matrícula
     │
     ▼
Escola recebe
     │
     ▼
Análise
     │
 ┌───┴───────────────┐
 ▼                   ▼
Aprovada          Pendente/Correção
 │                   │
 ▼                   ▼
Aluno cadastrado   Responsável recebe
no sistema         solicitação de ajuste
```

---

# 14. Módulo: Rematrícula

O sistema poderá disponibilizar a rematrícula online para alunos já cadastrados.

## Fluxo

```text
Aluno existente
      │
      ▼
Período de rematrícula aberto
      │
      ▼
Responsável acessa portal
      │
      ▼
Confirma / atualiza dados
      │
      ▼
Envia rematrícula
      │
      ▼
Escola recebe
      │
      ▼
Processa rematrícula
      │
      ▼
Status atualizado
```

---

# 15. Módulo: Bilhetes e Comunicação — Escola

A escola será responsável pela criação e envio das comunicações.

## A escola poderá:

- Criar comunicado
- Criar bilhete
- Enviar para toda a escola
- Enviar para uma turma
- Enviar para um aluno
- Enviar para um responsável
- Exigir confirmação de leitura
- Exigir resposta SIM/NÃO
- Acompanhar respostas

## Fluxo

```text
Escola
 │
 ▼
Cria comunicado
 │
 ▼
Seleciona público
 │
 ├── Toda a escola
 ├── Turma
 ├── Aluno
 └── Responsável
 │
 ▼
Define regras de resposta
 │
 ▼
Envia
 │
 ▼
Responsáveis recebem
 │
 ▼
Sistema registra leitura/resposta
 │
 ▼
Escola acompanha resultados
```

---

# 16. Módulo: Solicitação de Documentos — Escola

A escola terá uma fila centralizada de solicitações.

## Fluxo

```text
Pai solicita
 │
 ▼
Fila de solicitações
 │
 ▼
Funcionário analisa
 │
 ▼
Anexa documento
 │
 ▼
Envia
 │
 ▼
Pai recebe notificação
```

## Informações

- Nome do aluno
- Responsável
- Tipo do documento
- Data da solicitação
- Prazo
- Status
- Observações
- Arquivo final

---

# 17. Módulo: Solicitação de Agenda — Escola

A escola receberá todas as solicitações feitas pelos responsáveis.

## Reuniões

Informações:

- Nome do responsável
- Nome do aluno
- Assunto
- Professor/responsável solicitado
- Data sugerida
- Observações

A escola poderá:

- Aprovar
- Alterar horário
- Reagendar
- Cancelar
- Adicionar observações

## Eventos

Informações:

- Responsável
- Aluno
- Data desejada
- Tipo de evento
- Quantidade de convidados
- Observações

A escola poderá:

- Aprovar
- Rejeitar
- Solicitar alteração
- Inserir observações

O responsável deverá receber uma notificação sempre que houver alteração relevante no status.

---

# 18. Fluxo de Notificações

As notificações devem manter pais e escola informados sobre mudanças de status.

## Exemplos

### Escola → Pai

```text
Novo bilhete disponível
       │
       ▼
Responsável recebe
       │
       ▼
Visualiza
       │
       ▼
Confirma leitura/responde
```

### Escola → Pai: Documento

```text
Documento solicitado
       │
       ▼
Documento processado
       │
       ▼
Documento disponível
       │
       ▼
Responsável recebe notificação
       │
       ▼
Download
```

### Escola → Pai: Agenda

```text
Solicitação enviada
       │
       ▼
Escola analisa
       │
       ▼
Status atualizado
       │
       ▼
Responsável recebe notificação
```

---

# 19. Modelo de Relacionamento Conceitual

A plataforma deverá considerar que um responsável pode possuir vários filhos e um aluno pode possuir mais de um responsável.

```text
RESPONSÁVEL
     │
     │ 1:N
     ▼
VÍNCULO RESPONSÁVEL-ALUNO
     │
     │ N:1
     ▼
ALUNO
     │
     ├── Turma
     ├── Série
     ├── Professor
     ├── Matrícula
     ├── Rematrícula
     ├── Bilhetes
     ├── Documentos
     ├── Reuniões
     └── Eventos
```

Esse modelo evita assumir que existe apenas um responsável por aluno.

---

# 20. Perfis e Permissões

Uma implementação mais robusta deverá trabalhar com permissões por perfil.

## Responsável

Pode:

- Visualizar seus filhos
- Visualizar dados autorizados
- Receber comunicação
- Responder bilhetes
- Solicitar documentos
- Solicitar reuniões
- Solicitar eventos
- Acompanhar solicitações

Não pode:

- Visualizar outros alunos
- Visualizar dados de outras famílias
- Alterar informações administrativas sem autorização

## Escola / Diretoria

Pode:

- Gerenciar alunos
- Gerenciar matrículas
- Gerenciar rematrículas
- Criar comunicados
- Gerenciar documentos
- Gerenciar agenda
- Gerenciar eventos
- Consultar relatórios

---

# 21. Princípios Importantes da Plataforma

## Segurança

Cada responsável deve acessar somente os alunos vinculados à sua conta.

Todas as operações devem respeitar controle de autorização no backend, e não somente ocultar opções na interface.

## Rastreabilidade

Operações importantes devem registrar:

- Usuário
- Data/hora
- Ação realizada
- Registro afetado
- Alterações realizadas, quando aplicável

## Centralização

As informações inseridas durante matrícula, rematrícula ou cadastro devem alimentar diretamente o cadastro do aluno.

## Redução de Trabalho Manual

O sistema deve evitar que a secretaria precise copiar informações entre diferentes telas ou sistemas.

## Comunicação Assíncrona

Bilhetes, documentos e solicitações devem possuir status para que o usuário consiga acompanhar o processo sem precisar entrar em contato diretamente com a escola.

---

# 22. Evoluções Futuras

A arquitetura deve permitir adicionar posteriormente:

- Portal do professor
- Diário de classe
- Frequência
- Notas
- Boletim
- Financeiro
- Mensalidades
- Emissão de boletos
- Transporte escolar
- Biblioteca
- Controle de entrada e saída
- Integração com WhatsApp
- Aplicativo mobile
- Push notifications
- Relatórios avançados
- Integração com sistemas educacionais externos
- Gestão de documentos digitais
- Assinatura eletrônica
- Controle de permissões avançado

---

# 23. MVP Recomendado

Para evitar começar com um sistema excessivamente grande, o MVP pode ser dividido em:

## Fase 1 — Base

- Autenticação
- Cadastro de responsáveis
- Cadastro de alunos
- Relação responsável ↔ aluno
- Perfis de acesso
- Dashboard

## Fase 2 — Comunicação

- Bilhetes
- Comunicados
- Confirmação de leitura
- Respostas SIM/NÃO
- Notificações

## Fase 3 — Solicitações

- Solicitação de documentos
- Upload de documentos
- Solicitação de reuniões
- Solicitação de eventos
- Controle de status

## Fase 4 — Matrícula

- Matrícula online
- Rematrícula
- Aprovação pela escola
- Atualização automática do cadastro

## Fase 5 — Gestão

- Relatórios
- Auditoria
- Configurações
- Permissões avançadas

---

# 24. Fluxo Consolidado

```text
                         PLATAFORMA ESCOLAR
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
       PORTAL DOS PAIS                    PORTAL DA ESCOLA
              │                                   │
              ▼                                   ▼
          AUTENTICAÇÃO                       AUTENTICAÇÃO
              │                                   │
              ▼                                   ▼
       SELECIONAR ALUNO                    DASHBOARD ADMIN
              │                                   │
      ┌───────┼────────┐              ┌───────────┼───────────┐
      ▼       ▼        ▼              ▼           ▼           ▼
    Dados  Bilhetes  Solicitações   Alunos   Comunicação   Solicitações
              │        │             │           │             │
              │        │             │           │             │
              │        ├─────────────┼───────────┤             │
              │        │             │                         │
              │        ▼             ▼                         ▼
              │    DOCUMENTOS    MATRÍCULAS                AGENDA/EVENTOS
              │        │             │                         │
              └────────┴─────────────┴─────────────────────────┘
                                   │
                                   ▼
                              BANCO DE DADOS
                                   │
                                   ▼
                              NOTIFICAÇÕES
                                   │
                                   ▼
                         RESPONSÁVEL / ESCOLA
```

---

# 25. Objetivo do Produto

Criar uma plataforma centralizada de gestão e comunicação escolar que conecte responsáveis e escola em um único ambiente, reduzindo processos manuais e centralizando informações relacionadas aos alunos.

O sistema deve permitir que responsáveis acompanhem seus filhos, recebam comunicações, solicitem documentos e façam solicitações de agenda, enquanto a escola possui uma área administrativa para gerenciar alunos, matrículas, comunicação e solicitações.

O objetivo principal é transformar processos atualmente dependentes de mensagens, documentos físicos, planilhas e comunicação manual em fluxos digitais rastreáveis, organizados e centralizados.

---

# 26. Resumo dos Fluxos Principais

| Fluxo | Iniciado por | Resultado |
|---|---|---|
| Cadastro | Responsável/Escola | Conta e cadastro criado |
| Matrícula | Responsável | Solicitação analisada pela escola |
| Rematrícula | Responsável | Matrícula atualizada |
| Bilhete | Escola | Responsável recebe e responde |
| Documento | Responsável | Documento disponibilizado |
| Reunião | Responsável | Solicitação aprovada/reagendada/cancelada |
| Evento | Responsável | Solicitação aprovada/rejeitada/alterada |
| Atualização cadastral | Escola/Responsável autorizado | Dados atualizados |
| Notificação | Sistema/Escola | Usuário informado sobre alteração |

---

# 27. Consideração de Arquitetura

A estrutura acima deve ser tratada como uma especificação funcional inicial, e não como uma arquitetura técnica definitiva.

Antes do desenvolvimento completo, ainda devem ser definidos:

- Stack frontend
- Stack backend
- Banco de dados
- Modelo de dados definitivo
- Autenticação
- Autorização/RBAC
- Armazenamento de arquivos
- Serviço de notificações
- Estratégia de backup
- Logs e auditoria
- LGPD e tratamento de dados pessoais
- Infraestrutura
- Estratégia de deploy
- API
- Integrações externas
- Escalabilidade
- Multi-tenancy, caso a plataforma seja comercializada para várias escolas
