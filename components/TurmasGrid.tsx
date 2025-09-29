"use client";
import Link from "next/link";
import { Turma } from "@/lib/storage";
import { Trash2 } from "lucide-react";

export default function TurmasGrid({
  turmas,
  onDelete
}: {
  turmas: Turma[];
  onDelete: (id: string) => void;
}) {
  if (turmas.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 p-4 bg-white text-sm text-gray-600">
        Nenhuma turma ainda. Use o formulário acima para criar sua primeira turma.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {turmas.map((t) => (
        <Link
          key={t.id}
          href={`/turmas/${t.id}`}
          className="group relative rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm hover:-translate-y-px transition"
          aria-label={`Abrir turma ${t.nome}`}
        >
          <div className="pr-10 text-base font-semibold text-gray-900 truncate">
            {t.nome}
          </div>

          {/* botão excluir (não navega ao clicar) */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm(`Excluir a turma "${t.nome}"?`)) onDelete(t.id);
            }}
            className="absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
            aria-label={`Excluir turma ${t.nome}`}
            title="Excluir"
          >
            <Trash2 size={16} aria-hidden="true" />
            <span className="sr-only">Excluir</span>
          </button>
        </Link>
      ))}
    </div>
  );
}
