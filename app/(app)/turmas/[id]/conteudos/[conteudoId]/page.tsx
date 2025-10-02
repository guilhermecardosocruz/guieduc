"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getConteudo, updateConteudo, removeConteudo, type Conteudo } from "@/lib/storage";

export default function EditConteudoPage() {
  const { id, conteudoId } = useParams<{ id: string; conteudoId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Conteudo | null>(null);

  useEffect(()=>{
    const c = getConteudo(id, conteudoId);
    if (c) setForm(c);
  },[id, conteudoId]);

  function set<K extends keyof Conteudo>(k: K, v: Conteudo[K]) {
    if (!form) return;
    setForm({ ...form, [k]: v });
  }
  function salvar() {
    if (!form) return;
    updateConteudo(id, conteudoId, form);
    router.push(`/turmas/${id}/conteudos`);
  }
  function excluir() {
    if (confirm("Excluir este conteúdo?")) {
      removeConteudo(id, conteudoId);
      router.push(`/turmas/${id}/conteudos`);
    }
  }

  if (!form) return <p className="text-sm text-gray-500">Carregando…</p>;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={()=>router.push(`/turmas/${id}/conteudos`)} className="btn-primary">Voltar</button>
        <button onClick={excluir} className="rounded-2xl border px-4 py-2 text-red-600 hover:bg-red-50">Excluir</button>
      </div>

      <div className="grid gap-4">
        <div><label className="block text-sm mb-1">Aula</label>
          <input className="input" value={form.aula} onChange={e=>set("aula", e.target.value)} />
        </div>
        <div><label className="block text-sm mb-1">Título</label>
          <input className="input" value={form.titulo} onChange={e=>set("titulo", e.target.value)} />
        </div>
        <div><label className="block text-sm mb-1">Conteúdo da Aula</label>
          <textarea className="input min-h-24" value={form.conteudoAula} onChange={e=>set("conteudoAula", e.target.value)} />
        </div>
        <div><label className="block text-sm mb-1">Objetivos</label>
          <textarea className="input min-h-24" value={form.objetivos} onChange={e=>set("objetivos", e.target.value)} />
        </div>
        <div><label className="block text-sm mb-1">Desenvolvimento das Atividades</label>
          <textarea className="input min-h-28" value={form.desenvolvimento} onChange={e=>set("desenvolvimento", e.target.value)} />
        </div>
        <div><label className="block text-sm mb-1">Recursos Didáticos</label>
          <textarea className="input min-h-20" value={form.recursos} onChange={e=>set("recursos", e.target.value)} />
        </div>
        <div><label className="block text-sm mb-1">BNCC</label>
          <textarea className="input min-h-16" value={form.bncc} onChange={e=>set("bncc", e.target.value)} />
        </div>

        <div className="flex gap-3">
          <button onClick={salvar} className="btn-primary">Salvar alterações</button>
          <button onClick={()=>router.push(`/turmas/${id}/conteudos`)} className="rounded-2xl border px-4 py-2 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
