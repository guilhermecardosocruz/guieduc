/** Storage util simples baseado em localStorage */
export type Turma = { id: string; nome: string; createdAt: number };
export type Aluno = { id: string; nome: string; createdAt: number };

/** Conteúdo da TURMA (independente de chamada) */
export type Conteudo = {
  id: string;
  turmaId: string;
  aula: string;                // ex.: "Aula 1", "02/10", etc.
  titulo: string;
  conteudoAula: string;        // "Conteúdo da Aula"
  objetivos: string;
  desenvolvimento: string;     // "Desenvolvimento das Atividades"
  recursos: string;            // "Recursos Didáticos"
  bncc: string;                // "BNCC"
  createdAt: number;
  updatedAt: number;
};

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fb; }
  catch { return fb; }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}
function uid() { return crypto?.randomUUID?.() || Math.random().toString(36).slice(2); }

/** -------- Conteúdos (por turma) -------- */
export function listConteudos(turmaId: string): Conteudo[] {
  const arr = readJSON<Conteudo[]>(`guieduc:conteudos:${turmaId}`, []);
  // ordena por createdAt (mais antigo -> mais novo)
  return [...arr].sort((a,b)=>a.createdAt - b.createdAt);
}
export function getConteudo(turmaId: string, conteudoId: string): Conteudo | undefined {
  return listConteudos(turmaId).find(c => c.id === conteudoId);
}
export function addConteudo(turmaId: string, data: Omit<Conteudo,"id"|"turmaId"|"createdAt"|"updatedAt">): Conteudo {
  const now = Date.now();
  const novo: Conteudo = { id: uid(), turmaId, createdAt: now, updatedAt: now, ...data };
  const key = `guieduc:conteudos:${turmaId}`;
  const arr = readJSON<Conteudo[]>(key, []);
  arr.push(novo);
  writeJSON(key, arr);
  return novo;
}
export function updateConteudo(turmaId: string, conteudoId: string, patch: Partial<Conteudo>): Conteudo | undefined {
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

/** Importação CSV/XLSX */
function normalizeHeader(s: string) {
  return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
}
const headerMap = {
  aula: ["aula"],
  titulo: ["titulo","título"],
  conteudoAula: ["conteudo da aula","conteudo","conteúdo","conteúdo da aula"],
  objetivos: ["objetivos"],
  desenvolvimento: ["desenvolvimento das atividades","desenvolvimento"],
  recursos: ["recursos didaticos","recursos didáticos","recursos"],
  bncc: ["bncc"]
};

export async function addConteudosCSV(turmaId: string, file: File): Promise<number> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0);
  if (lines.length < 2) return 0;
  const heads = lines[0].split(";").map(h=>normalizeHeader(h));
  const idxOf = (keys:string[]) => heads.findIndex(h => keys.includes(h));

  const iAula = idxOf(headerMap.aula);
  const iTitulo = idxOf(headerMap.titulo);
  const iConteudo = idxOf(headerMap.conteudoAula);
  const iObj = idxOf(headerMap.objetivos);
  const iDes = idxOf(headerMap.desenvolvimento);
  const iRec = idxOf(headerMap.recursos);
  const iBncc = idxOf(headerMap.bncc);

  let ok = 0;
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(";");
    const payload = {
      aula: cols[iAula] || "",
      titulo: cols[iTitulo] || "",
      conteudoAula: cols[iConteudo] || "",
      objetivos: cols[iObj] || "",
      desenvolvimento: cols[iDes] || "",
      recursos: cols[iRec] || "",
      bncc: cols[iBncc] || ""
    };
    addConteudo(turmaId, payload);
    ok++;
  }
  return ok;
}

// Para XLSX usamos a lib 'xlsx' se estiver instalada. Carregamento dinâmico.
export async function addConteudosXLSX(turmaId: string, file: File): Promise<number> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (rows.length < 2) return 0;

  const heads = (rows[0] as string[]).map(h=>normalizeHeader(h||""));
  const idxOf = (keys:string[]) => heads.findIndex(h => keys.includes(h));

  const iAula = idxOf(headerMap.aula);
  const iTitulo = idxOf(headerMap.titulo);
  const iConteudo = idxOf(headerMap.conteudoAula);
  const iObj = idxOf(headerMap.objetivos);
  const iDes = idxOf(headerMap.desenvolvimento);
  const iRec = idxOf(headerMap.recursos);
  const iBncc = idxOf(headerMap.bncc);

  let ok = 0;
  for (let r=1;r<rows.length;r++){
    const cols = rows[r] as any[];
    const payload = {
      aula: cols[iAula] || "",
      titulo: cols[iTitulo] || "",
      conteudoAula: cols[iConteudo] || "",
      objetivos: cols[iObj] || "",
      desenvolvimento: cols[iDes] || "",
      recursos: cols[iRec] || "",
      bncc: cols[iBncc] || ""
    };
    addConteudo(turmaId, payload);
    ok++;
  }
  return ok;
}
