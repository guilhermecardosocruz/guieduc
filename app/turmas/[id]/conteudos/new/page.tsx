"use client";

import Link from "next/link";
import { useState } from "react";

export default function NovaAulaPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [numero, setNumero] = useState<string>("");
  const [titulo, setTitulo] = useState<string>("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const n = Number(numero);
      if (!Number.isFinite(n) || n <= 0 || titulo.trim().length === 0) {
        throw new Error("Informe um número válido e um título.");
      }
      const res = await fetch(`/api/turmas/${id}/conteudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: n, titulo: titulo.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao salvar");
      window.location.href = `/turmas/${id}/conteudos`;
    } catch (e:any) {
      setErr(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Adicionar aula</h1>
          <Link href={`/turmas/${id}/conteudos`} className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <form onSubmit={onSubmit} className="card space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Número da aula</label>
                <input
                  inputMode="numeric"
                  className="input"
                  placeholder="Ex.: 1"
                  value={numero}
                  onChange={(e)=>setNumero(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Título da aula</label>
                <input
                  className="input"
                  placeholder="Ex.: Introdução"
                  value={titulo}
                  onChange={(e)=>setTitulo(e.target.value)}
                  required
                />
              </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary w-full py-3 text-base" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Aula"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
