"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Trash2, FileSpreadsheet, Upload } from "lucide-react";

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
        [...prev, ...parsed].forEach((a) => map.set(a.nome.toLowerCase(), { ...map.get(a.nome.toLowerCase()), ...a }));
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

            {/* Lista SLIM (sem e-mail) */}
            <div className="rounded-3xl border border-gray-100 bg-white">
              {alunos.length === 0 && (
                <div className="p-4 text-gray-500">Nenhum aluno. Use os botões abaixo para adicionar ou importar.</div>
              )}
              <ul className="divide-y">
                {alunos.map((a, i) => (
                  <li key={i} className="px-4 py-2 flex items-center gap-3">
                    {/* Lixeira antes do nome */}
                    <button
                      type="button"
                      onClick={()=>removeAluno(i)}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label={`Remover ${a.nome || "aluno"}`} title="Remover aluno"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Nome: linha inferior */}
                    <input
                      className="flex-1 bg-transparent outline-none border-b border-gray-200 focus:border-blue-500 py-1 text-sm"
                      placeholder="Nome do aluno"
                      value={a.nome}
                      onChange={(e)=>updateAluno(i, { nome: e.target.value })}
                    />

                    {/* Presença: só o marcador */}
                    <input
                      type="checkbox" className="h-4 w-4" checked={a.presente ?? true}
                      onChange={(e)=>updateAluno(i, { presente: e.target.checked })}
                      aria-label={`Presença de ${a.nome || "aluno"}`} title="Presença"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações: grupo de Excel + adicionar, e botão full-width */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-primary" onClick={addAluno}>Adicionar aluno</button>

                {/* Grupo Excel */}
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-primary flex items-center gap-1.5" onClick={onImportClick}>
                    <Upload size={16}/> Importar do Excel
                  </button>
                  <a href="/api/samples/alunos-exemplo" className="inline-flex items-center gap-1.5 underline text-sm">
                    <FileSpreadsheet size={16}/> Modelo Excel
                  </a>
                </div>

                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileSelected} />
              </div>

              {/* Salvar: full width */}
              <button className="btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Chamada"}
              </button>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
