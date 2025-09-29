import * as XLSX from "xlsx";

/** Normaliza chave (remove acento, minúsculas) */
function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** CSV simples -> linhas */
function parseCsvLines(text: string) {
  return text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
}

/** Lê a primeira planilha como array de objetos */
async function readSheetObjects(file: File): Promise<Record<string, any>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, any>[];
}

/** Parser de alunos: retorna array de nomes */
export async function parseAlunosFile(file: File): Promise<string[]> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  // XLSX/XLS
  if (ext === "xlsx" || ext === "xls") {
    const rows = await readSheetObjects(file);
    if (!rows.length) return [];
    // tenta coluna "nome"
    const keys = Object.keys(rows[0] || {});
    const nomeKey = keys.find(k => norm(k) === "nome") || keys[0];
    return rows.map(r => String(r[nomeKey] ?? "").toString().trim()).filter(Boolean);
  }
  // CSV fallback
  const text = await file.text();
  const lines = parseCsvLines(text);
  if (!lines.length) return [];
  let start = 0;
  const header = lines[0].toLowerCase().replace(/;/g, ",");
  if (header.includes("nome")) start = 1;
  return lines.slice(start).map(l => (l.split(/[;,]/)[0] || "").trim()).filter(Boolean);
}

/** Parser de conteúdos: retorna {titulo, descricao}[] */
export async function parseConteudosFile(file: File): Promise<Array<{ titulo: string; descricao: string }>> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  // XLSX/XLS
  if (ext === "xlsx" || ext === "xls") {
    const rows = await readSheetObjects(file);
    if (!rows.length) return [];
    const keys = Object.keys(rows[0] || {});
    // aceita título/titulo / descrição/descricao
    const tKey = keys.find(k => ["titulo","título","title"].includes(norm(k))) || keys[0];
    const dKey = keys.find(k => ["descricao","descrição","description"].includes(norm(k))) || keys[1] || keys[0];
    return rows.map(r => ({
      titulo: String(r[tKey] ?? "").toString().trim(),
      descricao: String(r[dKey] ?? "").toString().trim()
    })).filter(x => x.titulo.length > 0);
  }
  // CSV fallback
  const text = await file.text();
  const lines = parseCsvLines(text);
  if (!lines.length) return [];
  let start = 0;
  const header = lines[0].toLowerCase().replace(/;/g, ",");
  if (header.includes("titulo") || header.includes("título")) start = 1;
  return lines.slice(start).map(l => {
    const [t, d] = l.split(/[;,]/);
    return { titulo: (t||"").trim(), descricao: (d||"").trim() };
  }).filter(x => x.titulo.length > 0);
}
