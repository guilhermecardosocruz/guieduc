"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { addConteudo } from "@/lib/storage";

export default function NovoConteudoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    aula: "" as unknown as number | string,
    titulo: "",
    conteudo: "",
    objetivos: "",
    desenvolvimento: "",
    recursos: "",
    bncc: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v });
  }

  return (
    <div className="max-w-2xl w-full mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button className="rounded-full bg-blue-600 text-white px-4 py-2" onClick={()=>router.back()}>
          Voltar
        </button>
        <h1 className="text-xl font-semibold">Novo conteúdo</h1>
      </div>

      <label className="block text-sm font-medium">Aula</label>
      <input
        type="number"
        className="w-full rounded-xl border px-3 py-2"
        value={form.aula as any}
        onChange={(e)=>set("aula", Number(e.target.value || 0))}
      />

      <label className="block text-sm font-medium">Título</label>
      <input
        className="w-full rounded-xl border px-3 py-2"
        value={form.titulo}
        onChange={(e)=>set("titulo", e.target.value)}
      />

      <label className="block text-sm font-medium">Conteúdo da Aula</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-28"
        value={form.conteudo}
        onChange={(e)=>set("conteudo", e.target.value)}
      />

      <label className="block text-sm font-medium">Objetivos</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-24"
        value={form.objetivos}
        onChange={(e)=>set("objetivos", e.target.value)}
      />

      <label className="block text-sm font-medium">Desenvolvimento das Atividades</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-24"
        value={form.desenvolvimento}
        onChange={(e)=>set("desenvolvimento", e.target.value)}
      />

      <label className="block text-sm font-medium">Recursos Didáticos</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-24"
        value={form.recursos}
        onChange={(e)=>set("recursos", e.target.value)}
      />

      <label className="block text-sm font-medium">BNCC</label>
      <input
        className="w-full rounded-xl border px-3 py-2"
        value={form.bncc}
        onChange={(e)=>set("bncc", e.target.value)}
      />

      <div className="pt-2">
        <button
          className="rounded-xl bg-blue-600 text-white px-4 py-2"
          onClick={()=>{
            addConteudo(id, {
              aula: Number(form.aula || 0),
              titulo: form.titulo,
              conteudo: form.conteudo,
              objetivos: form.objetivos,
              desenvolvimento: form.desenvolvimento,
              recursos: form.recursos,
              bncc: form.bncc,
            });
            router.back();
          }}
        >
          Salvar conteúdo
        </button>
      </div>
    </div>
  );
}
