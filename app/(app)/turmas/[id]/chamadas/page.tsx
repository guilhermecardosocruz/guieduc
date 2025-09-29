"use client";
import { useParams } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function ChamadasPage() {
  const { id } = useParams<{ id: string }>();
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Chamadas — {turma?.nome ?? "Turma"}</h1>
      <p className="text-gray-600 mt-2">Em breve: registrar presença, ver histórico, exportar lista.</p>
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
        Placeholder de chamadas.
      </div>
    </div>
  );
}
