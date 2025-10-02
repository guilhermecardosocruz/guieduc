"use client";

import { useState, useRef } from "react";
import type { Aluno } from "@/lib/storage/types";
import { useLongPress } from "./useLongPress";

type Props = {
  aluno: Aluno;
  index: number;
  turmaId: string;
  chamadaId: string;
  onTogglePresenca: (alunoId: string) => void;
  onRename: (alunoId: string, novoNome: string) => void;
  onDelete: (alunoId: string) => void;
};

export default function StudentRow({
  aluno, index, turmaId, chamadaId,
  onTogglePresenca, onRename, onDelete
}: Props) {
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(aluno.nome);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commitSave = () => {
    if (nome.trim() && nome !== aluno.nome) {
      onRename(aluno.id, nome.trim());
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setNome(aluno.nome);
    setEditing(false);
  };

  const startEdit = () => {
    setEditing(true);
    // focus depois de pintar
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const lp = useLongPress({
    onLongPress: startEdit,
    onClick: undefined
  });

  return (
    <div
      className={`w-full px-3 py-2 flex items-center justify-between select-none
        ${index % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}`}
      onDoubleClick={startEdit}
      {...lp}
    >
      {!editing ? (
        <>
          <span className="truncate pr-3">{aluno.nome}</span>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={aluno.presente}
            onChange={() => onTogglePresenca(aluno.id)}
            aria-label={`Presença de ${aluno.nome}`}
          />
        </>
      ) : (
        <div className="w-full flex items-center gap-2">
          <input
            ref={inputRef}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSave();
              if (e.key === "Escape") cancelEdit();
            }}
            className="flex-1 border border-blue-300 rounded px-2 py-1"
            aria-label="Editar nome do aluno"
          />
          <button
            type="button"
            className="px-3 py-1 rounded border border-gray-300"
            onClick={cancelEdit}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded border border-blue-600 text-white bg-blue-600"
            onClick={commitSave}
          >
            Salvar
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded border border-red-600 text-white bg-red-600"
            onClick={() => onDelete(aluno.id)}
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
