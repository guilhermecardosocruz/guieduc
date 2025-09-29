"use client";
import { useState } from "react";

export default function NovaTurmaForm({ onAdd }: { onAdd: (nome: string) => Promise<void> | void }) {
  const [nome, setNome] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const clean = nome.trim();
    if (clean.length < 2) {
      setErr("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await onAdd(clean);
      setNome("");
    } catch (e) {
      setErr("Não foi possível adicionar a turma.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mb-6">
      <h3 className="text-lg font-semibold mb-2">Nova turma</h3>
      <p className="text-sm text-gray-500 mb-4">Crie uma turma para organizar seus alunos/aulas.</p>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Ex.: 3º Ano A (manhã)"
          value={nome}
          onChange={(e)=>setNome(e.target.value)}
        />
        <button className="btn-primary whitespace-nowrap" disabled={loading}>
          {loading ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </form>
  );
}
