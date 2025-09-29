"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { listConteudos, addConteudosCSV, type Conteudo } from "@/lib/storage";
import { parseConteudosFile } from "@/lib/xls";

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;
  const [items, setItems] = useState<Conteudo[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setItems(listConteudos(id)); }, [id]);

  async function onImport(file: File) {
    const pares = await parseConteudosFile(file);
    addConteudosCSV(id, pares);
    setItems(listConteudos(id));
    if (fileRef.current) fileRef.current.value = "";
    alert(`${pares.length} conteúdo(s) importado(s)`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <a href={`${base}/conteudos/novo`} className="btn-primary">Adicionar conteúdo</a>
        <label className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border cursor-pointer hover:bg-gray-50">
          Adicionar conteúdos (CSV/XLSX)
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onImport(f); }}
          />
        </label>
        <div className="flex items-center gap-3 text-sm">
          <a href="/templates/modelo-conteudos.csv" className="underline" target="_blank" rel="noreferrer">planilha padrão (CSV)</a>
          <span className="text-gray-300">|</span>
          <a href="/templates/modelo-conteudos.xlsx" className="underline" target="_blank" rel="noreferrer">planilha padrão (XLSX)</a>
        </div>
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
