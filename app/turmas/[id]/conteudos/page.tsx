"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload, Plus } from "lucide-react";

type Aula = { id: string; numero: number; titulo: string };

export default function ConteudosPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [turma, setTurma] = useState<any>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [err, setErr] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [tRes, aRes] = await Promise.all([
          fetch(`/api/turmas/${id}`, { cache: "no-store" }),
          fetch(`/api/turmas/${id}/conteudos`, { cache: "no-store" })
        ]);
        if (!tRes.ok) throw new Error("Turma não encontrada");
        const tData = await tRes.json();
        const aData = aRes.ok ? await aRes.json() : { aulas: [] };
        if (!alive) return;
        setTurma(tData.turma);
        setAulas(aData.aulas ?? []);
      } catch (e:any) {
        if (!alive) return;
        setErr(e.message || "Erro ao carregar conteúdos");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  function onImportClick() { fileRef.current?.click(); }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const aulas = rows
          .map((r) => ({
            numero: Number(r.Numero ?? r.numero),
            titulo: String(r.Titulo ?? r.titulo ?? "").trim(),
          }))
          .filter((r) => Number.isFinite(r.numero) && r.titulo.length > 0);

        const res = await fetch(`/api/turmas/${id}/conteudos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aulas })
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Erro ao importar");
        }
        // recarrega lista
        const aRes = await fetch(`/api/turmas/${id}/conteudos`, { cache: "no-store" });
        const aData = aRes.ok ? await aRes.json() : { aulas: [] };
        setAulas(aData.aulas ?? []);
      };
      reader.readAsArrayBuffer(file);
    } catch (e:any) {
      setErr(e.message || "Erro ao importar");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Conteúdos</h1>
          <Link href={`/turmas/${id}`} className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
          {turma && <h2 className="text-2xl font-semibold">Turma — {turma.name}</h2>}
          {err && <p className="text-red-600">{err}</p>}

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/turmas/${id}/conteudos/new`} className="btn-primary flex items-center gap-1.5">
              <Plus size={16}/> Adicionar aula
            </Link>

            {/* Grupo Excel: Importar + Modelo */}
            <div className="flex items-center gap-2">
              <button type="button" className="btn-primary flex items-center gap-1.5" onClick={onImportClick} disabled={importing}>
                <Upload size={16}/> {importing ? "Importando..." : "Importar do Excel"}
              </button>
              <a href="/api/samples/aulas-exemplo" className="inline-flex items-center gap-1.5 underline text-sm">
                <FileSpreadsheet size={16}/> Modelo Excel
              </a>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileSelected} />
            </div>
          </div>

          {/* Lista de Aulas */}
          <div className="rounded-3xl border border-gray-100 bg-white">
            {aulas.length === 0 ? (
              <div className="p-4 text-gray-500">Nenhuma aula cadastrada ainda.</div>
            ) : (
              <ul className="divide-y">
                {aulas.map((a) => (
                  <li key={a.id} className="px-4 py-2 flex items-center justify-between">
                    <div className="truncate">
                      <span className="text-sm font-medium">Aula {a.numero}</span>
                      <span className="text-sm text-gray-600"> — {a.titulo}</span>
                    </div>
                    {/* lugar futuro para editar/excluir se quiser */}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
