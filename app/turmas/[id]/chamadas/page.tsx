"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ChamadasPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [turma, setTurma] = useState<any>(null);
  const [chamadas, setChamadas] = useState<any[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`/api/turmas/${id}`, { cache: "no-store" }),
          fetch(`/api/turmas/${id}/chamadas`, { cache: "no-store" })
        ]);
        if (!tRes.ok) throw new Error("Turma não encontrada");
        const tData = await tRes.json();
        const cData = cRes.ok ? await cRes.json() : { chamadas: [] };
        if (!alive) return;
        setTurma(tData.turma);
        setChamadas(cData.chamadas ?? []);
      } catch (e: any) {
        if (!alive) return;
        setErr(e.message || "Erro ao carregar chamadas");
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
            <Link href={`/turmas/${id}`} className="btn-primary">Voltar</Link>
            <Link href={`/turmas/${id}/chamadas/new`} className="btn-primary">Nova Chamada</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {err && <p className="text-red-600">{err}</p>}
          {!err && !turma && <p className="text-gray-500">Carregando...</p>}
          {turma && (
            <>
              <h2 className="text-3xl font-bold mb-2">Chamadas — {turma.name}</h2>

              {chamadas.length === 0 ? (
                <p className="text-gray-500">Nenhuma chamada registrada ainda. Use “Nova Chamada”.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {chamadas.map((c) => (
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
