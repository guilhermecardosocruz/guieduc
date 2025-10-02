export type Aluno = {
  id: string;
  nome: string;
  presente: boolean;
};

export type Chamada = {
  id: string;           // chamadaId
  turmaId: string;
  createdAt: string;    // ISO
  nomeAula: string;     // "Nome da aula"
  alunos: Aluno[];      // ordem estável por criação
};
