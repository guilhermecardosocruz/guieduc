"use client";
import { useParams } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function TurmaIndexPage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-3">
        <a href="/dashboard" className="underline text-sm">Voltar para Dashboard</a>
      </div>

      <h2 className="text-2xl font-semibold mb-4">{turma?.nome || "Turma"}</h2>

      <div className="flex flex-wrap gap-2">
        <a href={`${base}/chamadas`} className="btn-primary">Chamadas</a>
        <a href={`${base}/conteudos`} className="btn-primary">Conteúdos</a>
        <a href={`/relatorios?turma=${id}`} className="btn-primary">Relatório de chamadas</a>
      </div>
    </div>
  );
}
