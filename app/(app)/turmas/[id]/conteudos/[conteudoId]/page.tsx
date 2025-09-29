"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getConteudo, updateConteudoAndChamadas, type Conteudo } from "@/lib/storage";

export default function EditarConteudoPage() {
  const { id: turmaId, conteudoId } = useParams<{ id: string; conteudoId: string }>();
  const [model, setModel] = useState<Conteudo | null>(null);

  useEffect(() => {
    setModel(getConteudo(turmaId, conteudoId));
  }, [turmaId, conteudoId]);

  function onSave() {
    if (!model) return;
    const titulo = model.titulo.trim();
    if (!titulo) return alert("Informe o título.");
    updateConteudoAndChamadas(turmaId, { ...model, titulo, descricao: model.descricao.trim() });
    alert("Conteúdo atualizado!");
    if (typeof window !== "undefined") window.location.href = `/turmas/${turmaId}/conteudos`;
  }

  if (!model) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-sm text-gray-500">Carregando ou conteúdo não encontrado…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-4">
        <a href={`/turmas/${turmaId}/conteudos`} className="underline text-sm">Voltar para Conteúdos</a>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input className="input" value={model.titulo} onChange={(e)=>setModel({...model!, titulo: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Descrição</label>
          <input className="input" value={model.descricao} onChange={(e)=>setModel({...model!, descricao: e.target.value})} />
        </div>
      </div>

      <div className="mt-4">
        <button onClick={onSave} className="btn-primary">Salvar alterações</button>
      </div>
    </div>
  );
}
