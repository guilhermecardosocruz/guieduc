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

function safeParse(json: string | null): any | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

/** Heurística: valida forma mínima de Turma/Aluno/Chamada/Conteudo */
function isTurmaArray(x: any): x is Turma[] {
  return Array.isArray(x) && x.every(it => it && typeof it.id === "string" && typeof it.nome === "string");
}
function isAlunoArray(x: any): x is Aluno[] {
  return Array.isArray(x) && x.every(it => it && typeof it.id === "string" && typeof it.nome === "string");
}
function isChamadaArray(x: any): x is Chamada[] {
  return Array.isArray(x) && x.every(it => it && typeof it.id === "string" && typeof it.turmaId === "string");
}
function isConteudoArray(x: any): x is Conteudo[] {
  return Array.isArray(x) && x.every(it => it && typeof it.id === "string" && typeof it.turmaId === "string" && typeof it.aula === "number");
}

/** Normaliza um objeto que já tenha o shape de Store (ou próximo) */
function normalizeMaybeStore(x: any): Store | null {
  if (!x || typeof x !== "object") return null;
  const s: Store = {
    turmas: isTurmaArray(x.turmas) ? x.turmas : [],
    alunos: typeof x.alunos === "object" && x.alunos ? x.alunos as Record<ID, Aluno[]> : {},
    chamadas: typeof x.chamadas === "object" && x.chamadas ? x.chamadas as Record<ID, Chamada[]> : {},
    conteudos: typeof x.conteudos === "object" && x.conteudos ? x.conteudos as Record<ID, Conteudo[]> : {},
  };
  return s;
}

