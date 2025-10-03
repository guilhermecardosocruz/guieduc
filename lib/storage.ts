/**
 * GUIEDUC – armazenamento local (PWA) com sincronização futura.
 * localStorage com chaves prefixadas por entidade/coleção.
 * Compatível com páginas existentes (assinaturas flexíveis).
 */

export type Turma = { id: string; nome: string; createdAt: number };
export type Aluno = { id: string; nome: string; email?: string; createdAt: number };

export type Chamada = {
  id: string;
  turmaId: string;
  createdAt: number;
  updatedAt: number;
  /** nome da aula (opcional) */
  nome?: string;
  /** mapa alunoId -> presente? */
  presencas: Record<string, boolean>;
};

export type Conteudo = {
  id: string;
  turmaId: string;
  aula: number;
  titulo: string;
  conteudo: string;
  objetivos: string;
  desenvolvimento: string;
  recursos: string;
  bncc: string;
  createdAt: number;
  updatedAt: number;
};

/* ------------------------------------------------------------------ */
/* utils JSON <-> localStorage                                        */
/* ------------------------------------------------------------------ */

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function uid(): string {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
}

/* Importação dinâmica de xlsx (compatível com Vercel/Next 15) */
async function importXLSX() {
  const XLSX = await import("xlsx");
  const mod: any = (XLSX as any).default ?? XLSX;
  return { read: mod.read, utils: mod.utils };
}

/* ------------------------------------------------------------------ */
/* Migração segura de chave legada (guieduc_store_v1 -> guieduc:*)    */
/* ------------------------------------------------------------------ */
const LEGACY_STORE_KEY = "guieduc_store_v1";
const MIGRATION_MARK = "guieduc:migrated_v1";

type LegacyStore = {
  turmas?: Array<{ id: string; nome: string; createdAt?: string | number }>;
  alunos?: Record<string, any[]>;
  chamadas?: Record<string, any[]>;
  conteudos?: Record<string, any[]>;
};

function ensureMigrated() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MIGRATION_MARK)) return;
    const raw = window.localStorage.getItem(LEGACY_STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as LegacyStore;
    if (!data || !Array.isArray(data.turmas)) return;

    const legacyTurmas = (data.turmas || []).map(t => ({
      id: String(t.id),
      nome: String(t.nome || "Turma"),
      createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.parse(String(t.createdAt || Date.now())),
    }));
    if (legacyTurmas.length) {
      writeJSON(K_TURMAS, legacyTurmas);
    }

    for (const t of legacyTurmas) {
      const tid = t.id;

      const alunosArr = (data.alunos && Array.isArray((data.alunos as any)[tid])) ? (data.alunos as any)[tid] : [];
      const alunos = alunosArr.map((a: any) => ({
        id: String(a.id || a.alunoId || a.codigo || a.key || uid()),
        nome: String(a.nome || a.name || "").trim() || "Aluno",
        email: a.email ? String(a.email) : undefined,
        createdAt: typeof a.createdAt === "number" ? a.createdAt : Date.parse(String(a.createdAt || Date.now())),
      }));
      if (alunos.length) writeJSON(`guieduc:alunos:${tid}`, alunos);

      const chamadasArr = (data.chamadas && Array.isArray((data.chamadas as any)[tid])) ? (data.chamadas as any)[tid] : [];
      const chamadas = chamadasArr.map((c: any) => ({
        id: String(c.id || c.chamadaId || uid()),
        turmaId: tid,
        createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.parse(String(c.createdAt || Date.now())),
        updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : Date.parse(String(c.updatedAt || Date.now())),
        nome: c.nome ? String(c.nome) : undefined,
        presencas: typeof c.presencas === "object" && c.presencas ? c.presencas as Record<string, boolean> : {},
      }));
      if (chamadas.length) writeJSON(`guieduc:chamadas:${tid}`, chamadas);

      const conteudosArr = (data.conteudos && Array.isArray((data.conteudos as any)[tid])) ? (data.conteudos as any)[tid] : [];
      const conteudos = conteudosArr.map((c: any) => ({
        id: String(c.id || c.conteudoId || uid()),
        turmaId: tid,
        aula: Number(c.aula || 0),
        titulo: String(c.titulo || c.title || ""),
        conteudo: String(c.conteudo || c.content || ""),
        objetivos: String(c.objetivos || c.goals || ""),
        desenvolvimento: String(c.desenvolvimento || c.activities || ""),
        recursos: String(c.recursos || c.resources || ""),
        bncc: String(c.bncc || ""),
        createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.parse(String(c.createdAt || Date.now())),
        updatedAt: typeof c.updatedAt === "number" ? c.updatedAt : Date.parse(String(c.updatedAt || Date.now())),
      })).filter((c: any) => c.aula > 0 && c.titulo);
      if (conteudos.length) writeJSON(`guieduc:conteudos:${tid}`, conteudos);
    }

    window.localStorage.setItem(MIGRATION_MARK, String(Date.now()));
    console.info("[GUIEDUC] Migração de legado concluída.");
  } catch {
    /* ignore erros de migração */
  }
}

