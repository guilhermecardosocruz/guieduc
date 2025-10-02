"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Chamada = {
  id: string;
  turmaId: string;
  numero?: number;              // <- numeração estável
  nome?: string;
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
  const base = `/turmas/${id}`;

  const [ordem, setOrdem] = useState<"asc" | "desc">("asc");
  const [itens, setItens] = useState<Chamada[]>([]);

  // migra numeros quando faltarem (1..n por createdAt asc), sem mexer no layout
  function migrateNumeros(arr: Chamada[]): Chamada[] {
    if (!arr.length) return arr;
    if (arr.every(c => typeof c.numero === "number" && c.numero! > 0)) return arr;
    const byCreated = [...arr].sort((a,b) => a.createdAt - b.createdAt);
    byCreated.forEach((c, i) => { if (!c.numero || c.numero <= 0) c.numero = i + 1; });
    return byCreated;
  }

  function carregar() {
    const key = `guieduc:chamadas:${id}`;
    let arr = readJSON<Chamada[]>(key, []);
    const migrated = migrateNumeros(arr);
    if (migrated !== arr) writeJSON(key, migrated);
    setItens(migrated);
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
    const r = [...itens];
    r.sort((a,b) => ordem === "asc" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
    return r;
  }, [itens, ordem]);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <Link href={base} className="underline">Voltar para Turma</Link>
        <Link href={`${base}/chamadas/nova`} className="btn-primary">Adicionar chamada</Link>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Ordenar:</label>
        <select
          value={ordem}
          onChange={(e)=>setOrdem(e.target.value as any)}
          className="input"
        >
          <option value="asc">Crescente (mais antiga → nova)</option>
          <option value="desc">Decrescente (mais nova → antiga)</option>
        </select>
      </div>

      {ordenadas.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhuma chamada criada.</p>
      ) : (
        <ul className="space-y-3">
          {ordenadas.map(c => (
            <li key={c.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                  {c.numero ?? "—"}
                </span>
                <Link href={`${base}/chamadas/${c.id}`} className="truncate underline">
                  {c.nome || "Sem título"}
                </Link>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
