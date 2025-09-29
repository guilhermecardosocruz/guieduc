"use client";
import { useParams } from "next/navigation";

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-sm text-gray-600">Conteúdos da turma {id} (em breve).</p>
    </div>
  );
}
