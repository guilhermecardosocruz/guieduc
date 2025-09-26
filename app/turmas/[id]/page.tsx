"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TurmaPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [turma, setTurma] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const tRes = await fetch(`/api/turmas/${id}`, { cache: "no-store" });
        if (!tRes.ok) throw new Error("Turma não encontrada");
        const tData = await tRes.json();
        if (!alive) return;
        setTurma(tData.turma);
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "Erro ao carregar turma");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">GUIEDUC</h1>
          <Link href="/dashboard" className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {err && <p className="text-red-600">{err}</p>}
          {!err && !turma && <p className="text-gray-500">Carregando...</p>}
          {turma && (
            <>
              <h2 className="text-3xl font-bold mb-2">{turma.name}</h2>

              {/* Botão abaixo do nome da turma */}
              <div className="mb-8">
                <Link href={`/turmas/${id}/chamadas`} className="btn-primary">
                  Adicionar Chamada
                </Link>
              </div>

              <p className="text-gray-600">Aqui você gerencia a turma. Use o botão acima para abrir a página de chamadas.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
