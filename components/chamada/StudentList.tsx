"use client";

import StudentRow from "./StudentRow";
import type { Aluno } from "@/lib/storage/types";

type Props = {
  turmaId: string;
  chamadaId: string;
  alunos: Aluno[];
  onTogglePresenca: (alunoId: string) => void;
  onRename: (alunoId: string, novoNome: string) => void;
  onDelete: (alunoId: string) => void;
};

export default function StudentList({
  turmaId, chamadaId, alunos,
  onTogglePresenca, onRename, onDelete
}: Props) {
  return (
    <div className="w-full">
      {alunos.map((aluno, idx) => (
        <StudentRow
          key={aluno.id}
          aluno={aluno}
          index={idx}
          turmaId={turmaId}
          chamadaId={chamadaId}
          onTogglePresenca={onTogglePresenca}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
