"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  listAlunos, addAlunosCSV, addAluno,
  getChamada, updateChamadaAndConteudo, removeChamada,
  type Aluno, type Chamada
} from "@/lib/storage";
import { parseAlunosFile } from "@/lib/xls";
import AlunoNameEditor from "@/components/AlunoNameEditor";

export default function EditarChamadaPage() {
  const { id: turmaId, chamadaId } = useParams<{ id: string; chamadaId: string }>();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [model, setModel] = useState<Chamada | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAlunos(listAlunos(turmaId));
    setModel(getChamada(turmaId, chamadaId));
  }, [turmaId, chamadaId]);

  function refreshAfterAlunoChange() {
    const atual = listAlunos(turmaId);
    setAlunos(atual);
    setModel(prev => {
      if (!prev) return prev;
      const pres: Record<string, boolean> = {};
      for (const a of atual) pres[a.id] = prev.presencas[a.id] ?? true;
      return { ...prev, presencas: pres };
    });
  }

  function onToggle(aid: string) {
    if (!model) return;
    setModel({ ...model, presencas: { ...model.presencas, [aid]: !model.presencas[aid] } });
  }

  function onSave() {
    if (!model) return;
    const t = model.titulo.trim();
    if (!t) return alert("Informe o nome da aula.");
    updateChamadaAndConteudo(turmaId, { ...model, titulo: t, conteudo: model.conteudo.trim() });
    alert("Chamada atualizada!");
    if (typeof window !== "undefined") window.location.href = `/turmas/${turmaId}/chamadas`;
  }

  function onDelete() {
    if (!confirm("Excluir esta chamada?")) return;
    removeChamada(turmaId, chamadaId);
    if (typeof window !== "undefined") window.location.href = `/turmas/${turmaId}/chamadas`;
  }

  async function onImport(file: File) {
    const nomes = await parseAlunosFile(file);
    addAlunosCSV(turmaId, nomes);
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

  function onAddAluno() {
    const nome = prompt("Nome do aluno:");
    if (!nome) return;
    const novo = addAluno(turmaId, nome);
    setAlunos(listAlunos(turmaId));
    setModel(prev => prev ? { ...prev, presencas: { ...prev.presencas, [novo.id]: true } } : prev);
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
        <a href={`/turmas/${turmaId}/chamadas`} className="underline text-sm">Voltar para Chamadas</a>
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
        <ul className="-mx-4">
          {alunos.map((a, idx) => (
            <li
              key={a.id}
              className={`flex items-center justify-between py-2 px-4 gap-3 ${
                idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"
              }`}
            >
              <div className="flex-1 min-w-0">
                <AlunoNameEditor
                  turmaId={turmaId}
                  aluno={a}
                  onSaved={refreshAfterAlunoChange}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm shrink-0">
                <input
                  type="checkbox"
                  checked={!!model.presencas[a.id]}
                  onChange={()=>onToggle(a.id)}
                />
                Presente
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={onSave} className="btn-primary">Salvar alterações</button>

        <button
          onClick={onAddAluno}
          className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border border-[color:var(--color-secondary)] text-[color:var(--color-secondary)] hover:bg-blue-50"
        >
          Adicionar aluno
        </button>

        <label className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border cursor-pointer hover:bg-gray-50">
          Adicionar alunos (CSV/XLSX)
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            className="hidden"
            onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onImport(f); }}
          />
        </label>

        <div className="flex items-center gap-3 text-sm">
          <a href="/templates/modelo-alunos.csv" className="underline" target="_blank" rel="noreferrer">planilha padrão (CSV)</a>
          <span className="text-gray-300">|</span>
          <a href="/templates/modelo-alunos.xlsx" className="underline" target="_blank" rel="noreferrer">planilha padrão (XLSX)</a>
        </div>

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