/* ------------------------------------------------------------------ */
/* consts                                                             */
/* ------------------------------------------------------------------ */

const K_TURMAS = "guieduc:turmas";

/* ------------------------------------------------------------------ */
/* TURMAS                                                             */
/* ------------------------------------------------------------------ */

export function listTurmas(): Turma[] {
  ensureMigrated();
  return readJSON<Turma[]>(K_TURMAS, []);
}

export function addTurma(nome: string): Turma {
  const all = listTurmas();
  const t: Turma = { id: uid(), nome, createdAt: Date.now() };
  writeJSON(K_TURMAS, [...all, t]);
  return t;
}

export function removeTurma(id: string): void {
  const all = listTurmas().filter(t => t.id !== id);
  writeJSON(K_TURMAS, all);
  // limpar coleções derivadas
  writeJSON(`guieduc:alunos:${id}`, []);
  writeJSON(`guieduc:chamadas:${id}`, []);
  writeJSON(`guieduc:conteudos:${id}`, []);
}

export function getTurma(id: string): Turma | null {
  return listTurmas().find(t => t.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* ALUNOS                                                             */
/* ------------------------------------------------------------------ */

export function listAlunos(turmaId: string): Aluno[] {
  const all = readJSON<Aluno[]>(`guieduc:alunos:${turmaId}`, []);
  return [...all].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export function addAluno(turmaId: string, nome: string, email?: string): Aluno {
  const all = listAlunos(turmaId);
  const a: Aluno = { id: uid(), nome, email, createdAt: Date.now() };
  writeJSON(`guieduc:alunos:${turmaId}`, [...all, a]);
  return a;
}

/** updateAluno compatível com:
 *  - (turmaId, alunoId, "Novo Nome")
 *  - (turmaId, alunoId, { nome?: string, email?: string })
 */
export function updateAluno(turmaId: string, alunoId: string, patch: Partial<Aluno> | string): void {
  const all = listAlunos(turmaId).map(a => {
    if (a.id !== alunoId) return a;
    if (typeof patch === "string") {
      return { ...a, nome: patch.trim() };
    }
    const p = { ...patch };
    if (typeof p.nome === "string") p.nome = p.nome.trim();
    return { ...a, ...p };
  });
  writeJSON(`guieduc:alunos:${turmaId}`, all);
}

export function removeAluno(turmaId: string, alunoId: string): void {
  const all = listAlunos(turmaId).filter(a => a.id !== alunoId);
  writeJSON(`guieduc:alunos:${turmaId}`, all);
}

/* ------------------------------------------------------------------ */
/* CHAMADAS                                                           */
/* ------------------------------------------------------------------ */

export function listChamadas(turmaId: string): Chamada[] {
  return readJSON<Chamada[]>(`guieduc:chamadas:${turmaId}`, [])
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getChamada(turmaId: string, chamadaId: string): Chamada | null {
  return listChamadas(turmaId).find(c => c.id === chamadaId) ?? null;
}

/** addChamada compatível com:
 *  - (turmaId, "Nome")
 *  - (turmaId, { nome: string, presencas?: Record<string,boolean> })
 */
export function addChamada(
  turmaId: string,
  arg?: string | { nome: string; presencas?: Record<string, boolean> }
): Chamada {
  const all = listChamadas(turmaId);
  const nome = typeof arg === "string" ? arg : arg?.nome;
  const presencas = (typeof arg === "object" && arg?.presencas) ? arg.presencas : {};
  const c: Chamada = {
    id: uid(),
    turmaId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nome: nome?.trim() || undefined,
    presencas,
  };
  writeJSON(`guieduc:chamadas:${turmaId}`, [...all, c]);
  return c;
}

/** Atualiza uma chamada existente. */
export function saveChamada(turmaId: string, chamada: Chamada): void {
  const all = listChamadas(turmaId).map(c => c.id === chamada.id ? { ...chamada, updatedAt: Date.now() } : c);
  writeJSON(`guieduc:chamadas:${turmaId}`, all);
}

/** Exclui uma chamada. */
export function deleteChamada(turmaId: string, chamadaId: string): void {
  const all = listChamadas(turmaId).filter(c => c.id !== chamadaId);
  writeJSON(`guieduc:chamadas:${turmaId}`, all);
}

/** Número estável de aula (1..N) pela ordem de criação. */
export function getAulaNumber(turmaId: string, chamadaId: string): number {
  const arr = listChamadas(turmaId);
  const idx = arr.findIndex(c => c.id === chamadaId);
  return idx >= 0 ? idx + 1 : -1;
}

/* ------------------------------------------------------------------ */
/* CONTEÚDOS                                                          */
/* ------------------------------------------------------------------ */

export function listConteudos(turmaId: string): Conteudo[] {
  return readJSON<Conteudo[]>(`guieduc:conteudos:${turmaId}`, [])
    .sort((a, b) => a.aula - b.aula || a.createdAt - b.createdAt);
}

export function getConteudo(turmaId: string, conteudoId: string): Conteudo | null {
  return listConteudos(turmaId).find(c => c.id === conteudoId) ?? null;
}

/** Busca conteúdo pela numeração estável da aula */
export function getConteudoByAula(turmaId: string, aula: number): Conteudo | null {
  if (!Number.isFinite(aula) || aula <= 0) return null;
  return listConteudos(turmaId).find(c => c.aula === aula) ?? null;
}

/** updateConteudo (upsert) pela dupla (turmaId, conteudoId). */
export function updateConteudo(turmaId: string, conteudoId: string, patch: Partial<Conteudo>): Conteudo {
  const all = listConteudos(turmaId);
  const now = Date.now();
  const idx = all.findIndex(c => c.id === conteudoId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...patch, updatedAt: now };
    writeJSON(`guieduc:conteudos:${turmaId}`, all);
    return all[idx];
  }
  const novo: Conteudo = {
    id: conteudoId,
    turmaId,
    aula: Number((patch.aula ?? 0)),
    titulo: String(patch.titulo ?? ""),
    conteudo: String(patch.conteudo ?? ""),
    objetivos: String(patch.objetivos ?? ""),
    desenvolvimento: String(patch.desenvolvimento ?? ""),
    recursos: String(patch.recursos ?? ""),
    bncc: String(patch.bncc ?? ""),
    createdAt: now,
    updatedAt: now,
  };
  writeJSON(`guieduc:conteudos:${turmaId}`, [...all, novo]);
  return novo;
}

/** addConteudo aceita payload com ou sem turmaId (injeta automaticamente). */
export function addConteudo(
  turmaId: string,
  data:
    | Omit<Conteudo, "id" | "createdAt" | "updatedAt" | "turmaId">
    | Omit<Conteudo, "id" | "createdAt" | "updatedAt">
): Conteudo {
  const id = uid();
  const payload = ("turmaId" in (data as any)) ? (data as any) : { ...(data as any), turmaId };
  return updateConteudo(turmaId, id, payload);
}

/** Remove um conteúdo pelo id. */
export function removeConteudo(turmaId: string, conteudoId: string): void {
  const all = listConteudos(turmaId).filter(c => c.id !== conteudoId);
  writeJSON(`guieduc:conteudos:${turmaId}`, all);
}

/* ------------------------------------------------------------------ */
/* Importações (Alunos/Conteúdos)                                     */
/* ------------------------------------------------------------------ */

/** Importa alunos a partir de um arquivo (CSV/XLSX). */
export async function importAlunosFromFile(turmaId: string, file: File): Promise<number> {
  const { read, utils } = await importXLSX();
  const buf = await file.arrayBuffer();
  const wb = read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
  let count = 0;
  for (const r of rows.slice(1)) {
    const nome = String(r[0] ?? "").trim();
    const email = String(r[1] ?? "").trim() || undefined;
    if (nome) { addAluno(turmaId, nome, email); count++; }
  }
  return count;
}

/** Importa conteúdos via CSV (texto) */
export async function addConteudosCSV(turmaId: string, csvText: string): Promise<number> {
  const { read, utils } = await importXLSX();
  const wb = read(csvText, { type: "string" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
  return importRowsToConteudos(turmaId, rows);
}

/** Importa conteúdos via XLSX (File ou string) */
export async function addConteudosXLSX(turmaId: string, file: File | string): Promise<number> {
  const { read, utils } = await importXLSX();
  let wb: any;
  if (typeof file === "string") {
    wb = read(file, { type: "string" });
  } else {
    const buf = await file.arrayBuffer();
    wb = read(buf);
  }
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
  return importRowsToConteudos(turmaId, rows);
}

function importRowsToConteudos(turmaId: string, rows: any[][]): number {
  let count = 0;
  // Cabeçalho: Aula, Título, Conteúdo, Objetivos, Desenvolvimento, Recursos, BNCC
  for (const r of rows.slice(1)) {
    const aula = Number((r[0] ?? "0").toString());
    const titulo = (r[1] ?? "").toString();
    const conteudo = (r[2] ?? "").toString();
    const objetivos = (r[3] ?? "").toString();
    const desenvolvimento = (r[4] ?? "").toString();
    const recursos = (r[5] ?? "").toString();
    const bncc = (r[6] ?? "").toString();
    if (!aula || !titulo) continue;
    addConteudo(turmaId, { turmaId, aula, titulo, conteudo, objetivos, desenvolvimento, recursos, bncc });
    count++;
  }
  return count;
}
