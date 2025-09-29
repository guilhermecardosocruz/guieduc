export type Turma = { id: string; nome: string; createdAt: number };
export type Aluno = { id: string; nome: string; createdAt: number };
export type Chamada = {
  id: string;
  dataISO: string;     // yyyy-mm-dd
  conteudo: string;    // texto livre
  presencas: Record<string, boolean>; // alunoId -> presente?
  createdAt: number;
};

const KEY_TURMAS = "guieduc:turmas";
const kAlunos = (tid: string) => `guieduc:alunos:${tid}`;
const kChamadas = (tid: string) => `guieduc:chamadas:${tid}`;

const isServer = () => typeof window === "undefined";

/* Turmas */
export function listTurmas(): Turma[] {
  if (isServer()) return [];
  try {
    const raw = localStorage.getItem(KEY_TURMAS);
    return raw ? (JSON.parse(raw) as Turma[]) : [];
  } catch { return []; }
}
export function saveTurmas(items: Turma[]) {
  if (isServer()) return;
  localStorage.setItem(KEY_TURMAS, JSON.stringify(items));
}
export function addTurma(nome: string): Turma {
  const nova: Turma = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
  const prox = [nova, ...listTurmas()];
  saveTurmas(prox);
  return nova;
}
export function removeTurma(id: string) {
  saveTurmas(listTurmas().filter(t => t.id !== id));
  // limpa dados vinculados
  if (!isServer()) {
    localStorage.removeItem(kAlunos(id));
    localStorage.removeItem(kChamadas(id));
  }
}
export function getTurma(id: string): Turma | null {
  return listTurmas().find(t => t.id === id) ?? null;
}

/* Alunos */
export function listAlunos(turmaId: string): Aluno[] {
  if (isServer()) return [];
  const raw = localStorage.getItem(kAlunos(turmaId));
  return raw ? (JSON.parse(raw) as Aluno[]) : [];
}
export function saveAlunos(turmaId: string, alunos: Aluno[]) {
  if (isServer()) return;
  localStorage.setItem(kAlunos(turmaId), JSON.stringify(alunos));
}
export function addAluno(turmaId: string, nome: string): Aluno {
  const aluno: Aluno = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
  const prox = [aluno, ...listAlunos(turmaId)];
  saveAlunos(turmaId, prox);
  return aluno;
}
export function addAlunosCSV(turmaId: string, nomes: string[]) {
  const atuais = listAlunos(turmaId);
  const novos: Aluno[] = nomes
    .map(n => n.trim())
    .filter(n => n.length > 0)
    .map(n => ({ id: crypto.randomUUID(), nome: n, createdAt: Date.now() }));
  saveAlunos(turmaId, [...novos, ...atuais]);
}

/* Chamadas */
export function listChamadas(turmaId: string): Chamada[] {
  if (isServer()) return [];
  const raw = localStorage.getItem(kChamadas(turmaId));
  return raw ? (JSON.parse(raw) as Chamada[]) : [];
}
export function saveChamadas(turmaId: string, chamadas: Chamada[]) {
  if (isServer()) return;
  localStorage.setItem(kChamadas(turmaId), JSON.stringify(chamadas));
}
export function addChamada(turmaId: string, c: Omit<Chamada, "id"|"createdAt">): Chamada {
  const nova: Chamada = { ...c, id: crypto.randomUUID(), createdAt: Date.now() };
  const prox = [nova, ...listChamadas(turmaId)];
  saveChamadas(turmaId, prox);
  return nova;
}
