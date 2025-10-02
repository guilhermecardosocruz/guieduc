"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getConteudo,
  updateConteudo,
  removeConteudo,
  type Conteudo,
} from "@/lib/storage";

export default function EditarConteudoPage() {
  const { id, conteudoId } = useParams<{ id: string; conteudoId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Conteudo | null>(null);

  useEffect(() => {
    const c = getConteudo(id, conteudoId);
    setForm(c);
  }, [id, conteudoId]);

  function set<K extends keyof Conteudo>(key: K, value: Conteudo[K]) {
    if (!form) return;
    setForm({ ...form, [key]: value });
  }

  if (!form) return <div className="p-6">Carregando...</div>;

  return (
    <div className="max-w-2xl w-full mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          className="rounded-full bg-blue-600 text-white px-4 py-2"
          onClick={() => router.back()}
        >
          Voltar
        </button>
        <h1 className="text-xl font-semibold">Conteúdo — Aula {form.aula}</h1>
      </div>

      <label className="block text-sm font-medium">Aula</label>
      <input
        type="number"
        className="w-full rounded-xl border px-3 py-2"
        value={form.aula}
        onChange={(e) => set("aula", Number(e.target.value || 0))}
      />

      <label className="block text-sm font-medium">Título</label>
      <input
        className="w-full rounded-xl border px-3 py-2"
        value={form.titulo}
        onChange={(e) => set("titulo", e.target.value)}
      />

      <label className="block text-sm font-medium">Conteúdo da Aula</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-28"
        value={form.conteudo}
        onChange={(e) => set("conteudo", e.target.value)}
      />

      <label className="block text-sm font-medium">Objetivos</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-24"
        value={form.objetivos}
        onChange={(e) => set("objetivos", e.target.value)}
      />

      <label className="block text-sm font-medium">Desenvolvimento das Atividades</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-24"
        value={form.desenvolvimento}
        onChange={(e) => set("desenvolvimento", e.target.value)}
      />

      <label className="block text-sm font-medium">Recursos Didáticos</label>
      <textarea
        className="w-full rounded-xl border px-3 py-2 min-h-24"
        value={form.recursos}
        onChange={(e) => set("recursos", e.target.value)}
      />

      <label className="block text-sm font-medium">BNCC</label>
      <input
        className="w-full rounded-xl border px-3 py-2"
        value={form.bncc}
        onChange={(e) => set("bncc", e.target.value)}
      />

      <div className="flex gap-3 pt-2">
        <button
          className="rounded-xl bg-blue-600 text-white px-4 py-2"
          onClick={() => {
            updateConteudo(id, form.id, {
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
          Salvar alterações
        </button>

        <button
          className="rounded-xl border border-red-300 text-red-600 px-4 py-2"
          onClick={() => {
            if (confirm("Excluir este conteúdo?")) {
              removeConteudo(id, form.id);
              router.back();
            }
          }}
        >
          Excluir conteúdo
        </button>
      </div>
    </div>
  );
}
