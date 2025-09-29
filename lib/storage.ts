export type Turma = { id: string; nome: string; createdAt: number };
export type Aluno = { id: string; nome: string; createdAt: number };
export type Chamada = {
  id: string;
  titulo: string;
  conteudo: string;
  presencas: Record<string, boolean>;
  createdAt: number;
};
export type Conteudo = {
  id: string;
  titulo: string;
  descricao: string;
  createdAt: number;
};

const KEY_TURMAS = "guieduc:turmas";
const kAlunos = (tid: string) => `guieduc:alunos:${tid}`;
const kChamadas = (tid: string) => `guieduc:chamadas:${tid}`;
const kConteudos = (tid: string) => `guieduc:conteudos:${tid}`;

const isServer = () => typeof window === "undefined";

/* Turmas */
export function listTurmas(): Turma[] {
  if (isServer()) return [];
  try { const raw = localStorage.getItem(KEY_TURMAS); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
export function saveTurmas(items: Turma[]) { if (!isServer()) localStorage.setItem(KEY_TURMAS, JSON.stringify(items)); }
export function addTurma(nome: string): Turma {
  const nova: Turma = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
  const prox = [nova, ...listTurmas()];
  saveTurmas(prox);
  return nova;
}
export function removeTurma(id: string) {
  saveTurmas(listTurmas().filter(t => t.id !== id));
  if (!isServer()) {
    localStorage.removeItem(kAlunos(id));
    localStorage.removeItem(kChamadas(id));
    localStorage.removeItem(kConteudos(id));
  }
}
export function getTurma(id: string): Turma | null { return listTurmas().find(t => t.id === id) ?? null; }

/* Alunos */
export function listAlunos(turmaId: string): Aluno[] {
  if (isServer()) return [];
  const raw = localStorage.getItem(kAlunos(turmaId));
  return raw ? JSON.parse(raw) : [];
}
export function saveAlunos(turmaId: string, alunos: Aluno[]) { if (!isServer()) localStorage.setItem(kAlunos(turmaId), JSON.stringify(alunos)); }
export function addAluno(turmaId: string, nome: string): Aluno {
  const aluno: Aluno = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
  const prox = [aluno, ...listAlunos(turmaId)];
  saveAlunos(turmaId, prox);
  return aluno;
}
export function addAlunosCSV(turmaId: string, nomes: string[]) {
  const atuais = listAlunos(turmaId);
  const novos: Aluno[] = nomes.map(n => n.trim()).filter(Boolean).map(n => ({ id: crypto.randomUUID(), nome: n, createdAt: Date.now() }));
  saveAlunos(turmaId, [...novos, ...atuais]);
}

/* Chamadas */
export function listChamadas(turmaId: string): Chamada[] {
  if (isServer()) return [];
  const raw = localStorage.getItem(kChamadas(turmaId));
  return raw ? JSON.parse(raw) : [];
}
export function saveChamadas(turmaId: string, chamadas: Chamada[]) { if (!isServer()) localStorage.setItem(kChamadas(turmaId), JSON.stringify(chamadas)); }
export function addChamada(turmaId: string, c: Omit<Chamada, "id"|"createdAt">): Chamada {
  const nova: Chamada = { ...c, id: crypto.randomUUID(), createdAt: Date.now() };
  const prox = [nova, ...listChamadas(turmaId)];
  saveChamadas(turmaId, prox);
  return nova;
}
export function getChamada(turmaId: string, chamadaId: string): Chamada | null {
  return listChamadas(turmaId).find(c => c.id === chamadaId) ?? null;
}
export function updateChamada(turmaId: string, chamada: Chamada) {
  const atual = listChamadas(turmaId);
  const idx = atual.findIndex(c => c.id === chamada.id);
  if (idx !== -1) { atual[idx] = chamada; saveChamadas(turmaId, atual); }
}
export function removeChamada(turmaId: string, chamadaId: string) {
  saveChamadas(turmaId, listChamadas(turmaId).filter(c => c.id !== chamadaId));
}

/* Conteúdos */
export function listConteudos(turmaId: string): Conteudo[] {
  if (isServer()) return [];
  const raw = localStorage.getItem(kConteudos(turmaId));
  return raw ? JSON.parse(raw) : [];
}
export function saveConteudos(turmaId: string, items: Conteudo[]) { if (!isServer()) localStorage.setItem(kConteudos(turmaId), JSON.stringify(items)); }
export function addConteudo(turmaId: string, c: Omit<Conteudo, "id"|"createdAt">): Conteudo {
  const novo: Conteudo = { ...c, id: crypto.randomUUID(), createdAt: Date.now() };
  saveConteudos(turmaId, [novo, ...listConteudos(turmaId)]);
  return novo;
}
export function addConteudosCSV(turmaId: string, linhas: { titulo: string; descricao: string }[]) {
  const atuais = listConteudos(turmaId);
  const novos: Conteudo[] = linhas
    .map(l => ({ titulo: l.titulo.trim(), descricao: l.descricao.trim() }))
    .filter(l => l.titulo.length > 0)
    .map(l => ({ id: crypto.randomUUID(), titulo: l.titulo, descricao: l.descricao, createdAt: Date.now() }));
  saveConteudos(turmaId, [...novos, ...atuais]);
}
export function getConteudo(turmaId: string, conteudoId: string): Conteudo | null {
  return listConteudos(turmaId).find(c => c.id === conteudoId) ?? null;
}
export function updateConteudo(turmaId: string, conteudo: Conteudo) {
  const arr = listConteudos(turmaId);
  const idx = arr.findIndex(c => c.id === conteudo.id);
  if (idx !== -1) { arr[idx] = conteudo; saveConteudos(turmaId, arr); }
}
export function removeConteudo(turmaId: string, conteudoId: string) {
  saveConteudos(turmaId, listConteudos(turmaId).filter(c => c.id !== conteudoId));
}
