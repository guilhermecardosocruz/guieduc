"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  listAlunos, addAluno, addAlunosCSV, addChamadaWithConteudo,
  type Aluno
} from "@/lib/storage";
import { parseAlunosFile } from "@/lib/xls";
import AlunoNameEditor from "@/components/AlunoNameEditor";

export default function NovaChamadaPage() {
  const { id: turmaId } = useParams<{ id: string }>();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function refreshAlunosAndPresencas() {
    const atual = listAlunos(turmaId);
    setAlunos(atual);
    setPresencas(prev => {
      const next: Record<string, boolean> = {};
      for (const a of atual) next[a.id] = prev[a.id] ?? true;
      return next;
    });
  }

  useEffect(() => {
    const arr = listAlunos(turmaId);
    setAlunos(arr);
    const init: Record<string, boolean> = {};
    for (const a of arr) init[a.id] = true;
    setPresencas(init);
  }, [turmaId]);

  function onAddAluno() {
    const nome = prompt("Nome do aluno:");
    if (!nome) return;
    const novo = addAluno(turmaId, nome);
    setAlunos(listAlunos(turmaId));
    setPresencas(prev => ({ ...prev, [novo.id]: true }));
  }

  async function onImport(file: File) {
    const nomes = await parseAlunosFile(file);
    addAlunosCSV(turmaId, nomes);
    refreshAlunosAndPresencas();
    if (fileRef.current) fileRef.current.value = "";
    alert(`${nomes.length} aluno(s) importado(s)`);
  }

  function onToggleAluno(aid: string) {
    setPresencas(prev => ({ ...prev, [aid]: !prev[aid] }));
  }

  function onSalvarChamada() {
    const t = titulo.trim();
    if (!t) return alert("Informe o nome da aula.");
    addChamadaWithConteudo(turmaId, { titulo: t, conteudo: conteudo.trim(), presencas });
    alert("Chamada salva!");
    if (typeof window !== "undefined") window.location.href = `/turmas/${turmaId}/chamadas`;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-4">
        <a href={`/turmas/${turmaId}/chamadas`} className="underline text-sm">Voltar para Chamadas</a>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Nome da aula</label>
          <input className="input" value={titulo} onChange={(e)=>setTitulo(e.target.value)} placeholder="Ex.: Frações — revisão" />
        </div>
        <div>
          <label className="block text-sm mb-1">Conteúdo</label>
          <input className="input" value={conteudo} onChange={(e)=>setConteudo(e.target.value)} placeholder="Ex.: Frações próprias e impróprias..." />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">Lista de alunos ({alunos.length})</h3>
        {/* -mx-4 para faixas irem até a borda do card (compensa o padding do container) */}
        <ul className="w-full overflow-hidden rounded-2xl border border-blue-100">
        <ul className="w-full overflow-hidden rounded-2xl border border-blue-100">
          {alunos.map((a, idx) => (
            <li key={a.id} className={`w-full flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}`}>
              <div className="flex-1 min-w-0">
                <AlunoNameEditor
                  turmaId={turmaId}
                  aluno={a}
                  onSaved={refreshAlunosAndPresencas}
                />
              </div>
        </ul>
              <label className="inline-flex items-center gap-2 text-sm shrink-0">
                <input type="checkbox" checked={!!presencas[a.id]} onChange={()=>onToggleAluno(a.id)} />
                Presente
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={onSalvarChamada} className="btn-primary">Salvar chamada</button>
        <button onClick={onAddAluno} className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border border-[color:var(--color-secondary)] text-[color:var(--color-secondary)] hover:bg-blue-50">Adicionar aluno</button>
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
      </div>
    </div>
  );
}
