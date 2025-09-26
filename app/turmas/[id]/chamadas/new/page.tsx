"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function NovaChamadaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const turmaId = params.id;
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10)); // yyyy-mm-dd
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`/api/turmas/${turmaId}/chamadas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, notes })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao salvar chamada");
      router.push(`/turmas/${turmaId}`);
    } catch (e: any) {
      setErr(e.message || "Erro ao salvar chamada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Nova Chamada</h1>
          <Link href={`/turmas/${turmaId}`} className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <form onSubmit={onSubmit} className="card space-y-4">
            <div>
              <label className="block text-sm mb-1">Data</label>
              <input type="date" className="input" value={date} onChange={(e)=>setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Observações (opcional)</label>
              <textarea className="input min-h-24" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Ex.: Aula de revisão, avaliação, etc." />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar Chamada"}</button>
          </form>
        </div>
      </main>
    </div>
  );
}
