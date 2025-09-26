"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Trash2 } from "lucide-react";

type NovoAluno = { nome: string; email?: string; presente?: boolean };

export default function NovaChamadaPage({ params }: { params: { id: string } }) {
  const { id: turmaId } = params;
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [conteudo, setConteudo] = useState<string>("");
  const [alunos, setAlunos] = useState<NovoAluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/turmas/${turmaId}/alunos`, { cache: "no-store" });
      const data = res.ok ? await res.json() : { alunos: [] };
      setAlunos((data.alunos || []).map((a: any) => ({ nome: a.nome, email: a.email ?? "", presente: true })));
    })();
  }, [turmaId]);

  function addAluno() { setAlunos((prev) => [...prev, { nome: "", email: "", presente: true }]); }
  function updateAluno(i: number, patch: Partial<NovoAluno>) {
    setAlunos((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeAluno(i: number) { setAlunos((prev) => prev.filter((_, idx) => idx !== i)); }

  function onImportClick() { fileRef.current?.click(); }
  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed: NovoAluno[] = rows.map((r) => ({
        nome: String(r.Nome || r.nome || r.aluno || "").trim(),
        email: String(r.Email || r.email || "").trim(),
        presente: true
      })).filter((r) => r.nome.length > 0);
      setAlunos((prev) => {
        const map = new Map<string, NovoAluno>();
        [...prev, ...parsed].forEach((a) => {
          const key = a.nome.toLowerCase();
          map.set(key, { ...map.get(key), ...a });
        });
        return Array.from(map.values());
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const payload = { date, conteudo, alunos: alunos.filter(a => a.nome.trim().length > 0) };
      const res = await fetch(`/api/turmas/${turmaId}/chamadas`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao salvar chamada");
      window.location.href = `/turmas/${turmaId}/chamadas`;
    } catch (e:any) {
      setErr(e.message || "Erro ao salvar chamada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Nova Chamada</h1>
          <Link href={`/turmas/${turmaId}/chamadas`} className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <form onSubmit={onSubmit} className="card space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Data</label>
                <input type="date" className="input" value={date} onChange={(e)=>setDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Conteúdo (opcional)</label>
                <input className="input" placeholder="Ex.: Frações, Revolução Industrial..." value={conteudo} onChange={(e)=>setConteudo(e.target.value)} />
              </div>
            </div>

            {/* Lista SLIM */}
            <div className="rounded-3xl border border-gray-100 bg-white">
              {alunos.length === 0 && (
                <div className="p-4 text-gray-500">Nenhum aluno. Use os botões abaixo para adicionar ou importar.</div>
              )}
              <ul className="divide-y">
                {alunos.map((a, i) => (
                  <li key={i} className="px-4 py-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={()=>removeAluno(i)}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label={`Remover ${a.nome || "aluno"}`} title="Remover aluno"
                    >
                      <Trash2 size={16} />
                    </button>
                    <input
                      className="flex-1 bg-transparent outline-none border-b border-gray-200 focus:border-blue-500 py-1 text-sm"
                      placeholder="Nome do aluno"
                      value={a.nome}
                      onChange={(e)=>updateAluno(i, { nome: e.target.value })}
                    />
                    <input
                      type="checkbox" className="h-4 w-4"
                      checked={a.presente ?? true}
                      onChange={(e)=>updateAluno(i, { presente: e.target.checked })}
                      aria-label={`Presença de ${a.nome || "aluno"}`} title="Presença"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações — ordem e largura conforme pedido */}
            <div className="space-y-3">
              {/* 1) Salvar Chamada — full width */}
              <button className="btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Chamada"}
              </button>

              {/* 2) Adicionar aluno — full width */}
              <button type="button" className="btn-primary w-full py-3 text-base" onClick={addAluno}>
                Adicionar aluno
              </button>

              {/* 3) Importar + Modelo — lado a lado, sem quebra */}
              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  type="button"
                  className="btn-primary flex items-center gap-1.5 whitespace-nowrap"
                  onClick={onImportClick}
                >
                  {/* ícone "importar" simples */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M20 21H4" /></svg>
                  Importar do Excel
                </button>

                <a
                  href="/api/samples/alunos-exemplo"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 whitespace-nowrap"
                >
                  {/* ícone "arquivo" */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4z"/><path d="M14 4v6h6"/></svg>
                  Modelo Excel
                </a>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={onFileSelected}
                />
              </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
