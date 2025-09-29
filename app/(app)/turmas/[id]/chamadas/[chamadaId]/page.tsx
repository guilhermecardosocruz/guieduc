"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  listAlunos, addAlunosCSV,
  getChamada, updateChamada, removeChamada,
  type Aluno, type Chamada
} from "@/lib/storage";

export default function EditarChamadaPage() {
  const { id: turmaId, chamadaId } = useParams<{ id: string; chamadaId: string }>();
  const router = useRouter();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [model, setModel] = useState<Chamada | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAlunos(listAlunos(turmaId));
    setModel(getChamada(turmaId, chamadaId));
  }, [turmaId, chamadaId]);

  function onToggle(aid: string) {
    if (!model) return;
    setModel({ ...model, presencas: { ...model.presencas, [aid]: !model.presencas[aid] } });
  }

  function onSave() {
    if (!model) return;
    const t = model.titulo.trim();
    if (!t) return alert("Informe o nome da aula.");
    updateChamada(turmaId, { ...model, titulo: t });
    alert("Chamada atualizada!");
    router.push(`/turmas/${turmaId}/chamadas`);
  }

  function onDelete() {
    if (!confirm("Excluir esta chamada?")) return;
    removeChamada(turmaId, chamadaId);
    router.push(`/turmas/${turmaId}/chamadas`);
  }

  async function onImportCSV(file: File) {
    const text = await file.text();
    const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    let start = 0;
    if (lines[0]?.toLowerCase().replace(/;/g, ",").includes("nome")) start = 1;
    const nomes = lines.slice(start).map(l => l.split(/[;,]/)[0] || "");
    addAlunosCSV(turmaId, nomes);
    // recarregar alunos e marcar novos como presentes por padrão
    const atual = listAlunos(turmaId);
    setAlunos(atual);
    setModel(prev => {
      if (!prev) return prev;
      const pres = { ...prev.presencas };
      for (const a of atual) if (pres[a.id] === undefined) pres[a.id] = true;
      return { ...prev, presencas: pres };
    });
    if (fileRef.current) fileRef.current.value = "";
    alert(`${nomes.length} aluno(s) importado(s)`);
  }

  if (!model) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-sm text-gray-500">Carregando ou chamada não encontrada…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-4">
        <Link href={`/turmas/${turmaId}/chamadas`} className="underline text-sm">Voltar para Chamadas</Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Nome da aula</label>
          <input
            className="input"
            value={model.titulo}
            onChange={(e)=>setModel({...model, titulo: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Conteúdo</label>
          <input
            className="input"
            value={model.conteudo}
            onChange={(e)=>setModel({...model, conteudo: e.target.value})}
          />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">Lista de alunos ({alunos.length})</h3>
        <ul className="divide-y">
          {alunos.map(a => (
            <li key={a.id} className="flex items-center justify-between py-2">
              <span className="truncate pr-3">{a.nome}</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!model.presencas[a.id]} onChange={()=>onToggle(a.id)} />
                Presente
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={onSave} className="btn-primary">Salvar alterações</button>

        {/* Importar alunos via CSV na EDIÇÃO também */}
        <label className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border cursor-pointer hover:bg-gray-50">
          Adicionar alunos (CSV)
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onImportCSV(f); }}
          />
        </label>

        <a
          href="/templates/modelo-alunos.csv"
          className="underline text-sm"
          target="_blank"
          rel="noreferrer"
        >
          planilha padrão
        </a>

        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border border-red-300 text-red-600 hover:bg-red-50"
        >
          Excluir chamada
        </button>
      </div>
    </div>
  );
}
