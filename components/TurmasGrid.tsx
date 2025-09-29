"use client";
import type { Turma } from "@/lib/storage";

export default function TurmasGrid({
  turmas,
  onDelete,
}: {
  turmas: Turma[];
  onDelete: (id: string) => void;
}) {
  if (!turmas.length) {
    return (
      <p className="text-sm text-gray-500">
        Nenhuma turma ainda. Crie a primeira no campo acima.
      </p>
    );
  }

  return (
    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {turmas.map((t) => (
        <div key={t.id} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <a href={`/turmas/${t.id}`} className="block px-4 py-3">
            <div className="font-medium truncate">{t.nome}</div>
          </a>
          <button
            onClick={() => onDelete(t.id)}
            className="absolute right-2 top-2 rounded-xl border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            aria-label={`Excluir turma ${t.nome}`}
            title="Excluir turma"
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}
