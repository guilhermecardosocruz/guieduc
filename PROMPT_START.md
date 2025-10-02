Quero continuar o projeto **GUIEDUC** seguindo este snapshot (não altere o design sem eu pedir):

- Stack: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + PWA (next-pwa).
- Offline-first em localStorage; plano de sync Neon Postgres.
- Telas: Auth (login/register/recover), Dashboard (turmas), Turma (botões “Chamadas” e “Conteúdos”).
- Chamadas:
  - numeração estável por ordem de criação;
  - Nova/Editar: Nome da aula, lista de alunos (linhas azuis alternadas, largura total), check de presença; salvar, adicionar aluno, importar CSV/XLSX, excluir.
  - Botão “Conteúdo” no topo abre modal de **leitura** do conteúdo da aula correspondente.
- Conteúdos (por turma):
  - adicionar individual (Aula, Título, Conteúdo da Aula, Objetivos, Desenvolvimento, Recursos, BNCC),
  - importar CSV/XLSX com as mesmas colunas e templates,
  - editar/excluir.
- Relatórios: /relatorios, período (semanal/mensal/trimestral/semestral/anual), gera PDF com presença por aula e ranking de ausentes.
- UI: manter exatamente posições/estilos (linhas azuis, grade ocupando largura, botões no topo).
- Repo: github.com/guilhermecardosocruz/guieduc (usar DEV-NOTES.md como referência).

Estilo da conversa:
- Sempre me devolva mudanças de código via **comandos `cat`/`sed`/`mkdir -p`**, garantindo diretórios antes de escrever.
- Ao final: `pnpm typecheck` + commit + push.
- Não mude o layout sem eu pedir. Se houver risco de quebrar algo, explique e proponha alternativa mínima.

A partir desse contexto, vamos fazer a seguinte tarefa agora: <DESCREVER A TAREFA AQUI>.
