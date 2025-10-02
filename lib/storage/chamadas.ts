import type { Chamada, Aluno } from "./types";

const KEY = "guieduc:chamadas";

function readAll(): Chamada[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Chamada[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Chamada[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getChamada(turmaId: string, chamadaId: string): Chamada | null {
  return readAll().find(c => c.turmaId === turmaId && c.id === chamadaId) ?? null;
}

export function upsertChamada(data: Chamada) {
  const all = readAll();
  const i = all.findIndex(c => c.id === data.id && c.turmaId === data.turmaId);
  if (i >= 0) all[i] = data; else all.push(data);
  writeAll(all);
}

export function updateAlunoNome(turmaId: string, chamadaId: string, alunoId: string, novoNome: string) {
  const all = readAll();
  const i = all.findIndex(c => c.turmaId === turmaId && c.id === chamadaId);
  if (i < 0) return;
  const chamada = all[i];
  chamada.alunos = chamada.alunos.map(a => a.id === alunoId ? { ...a, nome: novoNome } : a);
  writeAll(all);
}

export function deleteAluno(turmaId: string, chamadaId: string, alunoId: string) {
  const all = readAll();
  const i = all.findIndex(c => c.turmaId === turmaId && c.id === chamadaId);
  if (i < 0) return;
  const chamada = all[i];
  // mantém ordem dos demais
  chamada.alunos = chamada.alunos.filter(a => a.id !== alunoId);
  writeAll(all);
}

export function togglePresenca(turmaId: string, chamadaId: string, alunoId: string) {
  const all = readAll();
  const i = all.findIndex(c => c.turmaId === turmaId && c.id === chamadaId);
  if (i < 0) return;
  const chamada = all[i];
  chamada.alunos = chamada.alunos.map(a => a.id === alunoId ? { ...a, presente: !a.presente } : a);
  writeAll(all);
}
