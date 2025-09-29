"use client";
import Link from "next/link";
import { Turma } from "@/lib/storage";

export default function TurmasGrid({
  turmas,
  onDelete
}: {
  turmas: Turma[];
  onDelete: (id: string) => void;
}) {
  if (turmas.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 p-6 bg-white">
        <p className="text-gray-600">Nenhuma turma ainda. Use o formulário acima para criar sua primeira turma.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {turmas.map((t) => (
        <div key={t.id} className="rounded-3xl border border-gray-100 p-6 bg-white hover:shadow transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</div>
              <div className="mt-1 text-lg font-semibold">{t.nome}</div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Excluir a turma "${t.nome}"?`)) onDelete(t.id);
              }}
              className="inline-flex items-center rounded-xl border px-3 py-1 text-sm text-red-600 border-red-200 hover:bg-red-50"
              aria-label={`Excluir turma ${t.nome}`}
              title="Excluir"
            >
              Excluir
            </button>
          </div>
          <Link href={`/turmas/${t.id}`} className="mt-3 inline-block text-sm underline">
            Abrir turma
          </Link>
        </div>
      ))}
    </div>
  );
}
