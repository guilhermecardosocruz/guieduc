"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

type Chamada = {
  id: string;
  turmaId: string;
  nome?: string;
  conteudo?: string;
  presencas?: Record<string, boolean>;
  createdAt: number;
};

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb; }
  catch { return fb; }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export default function ConteudoDaAulaPage() {
  const { id, chamadaId } = useParams<{ id: string; chamadaId: string }>();
  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [conteudo, setConteudo] = useState("");

  useEffect(() => {
    const arr = readJSON<Chamada[]>(`guieduc:chamadas:${id}`, []);
    const c = arr.find(x => x.id === String(chamadaId)) || null;
    setChamada(c);
    setConteudo(c?.conteudo || "");
  }, [id, chamadaId]);

  function salvar() {
    const key = `guieduc:chamadas:${id}`;
    const arr = readJSON<Chamada[]>(key, []);
    const i = arr.findIndex(x => x.id === String(chamadaId));
    if (i >= 0) {
      arr[i] = { ...arr[i], conteudo };
      writeJSON(key, arr);
      alert("Conteúdo salvo!");
    }
  }

  const back = `/turmas/${id}/chamadas`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conteúdo da aula</h1>
        <Link href={back} className="underline">Voltar</Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-sm text-gray-600 mb-3">
          Turma <b>{id}</b>{chamada?.nome ? <> — Aula: <b>{chamada.nome}</b></> : null}
        </p>

        <label className="block text-sm mb-2">Conteúdo ministrado</label>
        <textarea
          className="input min-h-[180px]"
          value={conteudo}
          onChange={(e)=>setConteudo(e.target.value)}
          placeholder="Ex.: Revisão cap. 3; exercícios 1–10; laboratório..."
        />

        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={salvar}>Salvar conteúdo</button>
          <Link href={back} className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border hover:bg-gray-50">
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
