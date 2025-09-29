export type Turma = { id: string; nome: string; createdAt: number };

const KEY = "guieduc:turmas";

export function listTurmas(): Turma[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Turma[]) : [];
  } catch {
    return [];
  }
}

export function saveTurmas(items: Turma[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addTurma(nome: string): Turma {
  const nova: Turma = {
    id: crypto.randomUUID(),
    nome: nome.trim(),
    createdAt: Date.now()
  };
  const atual = listTurmas();
  const prox = [nova, ...atual];
  saveTurmas(prox);
  return nova;
}

export function getTurma(id: string): Turma | null {
  return listTurmas().find(t => t.id === id) ?? null;
}
