"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
type Turma = { id: string; name: string; createdAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function fakeLogout() { router.push("/login"); }

  async function loadTurmas() {
    try {
      const res = await fetch("/api/turmas", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setTurmas(data.turmas as Turma[]);
    } catch (e) { console.error(e); }
  }
  useEffect(() => { loadTurmas(); }, []);

  async function onCreateTurma(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await fetch("/api/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao criar turma");
      setName(""); await loadTurmas();
    } catch (e:any) { setErr(e.message || "Erro ao criar turma"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Brand />
          <button onClick={fakeLogout} className="btn-primary">Sair</button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Turmas</h1>
          <p className="text-gray-600 mb-6">Crie turmas e clique nos cards para abrir.</p>

          <form onSubmit={onCreateTurma} className="card mb-6">
            <label className="block text-sm mb-2">Nome da turma</label>
            <div className="flex gap-2">
              <input className="input" placeholder="Ex.: 7º Ano A - 2025" value={name} onChange={(e)=>setName(e.target.value)} />
              <button className="btn-primary whitespace-nowrap" disabled={loading}>{loading ? "Criando..." : "Criar Turma"}</button>
            </div>
            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          </form>

          {turmas.length === 0 ? (
            <p className="text-gray-500">Nenhuma turma criada ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {turmas.map((t) => (
                <Link key={t.id} href={`/turmas/${t.id}`} className="rounded-3xl border border-gray-100 p-6 bg-white hover:shadow transition block">
                  <div className="text-sm text-gray-400">Criada em {new Date(t.createdAt).toLocaleDateString("pt-BR")}</div>
                  <div className="mt-1 text-lg font-semibold">{t.name}</div>
                  <div className="mt-2 text-[13px] underline">Abrir</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-gray-500">© GUIEDUC — multiplataforma (Web / Android / iOS)</div>
      </footer>
    </div>
  );
}
