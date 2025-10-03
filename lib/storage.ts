import type { Aluno, Chamada, Conteudo, ID, Turma } from "@/types";
export type { Aluno, Chamada, Conteudo, Turma } from "@/types";

const isBrowser = typeof window !== "undefined";
const LS_KEY = "guieduc_store_v1";

type Store = {
  turmas: Turma[];
  alunos: Record<ID, Aluno[]>;
  chamadas: Record<ID, Chamada[]>;
  conteudos: Record<ID, Conteudo[]>;
};

function load(): Store {
  if (!isBrowser) return { turmas: [], alunos: {}, chamadas: {}, conteudos: {} };
  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) return { turmas: [], alunos: {}, chamadas: {}, conteudos: {} };
  try { return JSON.parse(raw) as Store; } catch {
    return { turmas: [], alunos: {}, chamadas: {}, conteudos: {} };
  }
}
function save(store: Store) {
  if (!isBrowser) return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(store));
}
function uid(): ID {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
}
function nowISO() { return new Date().toISOString(); }

/* =================== TURMAS =================== */
export function listTurmas(): Turma[] {
  const s = load();
  return [...s.turmas].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );
}
export function addTurma(nome: string): Turma {
  const s = load();
  const nova: Turma = { id: uid(), nome: nome.trim(), createdAt: nowISO() };
  s.turmas.push(nova);
  save(s);
  return nova;
}
export function removeTurma(turmaId: ID) {
  const s = load();
  s.turmas = s.turmas.filter(t => t.id !== turmaId);
  delete s.alunos[turmaId];
  delete s.chamadas[turmaId];
  delete s.conteudos[turmaId];
  save(s);
}
export function getTurma(turmaId: ID): Turma | null {
  const s = load();
  return s.turmas.find(t => t.id === turmaId) ?? null;
}

/* =================== ALUNOS =================== */
export function listAlunos(turmaId: ID): Aluno[] {
  const s = load();
  const list = s.alunos[turmaId] ?? [];
  return [...list].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}
export function addAluno(turmaId: ID, nome: string): Aluno {
  const s = load();
  const novo: Aluno = { id: uid(), nome: nome.trim(), createdAt: nowISO() };
  s.alunos[turmaId] = s.alunos[turmaId] ?? [];
  s.alunos[turmaId].push(novo);
  save(s);
  return novo;
}
export function updateAluno(turmaId: ID, alunoId: ID, nome: string) {
  const s = load();
  const arr = s.alunos[turmaId] ?? [];
  const idx = arr.findIndex(a => a.id === alunoId);
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], nome: nome.trim() };
    save(s);
  }
}
export function removeAluno(turmaId: ID, alunoId: ID) {
  const s = load();
  s.alunos[turmaId] = (s.alunos[turmaId] ?? []).filter(a => a.id !== alunoId);
  save(s);
}

