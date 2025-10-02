"use client";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ConteudoPlaceholderPage() {
  const { id, chamadaId } = useParams<{ id: string; chamadaId: string }>();
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4">
        <Link href={`/turmas/${id}/chamadas/${chamadaId}`} className="underline">Voltar para a chamada</Link>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <h1 className="text-2xl font-bold mb-2">Conteúdo da aula</h1>
        <p className="text-gray-600">no futuro o conteúdo aqui</p>
      </div>
    </div>
  );
}
