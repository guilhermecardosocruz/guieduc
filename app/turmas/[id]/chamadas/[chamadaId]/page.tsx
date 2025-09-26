"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Trash2 } from "lucide-react";

type Row = { nome: string; email?: string; presente?: boolean };

export default function EditChamadaPage({ params }: { params: { id: string, chamadaId: string } }) {
  const turmaId = params.id;
  const chamadaId = params.chamadaId;
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [conteudo, setConteudo] = useState<string>("");
  const [alunos, setAlunos] = useState<Row[]>([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/turmas/${turmaId}/chamadas/${chamadaId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Chamada não encontrada");
        const data = await res.json();
        if (!alive) return;
        setDate(new Date(data.chamada.date).toISOString().slice(0,10));
        setConteudo(data.chamada.conteudo ?? "");
        setAlunos((data.itens || []).map((i: any) => ({ nome: i.nome, email: i.email ?? "", presente: !!i.presente })));
      } catch (e:any) {
        if (!alive) return;
        setErr(e.message || "Erro ao carregar chamada");
      }
    })();
    return () => { alive = false; };
  }, [turmaId, chamadaId]);

  function addAluno() { setAlunos((p) => [...p, { nome: "", email: "", presente: true }]); }
  function updateAluno(i: number, patch: Partial<Row>) { setAlunos((p) => p.map((a, idx) => idx === i ? { ...a, ...patch } : a)); }
  function removeAluno(i: number) { setAlunos((p) => p.filter((_, idx) => idx !== i)); }

  function onImportClick() { fileRef.current?.click(); }
  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed: Row[] = rows.map((r) => ({
        nome: String(r.Nome || r.nome || r.aluno || "").trim(),
        email: String(r.Email || r.email || "").trim(),
        presente: true
      })).filter((r) => r.nome.length > 0);
      setAlunos((prev) => {
        const map = new Map<string, Row>();
        [...prev, ...parsed].forEach((a) => map.set(a.nome.toLowerCase(), { ...map.get(a.nome.toLowerCase()), ...a }));
        return Array.from(map.values());
      });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      const payload = { date, conteudo, alunos: alunos.filter(a => a.nome.trim().length > 0) };
      const res = await fetch(`/api/turmas/${turmaId}/chamadas/${chamadaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao salvar alteração");
      window.location.href = `/turmas/${turmaId}/chamadas`;
    } catch (e:any) {
      setErr(e.message || "Erro ao salvar alteração");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Editar Chamada</h1>
          <Link href={`/turmas/${turmaId}/chamadas`} className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <form onSubmit={onSave} className="card space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Data</label>
                <input type="date" className="input" value={date} onChange={(e)=>setDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Conteúdo (opcional)</label>
                <input className="input" value={conteudo} onChange={(e)=>setConteudo(e.target.value)} placeholder="Ex.: Frações..." />
              </div>
            </div>

            {/* Lista SLIM */}
            <div className="rounded-3xl border border-gray-100 bg-white">
              {alunos.length === 0 && (
                <div className="p-4 text-gray-500">Nenhum aluno nesta chamada. Use os botões abaixo.</div>
              )}
              <ul className="divide-y">
                {alunos.map((a, i) => (
                  <li key={i} className="px-4 py-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={()=>removeAluno(i)}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label={`Remover ${a.nome || "aluno"}`}
                      title="Remover aluno"
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
                      className="bg-transparent outline-none border-b border-gray-200 focus:border-blue-500 py-1 text-sm w-40 sm:w-56"
                      placeholder="Email (opcional)"
                      value={a.email || ""}
                      onChange={(e)=>updateAluno(i, { email: e.target.value })}
                    />

                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={a.presente ?? true}
                      onChange={(e)=>updateAluno(i, { presente: e.target.checked })}
                      aria-label={`Presença de ${a.nome || "aluno"}`}
                      title="Presença"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-primary" onClick={addAluno}>Adicionar aluno</button>
              <button type="button" className="btn-primary" onClick={onImportClick}>Importar do Excel</button>
              <a href="/api/samples/alunos-exemplo" className="underline text-sm">Baixar modelo Excel</a>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileSelected} />
              <div className="ms-auto"></div>
              <button className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
