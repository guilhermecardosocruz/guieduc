export type Turma = { id: string; nome: string; createdAt: number };
export type Aluno = { id: string; nome: string; createdAt: number };
export type Conteudo = { id: string; titulo: string; descricao: string; createdAt: number };
export type Chamada = {
  id: string;
  // legados (mantidos para UI)
  titulo: string;
  conteudo: string;
  // vínculo
  conteudoId?: string;
  presencas: Record<string, boolean>;
  createdAt: number;
};

const KEY_TURMAS = "guieduc:turmas";
const kAlunos = (tid: string) => `guieduc:alunos:${tid}`;
const kChamadas = (tid: string) => `guieduc:chamadas:${tid}`;
const kConteudos = (tid: string) => `guieduc:conteudos:${tid}`;
const isServer = () => typeof window === "undefined";

/* Utils */
function readJSON<T>(key: string, fallback: T): T {
  if (isServer()) return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function writeJSON(key: string, val: any) { if (!isServer()) localStorage.setItem(key, JSON.stringify(val)); }

/* Turmas */
export function listTurmas(): Turma[] { return readJSON<Turma[]>(KEY_TURMAS, []); }
export function saveTurmas(items: Turma[]) { writeJSON(KEY_TURMAS, items); }
export function addTurma(nome: string): Turma {
  const nova: Turma = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
  saveTurmas([nova, ...listTurmas()]);
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
export function listAlunos(turmaId: string): Aluno[] { return readJSON<Aluno[]>(kAlunos(turmaId), []); }
export function saveAlunos(turmaId: string, alunos: Aluno[]) { writeJSON(kAlunos(turmaId), alunos); }
export function addAluno(turmaId: string, nome: string): Aluno {
  const aluno: Aluno = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
  saveAlunos(turmaId, [aluno, ...listAlunos(turmaId)]);
  return aluno;
}
export function addAlunosCSV(turmaId: string, nomes: string[]) {
  const atuais = listAlunos(turmaId);
  const novos: Aluno[] = nomes.map(n => n.trim()).filter(Boolean)
    .map(n => ({ id: crypto.randomUUID(), nome: n, createdAt: Date.now() }));
  saveAlunos(turmaId, [...novos, ...atuais]);
}

/* Conteúdos */
export function listConteudos(turmaId: string): Conteudo[] { return readJSON<Conteudo[]>(kConteudos(turmaId), []); }
export function saveConteudos(turmaId: string, items: Conteudo[]) { writeJSON(kConteudos(turmaId), items); }
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
/* Atualiza conteúdo e propaga para chamadas vinculadas */
export function updateConteudoAndChamadas(turmaId: string, conteudo: Conteudo) {
  updateConteudo(turmaId, conteudo);
  const ch = listChamadas(turmaId).map(c =>
    c.conteudoId === conteudo.id ? { ...c, titulo: conteudo.titulo, conteudo: conteudo.descricao } : c
  );
  saveChamadas(turmaId, ch);
}

/* Chamadas com migração para conteudoId */
export function listChamadas(turmaId: string): Chamada[] {
  const arr = readJSON<Chamada[]>(kChamadas(turmaId), []);
  let changed = false;
  const conteudos = listConteudos(turmaId);
  const byKey = new Map<string, Conteudo>();
  for (const c of conteudos) byKey.set(`${c.titulo}|${c.descricao}`, c);

  for (const ch of arr) {
    if (!ch.conteudoId) {
      const key = `${(ch.titulo||"").trim()}|${(ch.conteudo||"").trim()}`;
      let target = byKey.get(key);
      if (!target) {
        target = addConteudo(turmaId, { titulo: ch.titulo || "Sem título", descricao: ch.conteudo || "" });
        byKey.set(key, target);
      }
      ch.conteudoId = target.id;
      ch.titulo = target.titulo;
      ch.conteudo = target.descricao;
      changed = true;
    }
  }
  if (changed) saveChamadas(turmaId, arr);
  return arr;
}
export function saveChamadas(turmaId: string, chamadas: Chamada[]) { writeJSON(kChamadas(turmaId), chamadas); }

/* Criar chamada já vinculando ao conteúdo */
export function addChamadaWithConteudo(
  turmaId: string,
  data: { titulo: string; conteudo: string; presencas: Record<string, boolean> }
): Chamada {
  const titulo = data.titulo.trim();
  const descricao = data.conteudo.trim();
  let conteudo = listConteudos(turmaId).find(c => c.titulo === titulo && c.descricao === descricao);
  if (!conteudo) conteudo = addConteudo(turmaId, { titulo, descricao });

  const nova: Chamada = {
    id: crypto.randomUUID(),
    titulo, conteudo: descricao,
    conteudoId: conteudo.id,
    presencas: data.presencas,
    createdAt: Date.now()
  };
  saveChamadas(turmaId, [nova, ...listChamadas(turmaId)]);
  return nova;
}
export function getChamada(turmaId: string, chamadaId: string): Chamada | null {
  return listChamadas(turmaId).find(c => c.id === chamadaId) ?? null;
}
/* Atualizar chamada e propagar no conteúdo */
export function updateChamadaAndConteudo(turmaId: string, ch: Chamada) {
  if (ch.conteudoId) {
    const atual = getConteudo(turmaId, ch.conteudoId);
    if (atual) {
      updateConteudoAndChamadas(turmaId, { ...atual, titulo: ch.titulo.trim(), descricao: ch.conteudo.trim() });
    } else {
      const novo = addConteudo(turmaId, { titulo: ch.titulo.trim(), descricao: ch.conteudo.trim() });
      ch.conteudoId = novo.id;
    }
  } else {
    const novo = addConteudo(turmaId, { titulo: ch.titulo.trim(), descricao: ch.conteudo.trim() });
    ch.conteudoId = novo.id;
  }
  const all = listChamadas(turmaId);
  const idx = all.findIndex(x => x.id === ch.id);
  if (idx !== -1) all[idx] = ch;
  saveChamadas(turmaId, all);
}
export function removeChamada(turmaId: string, chamadaId: string) {
  saveChamadas(turmaId, listChamadas(turmaId).filter(c => c.id !== chamadaId));
}
// === GUIEDUC: atualização de nome de aluno (inline) ===
export function updateAlunoName(turmaId: string, alunoId: string, novoNome: string) {
  if (typeof window === "undefined") return null;
  const key = `guieduc:alunos:${turmaId}`;
  const raw = localStorage.getItem(key);
  const arr = raw ? (JSON.parse(raw) as Aluno[]) : [];
  const idx = arr.findIndex(a => a.id === alunoId);
  if (idx < 0) return null;
  const nome = (novoNome || "").trim();
  if (!nome) return null;
  arr[idx] = { ...arr[idx], nome };
  localStorage.setItem(key, JSON.stringify(arr));
  return arr[idx];
}

// === GUIEDUC: remover aluno e limpar presenças ===
export function removeAluno(turmaId: string, alunoId: string) {
  if (typeof window === "undefined") return false;

  // remove do cadastro de alunos
  {
    const key = `guieduc:alunos:${turmaId}`;
    const arr: Aluno[] = JSON.parse(localStorage.getItem(key) || "[]");
    const next = arr.filter(a => a.id !== alunoId);
    localStorage.setItem(key, JSON.stringify(next));
  }

  // limpar das presenças de todas as chamadas
  {
    const keyC = `guieduc:chamadas:${turmaId}`;
    const chamadas = JSON.parse(localStorage.getItem(keyC) || "[]") as any[];
    for (const c of chamadas) {
      if (c && c.presencas && alunoId in c.presencas) {
        delete c.presencas[alunoId];
      }
    }
    localStorage.setItem(keyC, JSON.stringify(chamadas));
  }
  return true;
}

// === GUIEDUC: remover aluno e limpar presenças ===
export function removeAluno(turmaId: string, alunoId: string) {
  if (typeof window === "undefined") return false;

  // remove do cadastro de alunos
  {
    const key = `guieduc:alunos:${turmaId}`;
    const arr: Aluno[] = JSON.parse(localStorage.getItem(key) || "[]");
    const next = arr.filter(a => a.id !== alunoId);
    localStorage.setItem(key, JSON.stringify(next));
  }

  // limpar das presenças de todas as chamadas
  {
    const keyC = `guieduc:chamadas:${turmaId}`;
    const chamadas = JSON.parse(localStorage.getItem(keyC) || "[]") as any[];
    for (const c of chamadas) {
      if (c && c.presencas && alunoId in c.presencas) {
        delete c.presencas[alunoId];
      }
    }
    localStorage.setItem(keyC, JSON.stringify(chamadas));
  }
  return true;
}
