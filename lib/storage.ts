/**
 * GUIEDUC – storage local robusto (offline-first).
 * Este arquivo blinda o modelo para evitar contaminação onde Alunos acabam dentro de Turmas.
 */

export type Turma = { id: string; nome: string; createdAt: number };
export type Aluno = { id: string; nome: string; email?: string; createdAt: number };

export type Chamada = {
  id: string;
  turmaId: string;
  createdAt: number;
  updatedAt: number;
  nome?: string;
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
/* JSON <-> localStorage                                              */
/* ------------------------------------------------------------------ */

const K_TURMAS = "guieduc:turmas";
const LEGACY_STORE_KEY = "guieduc_store_v1";
const MIGRATION_MARK = "guieduc:migrated_v1";

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
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function uid(): string {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
}

/* XLSX dinâmico (browser) */
async function importXLSX() {
  const XLSX = await import("xlsx");
  const mod: any = (XLSX as any).default ?? XLSX;
  return { read: mod.read, utils: mod.utils };
}

/* ------------------------------------------------------------------ */
/* Guards e saneamento                                                */
/* ------------------------------------------------------------------ */

function isNumber(n: any): n is number { return typeof n === "number" && Number.isFinite(n); }

function isTurmaStrict(x: any): x is Turma {
  return x
    && typeof x.id === "string"
    && typeof x.nome === "string"
    && isNumber(x.createdAt)
    // Campos que NÃO podem existir numa turma:
    && typeof (x as any).email === "undefined"
    && typeof (x as any).turmaId === "undefined"
    && typeof (x as any).aula === "undefined"
    && typeof (x as any).presencas === "undefined"
    && typeof (x as any).conteudo === "undefined";
}

function sanitizeTurmas(raw: any): Turma[] {
  const arr = Array.isArray(raw) ? raw : [];
  const valid = arr.filter(isTurmaStrict);
  // Ordenação consistente (nome, pt-BR)
  valid.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  return valid;
}

/** Lê turmas, remove itens inválidos e repara se necessário. */
function readTurmasStrict(): Turma[] {
  const raw = readJSON<any>(K_TURMAS, []);
  const beforeLen = Array.isArray(raw) ? raw.length : 0;
  let turmas = sanitizeTurmas(raw);
  const afterLen = turmas.length;

  // Se havia itens inválidos, gravar apenas as válidas
  if (beforeLen > afterLen) {
    writeJSON(K_TURMAS, turmas);
  }

  // Se ficou vazio, tentar reconstruir por coleções
  if (turmas.length === 0 && typeof window !== "undefined") {
    const tids = new Set<string>();
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i) || "";
      const m = k.match(/^guieduc:(alunos|chamadas|conteudos):(.+)$/);
      if (m) tids.add(m[2]);
    }
    if (tids.size > 0) {
      turmas = Array.from(tids).map(id => ({ id, nome: "Turma", createdAt: Date.now() }));
      writeJSON(K_TURMAS, turmas);
    }
  }
  return turmas;
}

/** Garante migração de legado (segura, não mistura arrays estranhos). */
function ensureMigrated() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MIGRATION_MARK)) return;
    const raw = window.localStorage.getItem(LEGACY_STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as any;
    if (!data || !Array.isArray(data.turmas)) return;

    // Turmas do legado, sanitizadas
    const legacyTurmas = sanitizeTurmas(
      (data.turmas || []).map((t: any) => ({
        id: String(t.id),
        nome: String(t.nome || "Turma"),
        createdAt:
          typeof t.createdAt === "number"
            ? t.createdAt
            : Date.parse(String(t.createdAt || Date.now())),
      }))
    );
    if (legacyTurmas.length) writeJSON(K_TURMAS, legacyTurmas);

    // Coleções por turma
    for (const t of legacyTurmas) {
      const tid = t.id;

      const alunosArr = data.alunos?.[tid];
      if (Array.isArray(alunosArr)) {
        const alunos: Aluno[] = alunosArr.map((a: any) => ({
          id: String(a.id || a.alunoId || a.codigo || a.key || uid()),
          nome: String(a.nome || a.name || "").trim() || "Aluno",
          email: a.email ? String(a.email) : undefined,
          createdAt:
            typeof a.createdAt === "number"
              ? a.createdAt
              : Date.parse(String(a.createdAt || Date.now())),
        }));
        writeJSON(`guieduc:alunos:${tid}`, alunos);
      }

      const chamadasArr = data.chamadas?.[tid];
      if (Array.isArray(chamadasArr)) {
        const chamadas: Chamada[] = chamadasArr.map((c: any) => ({
          id: String(c.id || c.chamadaId || uid()),
          turmaId: tid,
          createdAt:
            typeof c.createdAt === "number"
              ? c.createdAt
              : Date.parse(String(c.createdAt || Date.now())),
          updatedAt:
            typeof c.updatedAt === "number"
              ? c.updatedAt
              : Date.parse(String(c.updatedAt || Date.now())),
          nome: c.nome ? String(c.nome) : undefined,
          presencas:
            typeof c.presencas === "object" && c.presencas
              ? (c.presencas as Record<string, boolean>)
              : {},
        }));
        writeJSON(`guieduc:chamadas:${tid}`, chamadas);
      }

      const conteudosArr = data.conteudos?.[tid];
      if (Array.isArray(conteudosArr)) {
        const conteudos: Conteudo[] = conteudosArr
          .map((c: any) => ({
            id: String(c.id || c.conteudoId || uid()),
            turmaId: tid,
            aula: Number(c.aula || 0),
            titulo: String(c.titulo || c.title || ""),
            conteudo: String(c.conteudo || c.content || ""),
            objetivos: String(c.objetivos || c.goals || ""),
            desenvolvimento: String(c.desenvolvimento || c.activities || ""),
            recursos: String(c.recursos || c.resources || ""),
            bncc: String(c.bncc || ""),
            createdAt:
              typeof c.createdAt === "number"
                ? c.createdAt
                : Date.parse(String(c.createdAt || Date.now())),
            updatedAt:
              typeof c.updatedAt === "number"
                ? c.updatedAt
                : Date.parse(String(c.updatedAt || Date.now())),
          }))
          .filter((c: Conteudo) => Number.isFinite(c.aula) && c.aula > 0 && c.titulo);
        writeJSON(`guieduc:conteudos:${tid}`, conteudos);
      }
    }

    window.localStorage.setItem(MIGRATION_MARK, String(Date.now()));
    // Sanear após migrar
    const sane = readTurmasStrict();
    writeJSON(K_TURMAS, sane);
  } catch {}
}

