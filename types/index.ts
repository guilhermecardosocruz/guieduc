export type ID = string;

export interface Turma {
  id: ID;
  nome: string;
  createdAt: string; // ISO
}

export interface Aluno {
  id: ID;
  nome: string;
  createdAt: string; // ISO
}

export interface Chamada {
  id: ID;
  turmaId: ID;
  nome: string;
  presencas: Record<ID, boolean>;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Conteudo {
  id: ID;
  turmaId: ID;
  aula: number; // 1..N (número estável por ordem de criação)
  titulo: string;
  conteudo: string;
  objetivos: string;
  desenvolvimento: string;
  recursos: string;
  bncc: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
