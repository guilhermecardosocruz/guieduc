"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

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

  function addAluno() {
    setAlunos((prev) => [...prev, { nome: "", email: "", presente: true }]);
  }
  function updateAluno(i: number, patch: Partial<NovoAluno>) {
    setAlunos((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeAluno(i: number) {
    setAlunos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onImportClick() {
    fileRef.current?.click();
  }
  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      const payload = {
        date,
        conteudo,
        alunos: alunos.filter(a => a.nome.trim().length > 0)
      };
      const res = await fetch(`/api/turmas/${turmaId}/chamadas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
          <form onSubmit={onSubmit} className="card space-y-5">
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

            {/* Lista de alunos */}
            <div className="rounded-3xl border border-gray-100 bg-white divide-y">
              {alunos.length === 0 && (
                <div className="p-4 text-gray-500">Nenhum aluno. Use os botões abaixo para adicionar ou importar.</div>
              )}
              {alunos.map((a, i) => (
                <div key={i} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    className="input sm:flex-1"
                    placeholder="Nome do aluno"
                    value={a.nome}
                    onChange={(e)=>updateAluno(i, { nome: e.target.value })}
                  />
                  <input
                    className="input sm:flex-1"
                    placeholder="Email (opcional)"
                    value={a.email || ""}
                    onChange={(e)=>updateAluno(i, { email: e.target.value })}
                  />
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={a.presente ?? true} onChange={(e)=>updateAluno(i, { presente: e.target.checked })} />
                    Presente
                  </label>
                  <button type="button" onClick={()=>removeAluno(i)} className="underline text-sm">Remover</button>
                </div>
              ))}
            </div>

            {/* Botões abaixo da lista */}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-primary" onClick={()=>addAluno()}>Adicionar aluno</button>
              <button type="button" className="btn-primary" onClick={()=>onImportClick()}>Importar do Excel</button>
              <a href="/api/samples/alunos-exemplo" className="underline text-sm">Baixar modelo Excel</a>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileSelected} />
              <div className="ms-auto"></div>
              <button className="btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar Chamada"}</button>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
