/**
 * GUIEDUC – armazenamento local (PWA) com sincronização futura.
 * Tudo aqui usa localStorage em prefixos por entidade/coleção.
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
  /** número da aula (1,2,3...) */
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
  return crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

const K_TURMAS = "guieduc:turmas";

/* ------------------------------------------------------------------ */
/* Turmas                                                             */
/* ------------------------------------------------------------------ */

export function listTurmas(): Turma[] {
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
  // também limpamos coleções derivadas
  writeJSON(`guieduc:alunos:${id}`, []);
  writeJSON(`guieduc:chamadas:${id}`, []);
  writeJSON(`guieduc:conteudos:${id}`, []);
}

export function getTurma(id: string): Turma | null {
  return listTurmas().find(t => t.id === id) ?? null;
}

/* ------------------------------------------------------------------ */
/* Alunos                                                             */
/* ------------------------------------------------------------------ */

export function listAlunos(turmaId: string): Aluno[] {
  const arr = readJSON<Aluno[]>(`guieduc:alunos:${turmaId}`, []);
  // ordenar alfabeticamente (ignora acentos/caixa)
  const strip = (s: string) =>
    (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return [...arr].sort((a, b) => {
    const na = strip(a.nome);
    const nb = strip(b.nome);
    return na < nb ? -1 : na > nb ? 1 : 0;
  });
}

export function addAluno(turmaId: string, nome: string, email?: string): Aluno {
  const all = readJSON<Aluno[]>(`guieduc:alunos:${turmaId}`, []);
  const a: Aluno = { id: uid(), nome, email, createdAt: Date.now() };
  writeJSON(`guieduc:alunos:${turmaId}`, [...all, a]);
  return a;
}

export function removeAluno(turmaId: string, alunoId: string): void {
  const all = readJSON<Aluno[]>(`guieduc:alunos:${turmaId}`, []);
  writeJSON(`guieduc:alunos:${turmaId}`, all.filter(a => a.id !== alunoId));
  // remover presença em chamadas existentes
  const cs = listChamadas(turmaId).map(c => {
    const clone: Chamada = { ...c, presencas: { ...c.presencas } };
    delete clone.presencas[alunoId];
    return clone;
  });
  writeJSON(`guieduc:chamadas:${turmaId}`, cs);
}

/** Importa CSV de alunos – primeira coluna = nome, segunda opcional = email */
export async function addAlunosCSV(turmaId: string, csvText: string): Promise<number> {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  let count = 0;
  for (const line of lines) {
    const [nome, email] = line.split(/[;,]/).map(s => s?.trim() ?? "");
    if (nome) {
      addAluno(turmaId, nome, email || undefined);
      count++;
    }
  }
  return count;
}

/** Importa XLSX de alunos – usa a primeira planilha, col A=nome, col B=email(opcional) */
export async function addAlunosXLSX(turmaId: string, file: File | ArrayBuffer): Promise<number> {
  const XLSX = await import("xlsx");
  const ab = file instanceof File ? await file.arrayBuffer() : file;
  const wb = XLSX.read(new Uint8Array(ab), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  let count = 0;
  for (const r of rows) {
    const nome = (r?.[0] ?? "").toString().trim();
    const email = (r?.[1] ?? "").toString().trim();
    if (nome) {
      addAluno(turmaId, nome, email || undefined);
      count++;
    }
  }
  return count;
}

/* ------------------------------------------------------------------ */
/* Chamadas                                                           */
/* ------------------------------------------------------------------ */

export function listChamadas(turmaId: string): Chamada[] {
  return readJSON<Chamada[]>(`guieduc:chamadas:${turmaId}`, []);
}

/** Cria chamada; aceita { nome?, presencas } */
export function addChamada(
  turmaId: string,
  data: Omit<Chamada, "id" | "turmaId" | "createdAt" | "updatedAt" | "presencas"> & {
    nome?: string;
    presencas?: Record<string, boolean>;
  } = {}
): Chamada {
  const all = listChamadas(turmaId);
  const c: Chamada = {
    id: uid(),
    turmaId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nome: data.nome?.trim() || "",
    presencas: data.presencas ? { ...data.presencas } : {},
  };
  writeJSON(`guieduc:chamadas:${turmaId}`, [...all, c]);
  return c;
}

export function getChamada(turmaId: string, chamadaId: string): Chamada | null {
  return listChamadas(turmaId).find(c => c.id === chamadaId) ?? null;
}

export function updateChamada(
  turmaId: string,
  chamadaId: string,
  patch: Partial<Pick<Chamada, "nome" | "presencas">>
): Chamada | null {
  const all = listChamadas(turmaId);
  const idx = all.findIndex(c => c.id === chamadaId);
  if (idx < 0) return null;
  const prev = all[idx];
  const next: Chamada = {
    ...prev,
    ...patch,
    presencas: patch.presencas ? { ...patch.presencas } : prev.presencas,
    updatedAt: Date.now(),
  };
  all[idx] = next;
  writeJSON(`guieduc:chamadas:${turmaId}`, all);
  return next;
}

export function removeChamada(turmaId: string, chamadaId: string): void {
  const all = listChamadas(turmaId).filter(c => c.id !== chamadaId);
  writeJSON(`guieduc:chamadas:${turmaId}`, all);
}

/**
 * Número estável da aula baseado na ordem de criação (crescente).
 * Aula 1 = primeira chamada criada; Aula 2 = segunda; ...
 */
export function getAulaNumber(turmaId: string, chamadaId: string): number | null {
  const list = [...listChamadas(turmaId)].sort((a, b) => a.createdAt - b.createdAt);
  const idx = list.findIndex(c => c.id === chamadaId);
  return idx >= 0 ? idx + 1 : null;
}

/* ------------------------------------------------------------------ */
/* Conteúdos                                                          */
/* ------------------------------------------------------------------ */

export function listConteudos(turmaId: string): Conteudo[] {
  return readJSON<Conteudo[]>(`guieduc:conteudos:${turmaId}`, []);
}

export function addConteudo(
  turmaId: string,
  data: Omit<Conteudo, "id" | "turmaId" | "createdAt" | "updatedAt">
): Conteudo {
  const all = listConteudos(turmaId);
  const c: Conteudo = {
    id: uid(),
    turmaId,
    aula: data.aula,
    titulo: data.titulo || "",
    conteudo: data.conteudo || "",
    objetivos: data.objetivos || "",
    desenvolvimento: data.desenvolvimento || "",
    recursos: data.recursos || "",
    bncc: data.bncc || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  writeJSON(`guieduc:conteudos:${turmaId}`, [...all, c]);
  return c;
}

export function getConteudo(turmaId: string, conteudoId: string): Conteudo | null {
  return listConteudos(turmaId).find(c => c.id === conteudoId) ?? null;
}

export function updateConteudo(
  turmaId: string,
  conteudoId: string,
  patch: Partial<Omit<Conteudo, "id" | "turmaId" | "createdAt">>
): Conteudo | null {
  const all = listConteudos(turmaId);
  const idx = all.findIndex(c => c.id === conteudoId);
  if (idx < 0) return null;
  const prev = all[idx];
  const next: Conteudo = {
    ...prev,
    ...patch,
    updatedAt: Date.now(),
  };
  all[idx] = next;
  writeJSON(`guieduc:conteudos:${turmaId}`, all);
  return next;
}

/** Busca um conteúdo pelo número da aula. */
export function getConteudoByAula(turmaId: string, aula: number): Conteudo | null {
  const cs = listConteudos(turmaId);
  return cs.find(c => c.aula === aula) ?? null;
}

/** Importar CSV de conteúdos – colunas fixas: Aula,Título,Conteúdo,Objetivos,Desenvolvimento,Recursos,BNCC */
export async function addConteudosCSV(turmaId: string, csvText: string): Promise<number> {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return 0;
  // tenta detectar cabeçalho
  const header = lines[0].toLowerCase();
  const start = /aula/.test(header) && /t[ií]tulo|titulo/.test(header) ? 1 : 0;
  let count = 0;
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(/[;,]/).map(s => s?.trim() ?? "");
    const aula = Number(cols[0] || "0");
    const titulo = cols[1] || "";
    const conteudo = cols[2] || "";
    const objetivos = cols[3] || "";
    const desenvolvimento = cols[4] || "";
    const recursos = cols[5] || "";
    const bncc = cols[6] || "";
    if (!aula || !titulo) continue;
    addConteudo(turmaId, { aula, titulo, conteudo, objetivos, desenvolvimento, recursos, bncc });
    count++;
  }
  return count;
}

/** Importar XLSX de conteúdos – usa a primeira planilha, colunas como no CSV */
export async function addConteudosXLSX(turmaId: string, file: File | ArrayBuffer): Promise<number> {
  const XLSX = await import("xlsx");
  const ab = file instanceof File ? await file.arrayBuffer() : file;
  const wb = XLSX.read(new Uint8Array(ab), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (!rows.length) return 0;
  // detecta cabeçalho
  const first = (rows[0] || []).map((x: any) => (x ?? "").toString().toLowerCase());
  const hasHeader = first.join(",").includes("aula") && first.join(",").includes("título");
  const start = hasHeader ? 1 : 0;
  let count = 0;
  for (let i = start; i < rows.length; i++) {
    const r = rows[i] || [];
    const aula = Number((r[0] ?? "0").toString());
    const titulo = (r[1] ?? "").toString();
    const conteudo = (r[2] ?? "").toString();
    const objetivos = (r[3] ?? "").toString();
    const desenvolvimento = (r[4] ?? "").toString();
    const recursos = (r[5] ?? "").toString();
    const bncc = (r[6] ?? "").toString();
    if (!aula || !titulo) continue;
    addConteudo(turmaId, { aula, titulo, conteudo, objetivos, desenvolvimento, recursos, bncc });
    count++;
  }
  return count;
}

/** Remove um conteúdo pelo id. */
export function removeConteudo(turmaId: string, conteudoId: string): void {
  const all = listConteudos(turmaId).filter(c => c.id !== conteudoId);
  writeJSON(`guieduc:conteudos:${turmaId}`, all);
}