/** Garante consistência a cada leitura principal. */
function ensureConsistency() {
  ensureMigrated();
  const sane = readTurmasStrict();
  // já gravado dentro do readTurmasStrict quando necessário
  return sane;
}

/* ------------------------------------------------------------------ */
/* API – Turmas                                                       */
/* ------------------------------------------------------------------ */

export function listTurmas(): Turma[] {
  return ensureConsistency();
}

export function addTurma(nome: string): Turma {
  const turmas = readTurmasStrict();
  const t: Turma = { id: uid(), nome: String(nome || "Turma"), createdAt: Date.now() };
  const next = [...turmas, t].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  writeJSON(K_TURMAS, next);
  return t;
}

export function removeTurma(id: string): void {
  const turmas = readTurmasStrict().filter(t => t.id !== id);
  writeJSON(K_TURMAS, turmas);
  writeJSON(`guieduc:alunos:${id}`, []);
  writeJSON(`guieduc:chamadas:${id}`, []);
  writeJSON(`guieduc:conteudos:${id}`, []);
}

export function getTurma(id: string): Turma | null {
  return readTurmasStrict().find(t => t.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* API – Alunos                                                       */
/* ------------------------------------------------------------------ */

export function listAlunos(turmaId: string): Aluno[] {
  const all = readJSON<Aluno[]>(`guieduc:alunos:${turmaId}`, []);
  return [...all].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export function addAluno(turmaId: string, nome: string, email?: string): Aluno {
  const all = listAlunos(turmaId);
  const a: Aluno = { id: uid(), nome: String(nome || "Aluno").trim(), email, createdAt: Date.now() };
  writeJSON(`guieduc:alunos:${turmaId}`, [...all, a]);
  return a;
}

export function updateAluno(turmaId: string, alunoId: string, patch: Partial<Aluno> | string): void {
  const all = listAlunos(turmaId).map(a => {
    if (a.id !== alunoId) return a;
    if (typeof patch === "string") return { ...a, nome: patch.trim() };
    const p: Partial<Aluno> = { ...patch };
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
/* API – Chamadas                                                     */
/* ------------------------------------------------------------------ */

export function listChamadas(turmaId: string): Chamada[] {
  return readJSON<Chamada[]>(`guieduc:chamadas:${turmaId}`, []).sort((a, b) => a.createdAt - b.createdAt);
}

export function getChamada(turmaId: string, chamadaId: string): Chamada | null {
  return listChamadas(turmaId).find(c => c.id === chamadaId) ?? null;
}

export function addChamada(
  turmaId: string,
  arg?: string | { nome: string; presencas?: Record<string, boolean> }
): Chamada {
  const arr = listChamadas(turmaId);
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
  writeJSON(`guieduc:chamadas:${turmaId}`, [...arr, c]);
  return c;
}

export function saveChamada(turmaId: string, chamada: Chamada): void {
  const arr = listChamadas(turmaId).map(c => c.id === chamada.id ? { ...chamada, updatedAt: Date.now() } : c);
  writeJSON(`guieduc:chamadas:${turmaId}`, arr);
}

export function deleteChamada(turmaId: string, chamadaId: string): void {
  const arr = listChamadas(turmaId).filter(c => c.id !== chamadaId);
  writeJSON(`guieduc:chamadas:${turmaId}`, arr);
}

/** Número estável pela ordem de criação (1..N). */
export function getAulaNumber(turmaId: string, chamadaId: string): number {
  const arr = listChamadas(turmaId);
  const idx = arr.findIndex(c => c.id === chamadaId);
  return idx >= 0 ? idx + 1 : -1;
}

/* ------------------------------------------------------------------ */
/* API – Conteúdos                                                    */
/* ------------------------------------------------------------------ */

export function listConteudos(turmaId: string): Conteudo[] {
  return readJSON<Conteudo[]>(`guieduc:conteudos:${turmaId}`, [])
    .sort((a, b) => a.aula - b.aula || a.createdAt - b.createdAt);
}

export function getConteudo(turmaId: string, conteudoId: string): Conteudo | null {
  return listConteudos(turmaId).find(c => c.id === conteudoId) ?? null;
}

export function getConteudoByAula(turmaId: string, aula: number): Conteudo | null {
  if (!Number.isFinite(aula) || aula <= 0) return null;
  return listConteudos(turmaId).find(c => c.aula === aula) ?? null;
}

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
    aula: Number(patch.aula ?? 0),
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

export function removeConteudo(turmaId: string, conteudoId: string): void {
  const all = listConteudos(turmaId).filter(c => c.id !== conteudoId);
  writeJSON(`guieduc:conteudos:${turmaId}`, all);
}

/* ------------------------------------------------------------------ */
/* Importações                                                        */
/* ------------------------------------------------------------------ */

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

export async function addConteudosCSV(turmaId: string, csvText: string): Promise<number> {
  const { read, utils } = await importXLSX();
  const wb = read(csvText, { type: "string" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
  return importRowsToConteudos(turmaId, rows);
}

export async function addConteudosXLSX(turmaId: string, file: File | string): Promise<number> {
  const { read, utils } = await importXLSX();
  let wb: any;
  if (typeof file === "string") wb = read(file, { type: "string" });
  else { const buf = await file.arrayBuffer(); wb = read(buf); }
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = utils.sheet_to_json(ws, { header: 1, defval: "" });
  return importRowsToConteudos(turmaId, rows);
}

function importRowsToConteudos(turmaId: string, rows: any[][]): number {
  let count = 0;
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

/* ------------------------------------------------------------------ */
/* Export/Import (versão atual)                                       */
/* ------------------------------------------------------------------ */

export function exportAllToJSON(): string {
  const turmas = readTurmasStrict();
  const alunos: Record<string, Aluno[]> = {};
  const chamadas: Record<string, Chamada[]> = {};
  const conteudos: Record<string, Conteudo[]> = {};
  for (const t of turmas) {
    alunos[t.id] = readJSON<Aluno[]>(`guieduc:alunos:${t.id}`, []);
    chamadas[t.id] = readJSON<Chamada[]>(`guieduc:chamadas:${t.id}`, []);
    conteudos[t.id] = readJSON<Conteudo[]>(`guieduc:conteudos:${t.id}`, []);
  }
  return JSON.stringify({
    turmas, alunos, chamadas, conteudos,
    _meta: { host: typeof location !== "undefined" ? location.host : "unknown", exportedAt: new Date().toISOString() }
  }, null, 2);
}

export function importAllFromJSON(json: string): { turmas: number; alunos: number; chamadas: number; conteudos: number } {
  const data = JSON.parse(json);
  const rawTurmas = Array.isArray(data.turmas) ? data.turmas : [];
  const turmas = sanitizeTurmas(rawTurmas); // 💡 aqui descartamos “alunos” que vieram no lugar de turmas
  const alunos: Record<string, Aluno[]> = data.alunos && typeof data.alunos === "object" ? data.alunos : {};
  const chamadas: Record<string, Chamada[]> = data.chamadas && typeof data.chamadas === "object" ? data.chamadas : {};
  const conteudos: Record<string, Conteudo[]> = data.conteudos && typeof data.conteudos === "object" ? data.conteudos : {};

  writeJSON(K_TURMAS, turmas);
  let ac = 0, cc = 0, dc = 0;

  const allTids = new Set<string>([
    ...turmas.map(t => t.id),
    ...Object.keys(alunos),
    ...Object.keys(chamadas),
    ...Object.keys(conteudos),
  ]);

  for (const tid of allTids) {
    if (alunos[tid]) { writeJSON(`guieduc:alunos:${tid}`, alunos[tid]); ac++; }
    if (chamadas[tid]) { writeJSON(`guieduc:chamadas:${tid}`, chamadas[tid]); cc++; }
    if (conteudos[tid]) { writeJSON(`guieduc:conteudos:${tid}`, conteudos[tid]); dc++; }
  }
  if (typeof window !== "undefined") window.localStorage.setItem(MIGRATION_MARK, String(Date.now()));
  // Sanea de novo após importar
  const sane = readTurmasStrict();
  writeJSON(K_TURMAS, sane);
  return { turmas: sane.length, alunos: ac, chamadas: cc, conteudos: dc };
}
