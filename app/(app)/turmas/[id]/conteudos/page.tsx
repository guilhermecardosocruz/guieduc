"use client";
import { useParams } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Conteúdos — {turma?.nome ?? "Turma"}</h1>
      <p className="text-gray-600 mt-2">Em breve: plano de aula, materiais, atividades e avaliações.</p>
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
        Placeholder de conteúdos.
      </div>
    </div>
  );
}