/** Constrói um Store agregando dados espalhados em várias chaves */
function aggregateFromKeys(all: Array<{ key: string; value: any }>): Store | null {
  const agg: Store = emptyStore();

  // 1) Buscar possíveis turmas em arrays "soltos" ou chaves óbvias
  for (const { key, value } of all) {
    if (isTurmaArray(value)) {
      agg.turmas = mergeTurmas(agg.turmas, value);
    } else if (key.toLowerCase().includes("turma")) {
      if (Array.isArray(value) && isTurmaArray(value)) {
        agg.turmas = mergeTurmas(agg.turmas, value);
      } else if (value && Array.isArray(value.turmas) && isTurmaArray(value.turmas)) {
        agg.turmas = mergeTurmas(agg.turmas, value.turmas);
      }
    }
  }

  // 2) Coletar alunos/chamadas/conteudos por turma
  for (const { key, value } of all) {
    const kl = key.toLowerCase();

    // Alunos
    if (isAlunoArray(value)) {
      // tentar inferir turmaId pela própria linha (se os itens tiverem turmaId)
      // (Aluno não tem turmaId no tipo, então não forçamos o genérico)
      const byTurma = groupByTurmaIdFromItems(value as Array<{ turmaId?: string }>);
      if (Object.keys(byTurma).length > 0) {
        for (const [tid, arr] of Object.entries(byTurma)) {
          agg.alunos[tid] = mergeAlunos(agg.alunos[tid] ?? [], arr as Aluno[]);
        }
      } else {
        // fallback: extrair do nome da chave: alunos:<turmaId>
        const tid = extractTurmaFromKey(key);
        if (tid) {
          agg.alunos[tid] = mergeAlunos(agg.alunos[tid] ?? [], value);
        }
      }
    } else if (kl.includes("aluno")) {
      // objetos wrapper
      if (value && Array.isArray(value.alunos) && isAlunoArray(value.alunos)) {
        const tid = extractTurmaFromKey(key) || (value.turmaId as string | undefined);
        if (tid) {
          agg.alunos[tid] = mergeAlunos(agg.alunos[tid] ?? [], value.alunos);
        }
      }
    }

    // Chamadas
    if (isChamadaArray(value)) {
      const groups = groupBy<Chamada>(value, x => x.turmaId);
      for (const [tid, arr] of Object.entries(groups)) {
        agg.chamadas[tid] = mergeChamadas(agg.chamadas[tid] ?? [], arr);
      }
    } else if (kl.includes("chamada")) {
      if (value && Array.isArray(value.chamadas) && isChamadaArray(value.chamadas)) {
        const groups = groupBy<Chamada>(value.chamadas, x => x.turmaId);
        for (const [tid, arr] of Object.entries(groups)) {
          agg.chamadas[tid] = mergeChamadas(agg.chamadas[tid] ?? [], arr);
        }
      }
    }

    // Conteúdos
    if (isConteudoArray(value)) {
      const groups = groupBy<Conteudo>(value, x => x.turmaId);
      for (const [tid, arr] of Object.entries(groups)) {
        agg.conteudos[tid] = mergeConteudos(agg.conteudos[tid] ?? [], arr);
      }
    } else if (kl.includes("conteudo")) {
      if (value && Array.isArray(value.conteudos) && isConteudoArray(value.conteudos)) {
        const groups = groupBy<Conteudo>(value.conteudos, x => x.turmaId);
        for (const [tid, arr] of Object.entries(groups)) {
          agg.conteudos[tid] = mergeConteudos(agg.conteudos[tid] ?? [], arr);
        }
      }
    }

    // Store completo em chaves alternativas óbvias
    if (kl.includes("guieduc") || kl.includes("store")) {
      const s = normalizeMaybeStore(value);
      if (s) {
        agg.turmas = mergeTurmas(agg.turmas, s.turmas);
        for (const [tid, arr] of Object.entries(s.alunos)) {
          agg.alunos[tid] = mergeAlunos(agg.alunos[tid] ?? [], arr);
        }
        for (const [tid, arr] of Object.entries(s.chamadas)) {
          agg.chamadas[tid] = mergeChamadas(agg.chamadas[tid] ?? [], arr);
        }
        for (const [tid, arr] of Object.entries(s.conteudos)) {
          agg.conteudos[tid] = mergeConteudos(agg.conteudos[tid] ?? [], arr);
        }
      }
    }
  }

  // 3) Turmas placeholder para dados órfãos
  const tidsFromData = new Set<string>([
    ...Object.keys(agg.alunos),
    ...Object.keys(agg.chamadas),
    ...Object.keys(agg.conteudos),
  ]);
  const existingTids = new Set(agg.turmas.map(t => t.id));
  for (const tid of tidsFromData) {
    if (!existingTids.has(tid)) {
      agg.turmas.push({ id: tid, nome: "Turma", createdAt: new Date().toISOString() });
    }
  }

  if (agg.turmas.length || Object.keys(agg.alunos).length || Object.keys(agg.chamadas).length || Object.keys(agg.conteudos).length) {
    // Ordenações consistentes
    agg.turmas = sortTurmas(agg.turmas);
    for (const tid of Object.keys(agg.alunos)) {
      agg.alunos[tid] = sortAlunos(agg.alunos[tid]);
    }
    for (const tid of Object.keys(agg.chamadas)) {
      agg.chamadas[tid] = sortChamadas(agg.chamadas[tid]);
    }
    for (const tid of Object.keys(agg.conteudos)) {
      agg.conteudos[tid] = sortConteudos(agg.conteudos[tid]);
    }
    return agg;
  }
  return null;
}

function extractTurmaFromKey(key: string): string | null {
  // exemplos: alunos:ABC123, alunos_ABC123, turmas/ABC123
  const m = key.match(/(?:alunos|chamadas|conteudos)[:_\\/|-]([A-Za-z0-9_-]+)/i);
  return m?.[1] ?? null;
}

function groupBy<T>(arr: T[], by: (x: T) => string): Record<string, T[]> {
  return arr.reduce((acc, it) => {
    const k = by(it);
    (acc[k] = acc[k] || []).push(it);
    return acc;
  }, {} as Record<string, T[]>);
}

