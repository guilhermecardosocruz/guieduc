"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { listConteudos, addConteudosCSV, type Conteudo } from "@/lib/storage";

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;
  const [items, setItems] = useState<Conteudo[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setItems(listConteudos(id)); }, [id]);

  async function onImportCSV(file: File) {
    const text = await file.text();
    const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    let start = 0;
    const header = lines[0]?.toLowerCase().replace(/;/g, ",") || "";
    if (header.includes("titulo") || header.includes("título")) start = 1;
    const pares = lines.slice(start).map(l => {
      const [t, d] = l.split(/[;,]/);
      return { titulo: (t||"").trim(), descricao: (d||"").trim() };
    });
    addConteudosCSV(id, pares);
    setItems(listConteudos(id));
    if (fileRef.current) fileRef.current.value = "";
    alert(`${pares.filter(p=>p.titulo).length} conteúdo(s) importado(s)`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <a href={`${base}/conteudos/novo`} className="btn-primary">Adicionar conteúdo</a>
        <label className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border cursor-pointer hover:bg-gray-50">
          Adicionar conteúdos (CSV)
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onImportCSV(f); }} />
        </label>
        <a href="/templates/modelo-conteudos.csv" className="underline text-sm" target="_blank" rel="noreferrer">planilha padrão</a>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Conteúdos cadastrados ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum conteúdo cadastrado.</p>
        ) : (
          <ul className="divide-y rounded-2xl border border-gray-100 bg-white">
            {items.map(c => (
              <li key={c.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.titulo}</div>
                    {c.descricao && <div className="text-sm text-gray-600 truncate">{c.descricao}</div>}
                  </div>
                  <a href={`${base}/conteudos/${c.id}`} className="text-sm underline shrink-0">Editar</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
