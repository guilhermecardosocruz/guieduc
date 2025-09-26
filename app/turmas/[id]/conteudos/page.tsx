"use client";

import Link from "next/link";

export default function ConteudosPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">GUIEDUC</h1>
          <Link href={`/turmas/${id}`} className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h2 className="text-3xl font-bold mb-2">Conteúdos — Turma</h2>
          <p className="text-gray-600 mb-4">Em breve: cadastro e organização de conteúdos/aulas.</p>
          <div className="rounded-3xl border border-gray-100 p-6 bg-white">
            <p className="text-gray-500">Placeholder da página de conteúdos.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
