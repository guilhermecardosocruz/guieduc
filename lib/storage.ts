import type { Aluno, Chamada, Conteudo, ID, Turma } from "@/types";
export type { Aluno, Chamada, Conteudo, Turma } from "@/types";

const isBrowser = typeof window !== "undefined";
/** Chave canônica atual */
const LS_KEY = "guieduc_store_v1";

type Store = {
  turmas: Turma[];
  alunos: Record<ID, Aluno[]>;
  chamadas: Record<ID, Chamada[]>;
  conteudos: Record<ID, Conteudo[]>;
};

function emptyStore(): Store {
  return { turmas: [], alunos: {}, chamadas: {}, conteudos: {} };
}

/** Tenta validar um objeto genérico como Store */
function normalizeMaybeStore(x: any): Store | null {
  if (!x || typeof x !== "object") return null;
  const s: Store = {
    turmas: Array.isArray(x.turmas) ? x.turmas as Turma[] : [],
    alunos: typeof x.alunos === "object" && x.alunos ? x.alunos as Record<ID, Aluno[]> : {},
    chamadas: typeof x.chamadas === "object" && x.chamadas ? x.chamadas as Record<ID, Chamada[]> : {},
    conteudos: typeof x.conteudos === "object" && x.conteudos ? x.conteudos as Record<ID, Conteudo[]> : {},
  };
  // heurística mínima: turmas é array e elementos têm id/nome
  if (!Array.isArray(s.turmas)) return null;
  if (s.turmas.length > 0) {
    const t0 = s.turmas[0] as any;
    if (!t0 || typeof t0.id !== "string" || typeof t0.nome !== "string") return null;
  }
  return s;
}

/** Procura dados em chaves legadas e migra para LS_KEY */
function tryMigrateFromLegacy(): Store | null {
  if (!isBrowser) return null;
  try {
    const candidates: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      if (k === LS_KEY) continue;
      // priorizar chaves que parecem do projeto
      const kl = k.toLowerCase();
      const score =
        (kl.includes("guieduc") ? 2 : 0) +
        (kl.includes("store") ? 1 : 0) +
        (kl.includes("educ") ? 1 : 0);
      if (score > 0) candidates.push(k);
    }
    // se não achou nada “parecido”, ainda assim tente todas (último recurso)
    if (candidates.length === 0) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k !== LS_KEY) candidates.push(k);
      }
    }

    // Avalia candidatos (os mais específicos primeiro)
    for (const key of candidates) {
      const raw = window.localStorage.getItem(key!);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const s = normalizeMaybeStore(parsed);
        if (s && (s.turmas.length > 0 || Object.keys(s.alunos).length > 0)) {
          // Migra para a chave canônica e mantém a legada
          window.localStorage.setItem(LS_KEY, JSON.stringify(s));
          return s;
        }
      } catch { /* ignora */ }
    }
  } catch { /* ignora */ }
  return null;
}

function load(): Store {
  if (!isBrowser) return emptyStore();
  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) {
    // tentar migrar de chaves antigas
    const migrated = tryMigrateFromLegacy();
    if (migrated) return migrated;
    return emptyStore();
  }
  try {
    const parsed = JSON.parse(raw);
    const s = normalizeMaybeStore(parsed);
    return s ?? emptyStore();
  } catch {
    // se corrompido, tentar migrar
    const migrated = tryMigrateFromLegacy();
    if (migrated) return migrated;
    return emptyStore();
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

/* =================== BACKUP/RESTORE =================== */
/** Exporta o store atual como JSON (string) */
export function exportStore(): string {
  return JSON.stringify(load());
}
/** Importa JSON de backup e sobrescreve o store (retorna número de turmas importadas) */
export function importStore(json: string): number {
  try {
    const parsed = JSON.parse(json);
    const s = normalizeMaybeStore(parsed) ?? emptyStore();
    save(s);
    return s.turmas.length;
  } catch {
    return 0;
  }
}

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
export function updateConteudo(turmaId: ID, conteudo: any, patch?: any): Conteudo {
  const s = load();
  s.conteudos[turmaId] = s.conteudos[turmaId] ?? [];
  const now = nowISO();

  if (typeof conteudo === "string" && patch) {
    const conteudoId: ID = conteudo;
    const idx = s.conteudos[turmaId].findIndex(x => x.id === conteudoId);
    if (idx >= 0) {
      s.conteudos[turmaId][idx] = { ...s.conteudos[turmaId][idx], ...patch, updatedAt: now };
      save(s);
      return s.conteudos[turmaId][idx];
    }
    throw new Error("Conteúdo não encontrado");
  } else {
    const c = conteudo as Conteudo;
    const idx = s.conteudos[turmaId].findIndex(x => x.id === c.id);
    if (idx >= 0) {
      s.conteudos[turmaId][idx] = { ...s.conteudos[turmaId][idx], ...c, updatedAt: now };
      save(s);
      return s.conteudos[turmaId][idx];
    }
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

/** Import ESM da raiz do pacote para compatibilidade no Vercel */
async function importXLSX() {
  const XLSX = await import("xlsx");
  const mod: any = (XLSX as any).default ?? XLSX;
  return { read: mod.read, utils: mod.utils };
}