/** Aceita itens que possivelmente tenham turmaId */
function groupByTurmaIdFromItems<T extends { turmaId?: string }>(arr: T[]): Record<string, T[]> {
  const withTid = arr.filter(it => typeof it.turmaId === "string") as Array<T & { turmaId: string }>;
  return groupBy(withTid, it => it.turmaId);
}

function uniqById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const it of [...a, ...b]) map.set(it.id, it);
  return [...map.values()];
}

/* merges e sorts */
function mergeTurmas(a: Turma[], b: Turma[]) { return uniqById(a, b); }
function mergeAlunos(a: Aluno[], b: Aluno[]) { return uniqById(a, b); }
function mergeChamadas(a: Chamada[], b: Chamada[]) { return uniqById(a, b); }
function mergeConteudos(a: Conteudo[], b: Conteudo[]) { return uniqById(a, b); }

function sortTurmas(t: Turma[]) {
  return [...t].sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR", { sensitivity: "base" }));
}
function sortAlunos(arr: Aluno[]) {
  return [...arr].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}
function sortChamadas(arr: Chamada[]) {
  return [...arr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
function sortConteudos(arr: Conteudo[]) {
  return [...arr].sort((a, b) => a.aula - b.aula || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Procura dados em chaves legadas e migra para LS_KEY (modo hardcore) */
function tryMigrateFromLegacy(): Store | null {
  if (!isBrowser) return null;

  // 1) Primeiro: procurar stores diretos em chaves óbvias
  const likelyKeys = ["guieduc_store", "guieduc", "store", "guieduc_store_v0", "guieduc_v1"];
  for (const lk of likelyKeys) {
    const s = normalizeMaybeStore(safeParse(window.localStorage.getItem(lk)));
    if (s && (s.turmas.length || Object.keys(s.alunos).length)) {
      console.info("[GUIEDUC] Migração: encontrado store em", lk);
      window.localStorage.setItem(LS_KEY, JSON.stringify(s));
      return s;
    }
  }

  // 2) Se não achar, varrer TODAS as chaves e agregar
  const all: Array<{ key: string; value: any }> = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || k === LS_KEY) continue;
    const v = safeParse(window.localStorage.getItem(k));
    if (v != null) all.push({ key: k, value: v });
  }

  const aggregated = aggregateFromKeys(all);
  if (aggregated) {
    console.info("[GUIEDUC] Migração agregada concluída:",
      {
        turmas: aggregated.turmas.length,
        alunosTids: Object.keys(aggregated.alunos).length,
        chamadasTids: Object.keys(aggregated.chamadas).length,
        conteudosTids: Object.keys(aggregated.conteudos).length,
      }
    );
    window.localStorage.setItem(LS_KEY, JSON.stringify(aggregated));
    return aggregated;
  }

  return null;
}

function load(): Store {
  if (!isBrowser) return emptyStore();
  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) {
    const migrated = tryMigrateFromLegacy();
    if (migrated) return migrated;
    return emptyStore();
  }
  const parsed = safeParse(raw);
  const s = normalizeMaybeStore(parsed);
  if (s) return s;

  const migrated = tryMigrateFromLegacy();
  if (migrated) return migrated;
  return emptyStore();
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
export function exportStore(): string { return JSON.stringify(load()); }
export function importStore(json: string): number {
  try {
    const parsed = JSON.parse(json);
    const s = normalizeMaybeStore(parsed) ?? emptyStore();
    save(s);
    return s.turmas.length;
  } catch { return 0; }
}

/* =================== TURMAS =================== */
export function listTurmas(): Turma[] {
  const s = load();
  return sortTurmas(s.turmas);
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
  return sortAlunos(s.alunos[turmaId] ?? []);
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
  return sortChamadas(s.chamadas[turmaId] ?? []);
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
  return sortConteudos(s.conteudos[turmaId] ?? []);
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
