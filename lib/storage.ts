/** =========================================================
 *  GUIEDUC - Storage (localStorage)
 *  Tudo em um: Turmas, Alunos, Chamadas e Conteúdos
 *  ========================================================= */

//// Utils baseados em localStorage ///////////////////////////////////////////
function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}
function uid() {
  // crypto.randomUUID quando disponível
  // @ts-ignore
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    // @ts-ignore
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// Comparador de nomes (sem acentos/caixa)
function compareNames(a: string, b: string) {
  const strip = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  const na = strip(a);
  const nb = strip(b);
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}

//// Tipos /////////////////////////////////////////////////////////////////////
export type Turma = { id: string; nome: string; createdAt: number };

export type Aluno = { id: string; nome: string; createdAt: number };

export type Chamada = {
  id: string;
  turmaId: string;
  titulo: string;                  // nome da aula
  presencas: Record<string, boolean>; // alunoId -> presente?
  createdAt: number;
  updatedAt: number;
};

export type Conteudo = {
  id: string;
  turmaId: string;
  aula: string;                 // "Aula 1" / "02/10"
  titulo: string;               // Título
  conteudoAula: string;         // Conteúdo da Aula
  objetivos: string;            // Objetivos
  desenvolvimento: string;      // Desenvolvimento das Atividades
  recursos: string;             // Recursos Didáticos
  bncc: string;                 // BNCC
  createdAt: number;
  updatedAt: number;
};

//// Turmas ////////////////////////////////////////////////////////////////////
const TURMAS_KEY = "guieduc:turmas";

export function listTurmas(): Turma[] {
  return readJSON<Turma[]>(TURMAS_KEY, []).sort((a, b) => a.createdAt - b.createdAt);
}
export function getTurma(id: string): Turma | undefined {
  return listTurmas().find(t => t.id === id);
}
export function addTurma(nome: string): Turma {
  const arr = readJSON<Turma[]>(TURMAS_KEY, []);
  const t: Turma = { id: uid(), nome, createdAt: Date.now() };
  arr.push(t);
  writeJSON(TURMAS_KEY, arr);
  return t;
}
export function removeTurma(id: string) {
  writeJSON(TURMAS_KEY, listTurmas().filter(t => t.id !== id));
  // opcional: limpar alunos/chamadas/conteúdos da turma
  writeJSON(`guieduc:alunos:${id}`, []);
  writeJSON(`guieduc:chamadas:${id}`, []);
  writeJSON(`guieduc:conteudos:${id}`, []);
}

//// Alunos (por turma) /////////////////////////////////////////////////////////
export function listAlunos(turmaId: string): Aluno[] {
  const arr = readJSON<Aluno[]>(`guieduc:alunos:${turmaId}`, []);
  return [...arr].sort((a, b) => compareNames(a.nome, b.nome));
}
export function addAluno(turmaId: string, nome: string): Aluno {
  const key = `guieduc:alunos:${turmaId}`;
  const arr = readJSON<Aluno[]>(key, []);
  const novo: Aluno = { id: uid(), nome, createdAt: Date.now() };
  arr.push(novo);
  writeJSON(key, arr);
  return novo;
}
export function updateAlunoName(turmaId: string, alunoId: string, nome: string) {
  const key = `guieduc:alunos:${turmaId}`;
  const arr = readJSON<Aluno[]>(key, []);
  const i = arr.findIndex(a => a.id === alunoId);
  if (i >= 0) {
    arr[i] = { ...arr[i], nome };
    writeJSON(key, arr);
  }
}
export function removeAluno(turmaId: string, alunoId: string) {
  const key = `guieduc:alunos:${turmaId}`;
  const arr = readJSON<Aluno[]>(key, []);
  writeJSON(key, arr.filter(a => a.id !== alunoId));

  // Sincroniza presenças das chamadas: remove a chave desse aluno
  const cKey = `guieduc:chamadas:${turmaId}`;
  const cs = readJSON<Chamada[]>(cKey, []);
  cs.forEach(c => {
    if (c.presencas && alunoId in c.presencas) {
      const { [alunoId]: _, ...rest } = c.presencas;
      c.presencas = rest;
    }
  });
  writeJSON(cKey, cs);
}

// Importação de alunos CSV/XLSX
function normalizeHeader(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
export async function addAlunosCSV(turmaId: string, file: File) {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return 0;

  // tenta detectar cabeçalho, aceita "nome" / "aluno"
  const heads = lines[0].split(/[;,]/).map(h => normalizeHeader(h));
  let start = 1;
  let nameIdx = heads.findIndex(h => ["nome", "aluno"].includes(h));
  if (nameIdx < 0) { nameIdx = 0; start = 0; }

  let ok = 0;
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(/[;,]/);
    const nome = (cols[nameIdx] || "").trim();
    if (nome) { addAluno(turmaId, nome); ok++; }
  }
  return ok;
}
export async function addAlunosXLSX(turmaId: string, file: File) {
  const XLSX = await import("xlsx/dist/xlsx.mjs");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (rows.length === 0) return 0;

  const heads = (rows[0] as string[]).map(h => normalizeHeader(h || ""));
  let start = 1;
  let nameIdx = heads.findIndex(h => ["nome", "aluno"].includes(h));
  if (nameIdx < 0) { nameIdx = 0; start = 0; }

  let ok = 0;
  for (let r = start; r < rows.length; r++) {
    const cols = rows[r] as any[];
    const nome = (cols[nameIdx] || "").toString().trim();
    if (nome) { addAluno(turmaId, nome); ok++; }
  }
  return ok;
}

//// Chamadas (por turma) ///////////////////////////////////////////////////////
export function listChamadas(turmaId: string): Chamada[] {
  const arr = readJSON<Chamada[]>(`guieduc:chamadas:${turmaId}`, []);
  return [...arr].sort((a, b) => a.createdAt - b.createdAt);
}
export function getChamada(turmaId: string, chamadaId: string): Chamada | undefined {
  return listChamadas(turmaId).find(c => c.id === chamadaId);
}
export function addChamada(
  turmaId: string,
  data: Omit<Chamada, "id" | "turmaId" | "createdAt" | "updatedAt">
): Chamada {
  const key = `guieduc:chamadas:${turmaId}`;
  const arr = readJSON<Chamada[]>(key, []);
  const now = Date.now();
  const nova: Chamada = { id: uid(), turmaId, createdAt: now, updatedAt: now, ...data };
  arr.push(nova);
  writeJSON(key, arr);
  return nova;
}
export function updateChamada(
  turmaId: string,
  chamadaId: string,
  patch: Partial<Chamada>
): Chamada | undefined {
  const key = `guieduc:chamadas:${turmaId}`;
  const arr = readJSON<Chamada[]>(key, []);
  const i = arr.findIndex(c => c.id === chamadaId);
  if (i < 0) return;
  arr[i] = { ...arr[i], ...patch, updatedAt: Date.now(), id: chamadaId, turmaId };
  writeJSON(key, arr);
  return arr[i];
}
export function removeChamada(turmaId: string, chamadaId: string) {
  const key = `guieduc:chamadas:${turmaId}`;
  const arr = readJSON<Chamada[]>(key, []);
  writeJSON(key, arr.filter(c => c.id !== chamadaId));
}

//// Conteúdos (por turma) /////////////////////////////////////////////////////
export function listConteudos(turmaId: string): Conteudo[] {
  const arr = readJSON<Conteudo[]>(`guieduc:conteudos:${turmaId}`, []);
  return [...arr].sort((a, b) => a.createdAt - b.createdAt);
}
export function getConteudo(turmaId: string, conteudoId: string): Conteudo | undefined {
  return listConteudos(turmaId).find(c => c.id === conteudoId);
}
export function addConteudo(
  turmaId: string,
  data: Omit<Conteudo, "id" | "turmaId" | "createdAt" | "updatedAt">
): Conteudo {
  const key = `guieduc:conteudos:${turmaId}`;
  const arr = readJSON<Conteudo[]>(key, []);
  const now = Date.now();
  const novo: Conteudo = { id: uid(), turmaId, createdAt: now, updatedAt: now, ...data };
  arr.push(novo);
  writeJSON(key, arr);
  return novo;
}
export function updateConteudo(
  turmaId: string,
  conteudoId: string,
  patch: Partial<Conteudo>
): Conteudo | undefined {
  const key = `guieduc:conteudos:${turmaId}`;
  const arr = readJSON<Conteudo[]>(key, []);
  const i = arr.findIndex(c => c.id === conteudoId);
  if (i < 0) return;
  arr[i] = { ...arr[i], ...patch, updatedAt: Date.now(), id: conteudoId, turmaId };
  writeJSON(key, arr);
  return arr[i];
}
export function removeConteudo(turmaId: string, conteudoId: string) {
  const key = `guieduc:conteudos:${turmaId}`;
  const arr = readJSON<Conteudo[]>(key, []);
  writeJSON(key, arr.filter(c => c.id !== conteudoId));
}

// Import de Conteúdos (CSV / XLSX)
const cHeaderMap = {
  aula: ["aula"],
  titulo: ["titulo", "título"],
  conteudoAula: ["conteudo da aula", "conteudo", "conteúdo", "conteúdo da aula"],
  objetivos: ["objetivos"],
  desenvolvimento: ["desenvolvimento das atividades", "desenvolvimento"],
  recursos: ["recursos didaticos", "recursos didáticos", "recursos"],
  bncc: ["bncc"],
};
export async function addConteudosCSV(turmaId: string, file: File): Promise<number> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return 0;

  const heads = lines[0].split(";").map(h => normalizeHeader(h));
  const idxOf = (keys: string[]) => heads.findIndex(h => keys.includes(h));

  const iA = idxOf(cHeaderMap.aula);
  const iT = idxOf(cHeaderMap.titulo);
  const iC = idxOf(cHeaderMap.conteudoAula);
  const iO = idxOf(cHeaderMap.objetivos);
  const iD = idxOf(cHeaderMap.desenvolvimento);
  const iR = idxOf(cHeaderMap.recursos);
  const iB = idxOf(cHeaderMap.bncc);

  let ok = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    addConteudo(turmaId, {
      aula: cols[iA] || "",
      titulo: cols[iT] || "",
      conteudoAula: cols[iC] || "",
      objetivos: cols[iO] || "",
      desenvolvimento: cols[iD] || "",
      recursos: cols[iR] || "",
      bncc: cols[iB] || "",
    });
    ok++;
  }
  return ok;
}
export async function addConteudosXLSX(turmaId: string, file: File): Promise<number> {
  const XLSX = await import("xlsx/dist/xlsx.mjs");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (rows.length < 2) return 0;

  const heads = (rows[0] as string[]).map(h => normalizeHeader(h || ""));
  const idxOf = (keys: string[]) => heads.findIndex(h => keys.includes(h));

  const iA = idxOf(cHeaderMap.aula);
  const iT = idxOf(cHeaderMap.titulo);
  const iC = idxOf(cHeaderMap.conteudoAula);
  const iO = idxOf(cHeaderMap.objetivos);
  const iD = idxOf(cHeaderMap.desenvolvimento);
  const iR = idxOf(cHeaderMap.recursos);
  const iB = idxOf(cHeaderMap.bncc);

  let ok = 0;
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r] as any[];
    addConteudo(turmaId, {
      aula: cols[iA] || "",
      titulo: cols[iT] || "",
      conteudoAula: cols[iC] || "",
      objetivos: cols[iO] || "",
      desenvolvimento: cols[iD] || "",
      recursos: cols[iR] || "",
      bncc: cols[iB] || "",
    });
    ok++;
  }
  return ok;
}
