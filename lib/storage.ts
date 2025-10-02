// Comparador de nomes: ignora acentos e caixa (A→Z)
function compareNames(a: string, b: string) {
  const strip = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove diacríticos (acentos)
      .toLowerCase()
      .trim();
  const na = strip(a);
  const nb = strip(b);
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}
/**
 * GUIEDUC storage (localStorage) — implementação única e consolidada
 * Tipos e helpers usados em todo o app (turmas, alunos e chamadas).
 */

export type Turma = { id: string; nome: string; createdAt: number };
export type Aluno = { id: string; nome: string; createdAt: number };
export type Chamada = {
  id: string;
  turmaId: string;
  titulo: string;
  conteudo: string;
  createdAt: number;
  presencas: Record<string, boolean>; // alunoId -> presente?
};

// ----------------- helpers -----------------

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(2);
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {

// Comparador de nomes: ignora acentos e caixa
function compareNames(a: string, b: string) {
  const na = (a || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const nb = (b || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}

  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ----------------- Turmas -----------------

export function listTurmas(): Turma[] {
  return readJSON<Turma[]>("guieduc:turmas", []);
}

export function getTurma(turmaId: string): Turma | null {
  return listTurmas().find((t) => t.id === turmaId) || null;
}

export function addTurma(nome: string): Turma {
  const turmas = listTurmas();
  const t: Turma = { id: uid(), nome: (nome || "").trim(), createdAt: Date.now() };
  turmas.push(t);
  writeJSON("guieduc:turmas", turmas);
  return t;
}

export function removeTurma(turmaId: string): boolean {
  const turmas = listTurmas().filter((t) => t.id !== turmaId);
  writeJSON("guieduc:turmas", turmas);
  // também limpa alunos e chamadas da turma
  writeJSON(`guieduc:alunos:${turmaId}`, []);
  writeJSON(`guieduc:chamadas:${turmaId}`, []);
  return true;
}

// ----------------- Alunos -----------------
export function listAlunos(turmaId: string): Aluno[] {
  const arr = readJSON<Aluno[]>(`guieduc:alunos:`, []);
  return [...arr].sort((a,b) => compareNames(a.nome, b.nome));
}

export function addAluno(turmaId: string, nome: string): Aluno {
  const arr = listAlunos(turmaId);
  const aluno: Aluno = { id: uid(), nome: (nome || "").trim(), createdAt: Date.now() };
  arr.push(aluno);
  writeJSON(`guieduc:alunos:${turmaId}`, arr);
  return aluno;
}

export function addAlunosCSV(turmaId: string, nomes: string[]): number {
  const arr = listAlunos(turmaId);
  let count = 0;
  for (const n of nomes) {
    const nome = (n || "").trim();
    if (!nome) continue;
    arr.push({ id: uid(), nome, createdAt: Date.now() });
    count++;
  }
  writeJSON(`guieduc:alunos:${turmaId}`, arr);
  return count;
}

export function updateAlunoName(turmaId: string, alunoId: string, novoNome: string) {
  const arr = listAlunos(turmaId);
  const idx = arr.findIndex((a) => a.id === alunoId);
  const nome = (novoNome || "").trim();
  if (idx < 0 || !nome) return null;
  arr[idx] = { ...arr[idx], nome };
  writeJSON(`guieduc:alunos:${turmaId}`, arr);
  return arr[idx];
}

/** Remove aluno da turma e apaga sua presença de TODAS as chamadas da turma */
export function removeAluno(turmaId: string, alunoId: string) {
  // 1) remove do cadastro de alunos
  const alunos = listAlunos(turmaId).filter((a) => a.id !== alunoId);
  writeJSON(`guieduc:alunos:${turmaId}`, alunos);

  // 2) limpa presenças do aluno em todas as chamadas
  const chamadas = listChamadas(turmaId);
  for (const c of chamadas) {
    if (c.presencas && alunoId in c.presencas) {
      delete c.presencas[alunoId];
    }
  }
  writeJSON(`guieduc:chamadas:${turmaId}`, chamadas);
  return true;
}

// ----------------- Chamadas -----------------

export function listChamadas(turmaId: string): Chamada[] {
  return readJSON<Chamada[]>(`guieduc:chamadas:${turmaId}`, []);
}

export function getChamada(turmaId: string, chamadaId: string): Chamada | null {
  return listChamadas(turmaId).find((c) => c.id === chamadaId) || null;
}

export function addChamadaWithConteudo(
  turmaId: string,
  data: { titulo: string; conteudo: string; presencas: Record<string, boolean> }
): Chamada {
  const arr = listChamadas(turmaId);
  const c: Chamada = {
    id: uid(),
    turmaId,
    titulo: (data.titulo || "").trim(),
    conteudo: (data.conteudo || "").trim(),
    createdAt: Date.now(),
    presencas: data.presencas || {},
  };
  arr.push(c);
  writeJSON(`guieduc:chamadas:${turmaId}`, arr);
  return c;
}

export function updateChamadaAndConteudo(turmaId: string, chamada: Chamada) {
  const arr = listChamadas(turmaId);
  const idx = arr.findIndex((c) => c.id === chamada.id);
  if (idx < 0) return false;
  arr[idx] = {
    ...arr[idx],
    titulo: (chamada.titulo || "").trim(),
    conteudo: (chamada.conteudo || "").trim(),
    presencas: chamada.presencas || {},
  };
  writeJSON(`guieduc:chamadas:${turmaId}`, arr);
  return true;
}

export function removeChamada(turmaId: string, chamadaId: string) {
  const arr = listChamadas(turmaId).filter((c) => c.id !== chamadaId);
  writeJSON(`guieduc:chamadas:${turmaId}`, arr);
  return true;
}

// ----------------- Conteúdos -----------------

export type Conteudo = {
  id: string;
  turmaId: string;
  titulo: string;      // título curto
  descricao: string;   // descrição/detalhe
  createdAt: number;
};

function listConteudosKey(turmaId: string) {
  return `guieduc:conteudos:${turmaId}`;
}

export function listConteudos(turmaId: string): Conteudo[] {
  return readJSON<Conteudo[]>(listConteudosKey(turmaId), []);
}

/** Importa conteúdos por planilha/lista. Aceita:
 *  - string[] -> cada item vira um conteúdo com titulo=item, descricao=""
 *  - {titulo, descricao?}[] -> usa os campos informados
 *  Retorna quantidade adicionada.
 */
export function addConteudosCSV(
  turmaId: string,
  itens: Array<string | { titulo: string; descricao?: string }>
): number {
  const arr = listConteudos(turmaId);
  let count = 0;
  for (const it of itens) {
    const titulo = (typeof it === "string" ? it : it.titulo) || "";
    const descricao = typeof it === "string" ? "" : it.descricao || "";
    const t = titulo.trim();
    if (!t) continue;
    arr.push({ id: uid(), turmaId, titulo: t, descricao: (descricao || "").trim(), createdAt: Date.now() });
    count++;
  }
  writeJSON(listConteudosKey(turmaId), arr);
  return count;
}

export function addConteudo(
  turmaId: string,
  data: { titulo: string; descricao?: string }
): Conteudo {
  const arr = listConteudos(turmaId);
  const c: Conteudo = {
    id: uid(),
    turmaId,
    titulo: (data.titulo || "").trim(),
    descricao: (data.descricao || "").trim(),
    createdAt: Date.now(),
  };
  arr.push(c);
  writeJSON(listConteudosKey(turmaId), arr);
  return c;
}

export function getConteudo(turmaId: string, conteudoId: string): Conteudo | null {
  return listConteudos(turmaId).find(c => c.id === conteudoId) || null;
}

/** Atualiza o conteúdo e tenta sincronizar chamadas cujo campo `conteudo`
 *  seja exatamente igual ao texto antigo (título antigo ou descrição antiga).
 *  Se bater, troca pelo novo (prioriza novo `descricao`, senão `titulo`).
 */
export function updateConteudoAndChamadas(
  turmaId: string,
  conteudo: Conteudo
) {
  // 1) atualizar registro do conteúdo
  const arr = listConteudos(turmaId);
  const idx = arr.findIndex(c => c.id === conteudo.id);
  if (idx < 0) return false;
  const prev = arr[idx];
  arr[idx] = {
    ...prev,
    titulo: (conteudo.titulo || "").trim(),
    descricao: (conteudo.descricao || "").trim(),
  };
  writeJSON(listConteudosKey(turmaId), arr);

  // 2) sincronizar chamadas (best-effort)
  const novasChamadas = listChamadas(turmaId);
  const antigoTitulo = (prev.titulo || "").trim();
  const antigaDesc   = (prev.descricao || "").trim();
  const novoTexto    = (arr[idx].descricao || arr[idx].titulo || "").trim();

  if (novoTexto) {
    let mudouAlguma = false;
    for (const ch of novasChamadas) {
      const atual = (ch.conteudo || "").trim();
      if (atual && (atual === antigoTitulo || atual === antigaDesc)) {
        ch.conteudo = novoTexto;
        mudouAlguma = true;
      }
    }
    if (mudouAlguma) {
      writeJSON(`guieduc:chamadas:${turmaId}`, novasChamadas);
    }
  }

  return true;
}
