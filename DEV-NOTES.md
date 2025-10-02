# GUIEDUC — Snapshot de Contexto

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- TailwindCSS
- PWA com `next-pwa` (+ `manifest.json` e `sw.js`)
- Offline-first: `localStorage` hoje; plano de sync futuro com Neon Postgres
- Importação de planilhas: `xlsx` (XLSX) e CSV

## Páginas e fluxos
- **Auth**: `/login`, `/register`, `/recover`
- **Dashboard**: lista de turmas (cards clicáveis); criar e excluir turma
- **Turma**: tela da turma com dois botões (no topo): **Chamadas** e **Conteúdos**
- **Chamadas**:
  - Lista numerada por ordem de criação (número estável da aula)
  - **Nova/Editar**: “Nome da aula”, lista de alunos (linhas azuis alternadas, largura total), check de presença; botões **Salvar chamada**, **Adicionar aluno**, **Importar CSV/XLSX** (templates), **Excluir chamada**
  - **Botão “Conteúdo” no topo** (mesma linha do nome da turma): abre **modal de leitura** com o conteúdo da aula correspondente
- **Conteúdos (por turma)**:
  - **Adicionar individual** com campos: Aula, Título, Conteúdo da Aula, Objetivos, Desenvolvimento das Atividades, Recursos Didáticos, BNCC
  - **Importar CSV/XLSX** com as mesmas colunas (templates disponíveis)
  - Editar / Excluir conteúdo
- **Relatórios**:
  - `/relatorios` — escolhe turma e período (semanal/mensal/trimestral/semestral/anual), gera **PDF**: presença por aula e ranking de ausentes

## Regras de UI (não mudar)
- Manter layout **exatamente** como definido (posições dos botões, estilos, “grade” de alunos ocupando a largura, linhas azuis alternadas)
- Lista de alunos **sempre** ordenada alfabeticamente, ignorando acentos
- PWA funcional (instalável via navegador)

## Armazenamento atual
- `lib/storage.ts` gerencia: Turmas, Alunos (com import CSV/XLSX), Chamadas (com presenças e nome da aula), Conteúdos (campos completos + import CSV/XLSX)
- Helpers:
  - `getAulaNumber(turmaId, chamadaId)` — número estável da aula
  - `getConteudoByAula(turmaId, aula)` — conteúdo correspondente
- Planilhas modelo em `public/templates/`

## Repositório
- https://github.com/guilhermecardosocruz/guieduc
