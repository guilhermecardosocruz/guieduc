"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TurmaPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [turma, setTurma] = useState<any>(null);
  const [chamadas, setChamadas] = useState<any[]>([]);
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

        const cRes = await fetch(`/api/turmas/${id}/chamadas`, { cache: "no-store" });
        const cData = cRes.ok ? await cRes.json() : { chamadas: [] };
        if (!alive) return;
        setChamadas(cData.chamadas ?? []);
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
          <div className="flex gap-2">
            <Link href="/dashboard" className="btn-primary">Voltar</Link>
            <Link href={`/turmas/${id}/chamadas/new`} className="btn-primary">Adicionar Chamada</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {err && <p className="text-red-600">{err}</p>}
          {!err && !turma && <p className="text-gray-500">Carregando...</p>}
          {turma && (
            <>
              <h2 className="text-3xl font-bold mb-2">{turma.name}</h2>
              <p className="text-gray-600 mb-6">Gerencie as chamadas desta turma.</p>

              <h3 className="text-lg font-semibold mb-2">Chamadas recentes</h3>
              {chamadas.length === 0 ? (
                <p className="text-gray-500">Nenhuma chamada registrada.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {chamadas.slice(0, 6).map((c) => (
                    <div key={c.id} className="rounded-3xl border border-gray-100 p-4 bg-white">
                      <div className="text-sm text-gray-500">
                        Data: {new Date(c.date).toLocaleDateString("pt-BR")}
                      </div>
                      {c.notes && <div className="text-sm mt-1">Obs.: {c.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
