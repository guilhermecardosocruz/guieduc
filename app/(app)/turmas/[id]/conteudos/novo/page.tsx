"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { addConteudo } from "@/lib/storage";

export default function NovoConteudoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    aula: "",
    titulo: "",
    conteudoAula: "",
    objetivos: "",
    desenvolvimento: "",
    recursos: "",
    bncc: ""
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({...prev, [k]: v}));
  }

  function salvar() {
    addConteudo(id, form);
    router.push(`/turmas/${id}/conteudos`);
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={()=>router.push(`/turmas/${id}/conteudos`)} className="btn-primary">Voltar</button>
      </div>

      <div className="grid gap-4">
        <div><label className="block text-sm mb-1">Aula</label>
          <input className="input" value={form.aula} onChange={e=>set("aula", e.target.value)} placeholder="Ex.: Aula 1 / 02/10" />
        </div>
        <div><label className="block text-sm mb-1">Título</label>
          <input className="input" value={form.titulo} onChange={e=>set("titulo", e.target.value)} placeholder="Ex.: Frações — revisão" />
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
          <textarea className="input min-h-16" value={form.bncc} onChange={e=>set("bncc", e.target.value)} placeholder="Ex.: EF06MA02, EF06MA07..." />
        </div>

        <div className="flex gap-3">
          <button onClick={salvar} className="btn-primary">Salvar conteúdo</button>
          <button onClick={()=>router.push(`/turmas/${id}/conteudos`)} className="rounded-2xl border px-4 py-2 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
