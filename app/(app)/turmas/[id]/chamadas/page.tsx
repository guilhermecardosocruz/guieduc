"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Chamada = {
  id: string;
  turmaId: string;
  numero?: number;        // <- numeração estável
  nome?: string;
  conteudo?: string;
  presencas?: Record<string, boolean>;
  createdAt: number;
};

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fb; }
  catch { return fb; }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export default function ChamadasHomePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const base = `/turmas/${id}`;

  const [ordem, setOrdem] = useState<"asc" | "desc">("desc");
  const [itens, setItens] = useState<Chamada[]>([]);

  // migra números quando faltarem (1..n por createdAt asc)
  function migrateNumeroIfNeeded(arr: Chamada[]): Chamada[] {
    if (!arr.length) return arr;
    if (arr.every(c => typeof c.numero === "number" && c.numero! > 0)) return arr;

    const byCreated = [...arr].sort((a,b) => a.createdAt - b.createdAt);
    byCreated.forEach((c, idx) => { if (!c.numero || c.numero <= 0) c.numero = idx + 1; });
    return byCreated;
  }

  function carregar() {
    const key = `guieduc:chamadas:${id}`;
    let arr = readJSON<Chamada[]>(key, []);
    const migrated = migrateNumeroIfNeeded(arr);
    if (migrated !== arr) {
      // se mudou algo, salva de volta
      writeJSON(key, migrated);
      arr = migrated;
    }
    setItens(arr);
  }

  useEffect(() => {
    carregar();
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes(`guieduc:chamadas:${id}`)) carregar();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  const ordenadas = useMemo(() => {
    const clone = [...itens];
    clone.sort((a, b) => ordem === "asc" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
    return clone;
  }, [itens, ordem]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Chamadas</h2>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center rounded-2xl border px-3 py-1.5 text-sm hover:bg-gray-50"
            onClick={() => setOrdem(o => (o === "asc" ? "desc" : "asc"))}
            title="Alternar ordem (antigas/novas)"
          >
            {ordem === "asc" ? "Antigas → Novas" : "Novas → Antigas"}
          </button>
          <Link href={`${base}/chamadas/nova`} className="btn-primary">Adicionar chamada</Link>
        </div>
      </div>

      {ordenadas.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhuma chamada criada ainda.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ordenadas.map(c => (
            <li key={c.id} className="rounded-2xl border border-gray-100 p-4 bg-white">
              <div className="text-sm text-gray-500 mb-1">Aula {c.numero ?? "—"}</div>
              <div className="font-medium truncate mb-3">{c.nome || "Sem nome"}</div>
              <Link
                href={`${base}/chamadas/${c.id}`}
                className="inline-flex items-center justify-center rounded-2xl border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Editar chamada
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