/* =================== CHAMADAS =================== */
export function listChamadas(turmaId: ID): Chamada[] {
  const s = load();
  return (s.chamadas[turmaId] ?? []).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
export function createChamada(turmaId: ID, nome: string): Chamada {
  const s = load();
  const nova: Chamada = {
    id: uid(),
    turmaId,
    nome: nome.trim(),
    presencas: {},
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  s.chamadas[turmaId] = s.chamadas[turmaId] ?? [];
  s.chamadas[turmaId].push(nova);
  save(s);
  return nova;
}
/** addChamada compatível com (turmaId, "Nome") e (turmaId, {nome, presencas?}) */
export function addChamada(
  turmaId: ID,
  arg: string | { nome: string; presencas?: Record<ID, boolean> }
): Chamada {
  const s = load();
  const nome = typeof arg === "string" ? arg : arg.nome;
  const presencas = typeof arg === "string" ? {} : (arg.presencas ?? {});
  const nova: Chamada = {
    id: uid(),
    turmaId,
    nome: String(nome).trim(),
    presencas,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  s.chamadas[turmaId] = s.chamadas[turmaId] ?? [];
  s.chamadas[turmaId].push(nova);
  save(s);
  return nova;
}
export function getChamada(turmaId: ID, chamadaId: ID): Chamada | null {
  const s = load();
  return (s.chamadas[turmaId] ?? []).find(c => c.id === chamadaId) ?? null;
}
export function saveChamada(turmaId: ID, chamada: Chamada) {
  const s = load();
  const arr = s.chamadas[turmaId] ?? [];
  const idx = arr.findIndex(c => c.id === chamada.id);
  const now = nowISO();
  if (idx >= 0) {
    arr[idx] = { ...chamada, updatedAt: now };
  } else {
    arr.push({ ...chamada, updatedAt: now });
  }
  s.chamadas[turmaId] = arr;
  save(s);
}
export function deleteChamada(turmaId: ID, chamadaId: ID) {
  const s = load();
  s.chamadas[turmaId] = (s.chamadas[turmaId] ?? []).filter(c => c.id !== chamadaId);
  save(s);
}
/** Número estável de aula pela ordem de criação (1..N) */
export function getAulaNumber(turmaId: ID, chamadaId: ID): number {
  const chamadas = listChamadas(turmaId);
  const idx = chamadas.findIndex(c => c.id === chamadaId);
  return idx >= 0 ? idx + 1 : -1;
}

/* =================== CONTEÚDOS =================== */
export function listConteudos(turmaId: ID): Conteudo[] {
  const s = load();
  return (s.conteudos[turmaId] ?? []).sort(
    (a, b) => a.aula - b.aula || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
export function getConteudo(turmaId: ID, conteudoId: ID): Conteudo | null {
  const s = load();
  return (s.conteudos[turmaId] ?? []).find(c => c.id === conteudoId) ?? null;
}
export function upsertConteudo(
  turmaId: ID,
  c: Omit<Conteudo, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Conteudo, "id">>
): Conteudo {
  const s = load();
  s.conteudos[turmaId] = s.conteudos[turmaId] ?? [];
  const now = nowISO();
  if (c.id) {
    const idx = s.conteudos[turmaId].findIndex(x => x.id === c.id);
    if (idx >= 0) {
      s.conteudos[turmaId][idx] = { ...s.conteudos[turmaId][idx], ...c, updatedAt: now } as Conteudo;
      save(s);
      return s.conteudos[turmaId][idx];
    }
  }
  const novo: Conteudo = { id: uid(), createdAt: now, updatedAt: now, ...c } as Conteudo;
  s.conteudos[turmaId].push(novo);
  save(s);
  return novo;
}
/** addConteudo aceita payload com ou sem turmaId, injetando o parâmetro */
export function addConteudo(
  turmaId: ID,
  payload: Omit<Conteudo, "id" | "createdAt" | "updatedAt" | "turmaId"> |
           Omit<Conteudo, "id" | "createdAt" | "updatedAt">
): Conteudo {
  const p = ("turmaId" in payload ? payload : { ...payload, turmaId }) as Omit<Conteudo, "id" | "createdAt" | "updatedAt">;
  return upsertConteudo(turmaId, p);
}
/** updateConteudo compatível com (turmaId, conteudo) e (turmaId, conteudoId, patch) */
export function updateConteudo(turmaId: ID, conteudo: Conteudo): Conteudo;
export function updateConteudo(
  turmaId: ID,
  conteudoId: ID,
  patch: Partial<Omit<Conteudo, "id" | "turmaId" | "createdAt" | "updatedAt">> & { aula?: number }
): Conteudo;
export function updateConteudo(
  turmaId: ID,
  a: any,
  b?: any
): Conteudo {
  const s = load();
  s.conteudos[turmaId] = s.conteudos[turmaId] ?? [];
  const now = nowISO();

  if (typeof a === "string" && b) {
    const conteudoId: ID = a;
    const patch = b as Partial<Omit<Conteudo, "id" | "turmaId" | "createdAt" | "updatedAt">> & { aula?: number };
    const idx = s.conteudos[turmaId].findIndex(x => x.id === conteudoId);
    if (idx >= 0) {
      s.conteudos[turmaId][idx] = { ...s.conteudos[turmaId][idx], ...patch, updatedAt: now };
      save(s);
      return s.conteudos[turmaId][idx];
    }
    throw new Error("Conteúdo não encontrado");
  } else {
    const c = a as Conteudo;
    const idx = s.conteudos[turmaId].findIndex(x => x.id === c.id);
    if (idx >= 0) {
      s.conteudos[turmaId][idx] = { ...s.conteudos[turmaId][idx], ...c, updatedAt: now };
      save(s);
      return s.conteudos[turmaId][idx];
    }
    // se não existir, cria
    const novo: Conteudo = { ...c, id: c.id ?? uid(), createdAt: now, updatedAt: now };
    s.conteudos[turmaId].push(novo);
    save(s);
    return novo;
  }
}
export function removeConteudo(turmaId: ID, conteudoId: ID) {
  const s = load();
  s.conteudos[turmaId] = (s.conteudos[turmaId] ?? []).filter(c => c.id !== conteudoId);
  save(s);
}
export function getConteudoByAula(turmaId: ID, aula: number): Conteudo | null {
  const s = load();
  return (s.conteudos[turmaId] ?? []).find(c => c.aula === aula) ?? null;
}

/* ============= IMPORTAÇÃO (CSV/XLSX) ============= */
export async function importAlunosFromFile(turmaId: ID, file: File): Promise<number> {
  const { read, utils } = await importXLSX();
  const buf = await file.arrayBuffer();
  const wb = read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
  let count = 0;
  for (const r of rows.slice(1)) {
    const nome = String(r[0] ?? "").trim();
    if (nome) { addAluno(turmaId, nome); count++; }
  }
  return count;
}
export async function importConteudosFromFile(turmaId: ID, file: File): Promise<number> {
  const { read, utils } = await importXLSX();
  const buf = await file.arrayBuffer();
  const wb = read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
  return importRowsToConteudos(turmaId, rows);
}
/** Wrappers aceitando File ou string (CSV puro) */
export async function addConteudosCSV(turmaId: ID, fileOrText: File | string): Promise<number> {
  const { read, utils } = await importXLSX();
  if (typeof fileOrText === "string") {
    const wb = read(fileOrText, { type: "string" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
    return importRowsToConteudos(turmaId, rows);
  } else {
    return importConteudosFromFile(turmaId, fileOrText);
  }
}
export async function addConteudosXLSX(turmaId: ID, fileOrText: File | string): Promise<number> {
  // Para XLSX em string, também funciona pois o read() detecta formato pela opção 'type'
  return addConteudosCSV(turmaId, fileOrText);
}

function importRowsToConteudos(turmaId: ID, rows: any[][]): number {
  // Cabeçalho: Aula, Título, Conteúdo, Objetivos, Desenvolvimento, Recursos, BNCC
  let count = 0;
  for (const r of rows.slice(1)) {
    const aula = Number(r[0]);
    const titulo = String(r[1] ?? "");
    const conteudo = String(r[2] ?? "");
    const objetivos = String(r[3] ?? "");
    const desenvolvimento = String(r[4] ?? "");
    const recursos = String(r[5] ?? "");
    const bncc = String(r[6] ?? "");
    if (Number.isFinite(aula) && aula > 0) {
      upsertConteudo(turmaId, { turmaId, aula, titulo, conteudo, objetivos, desenvolvimento, recursos, bncc });
      count++;
    }
  }
  return count;
}

async function importXLSX() {
  const XLSX = await import("xlsx/dist/xlsx.mjs");
  return { read: XLSX.read, utils: XLSX.utils };
}
