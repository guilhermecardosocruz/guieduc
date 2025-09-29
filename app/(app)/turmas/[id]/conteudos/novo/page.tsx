"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { addConteudo } from "@/lib/storage";

export default function NovoConteudoPage() {
  const { id } = useParams<{ id: string }>();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  function onSalvar() {
    const t = titulo.trim();
    if (!t) return alert("Informe o título.");
    addConteudo(id, { titulo: t, descricao: descricao.trim() });
    alert("Conteúdo salvo!");
    if (typeof window !== "undefined") window.location.href = `/turmas/${id}/conteudos`;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-4">
        <a href={`/turmas/${id}/conteudos`} className="underline text-sm">Voltar para Conteúdos</a>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input className="input" value={titulo} onChange={(e)=>setTitulo(e.target.value)} placeholder="Ex.: Frações — revisão" />
        </div>
        <div>
          <label className="block text-sm mb-1">Descrição</label>
          <input className="input" value={descricao} onChange={(e)=>setDescricao(e.target.value)} placeholder="(opcional)" />
        </div>
      </div>

      <div className="mt-4">
        <button onClick={onSalvar} className="btn-primary">Salvar conteúdo</button>
      </div>
    </div>
  );
}
