"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  listConteudos,
  addConteudosCSV,
  addConteudosXLSX,
  type Conteudo
} from "@/lib/storage";

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Conteudo[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function refresh() { setItems(listConteudos(id)); }
  useEffect(()=>{ refresh(); }, [id]);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (/\.(xlsx?)$/i.test(f.name)) {
        await addConteudosXLSX(id, f);
      } else {
        await (async()=>{const txt=await f.text(); await addConteudosCSV(id, txt)})();
      }
      refresh();
      alert("Conteúdos importados!");
    } catch (err:any) {
      alert("Erro ao importar: " + (err?.message || String(err)));
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={()=>router.push(`/turmas/${id}`)} className="btn-primary">Voltar para Turma</button>
        <div className="flex gap-3">
          <Link href={`/turmas/${id}/conteudos/novo`} className="btn-primary">Adicionar conteúdo</Link>
          <label className="inline-flex items-center rounded-2xl border px-4 py-2 cursor-pointer hover:bg-gray-50">
            Importar (CSV/XLSX)
            <input ref={fileRef} onChange={onImport} type="file" accept=".csv,.xlsx" hidden />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Conteúdos cadastrados</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum conteúdo ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map(c=>(
              <li key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.titulo || "(Sem título)"}</div>
                  <div className="text-xs text-gray-500">
                    Aula: {c.aula || "—"} · BNCC: {c.bncc || "—"}
                  </div>
                </div>
                <Link href={`/turmas/${id}/conteudos/${c.id}`} className="underline text-sm">Editar</Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 text-sm">
          <div className="text-gray-500 mb-1">Planilhas modelo:</div>
          <div className="flex gap-6">
            <a href="/templates/conteudos.csv" className="underline">conteúdos (CSV)</a>
            <a href="/templates/conteudos.xlsx" className="underline">conteúdos (XLSX)</a>
          </div>
        </div>
      </div>
    </div>
  );
}
