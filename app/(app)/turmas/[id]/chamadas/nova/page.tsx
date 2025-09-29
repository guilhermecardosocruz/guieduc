"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  listAlunos, addAluno, addAlunosCSV,
  addChamada,
  type Aluno
} from "@/lib/storage";

export default function NovaChamadaPage() {
  const { id: turmaId } = useParams<{ id: string }>();
  const router = useRouter();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

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
    setAlunos(prev => [novo, ...prev]);
    setPresencas(prev => ({ ...prev, [novo.id]: true }));
  }

  async function onImportCSV(file: File) {
    const text = await file.text();
    const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    let start = 0;
    if (lines[0]?.toLowerCase().replace(/;/g, ",").includes("nome")) start = 1;
    const nomes = lines.slice(start).map(l => l.split(/[;,]/)[0] || "");
    addAlunosCSV(turmaId, nomes);
    // recarrega memória local
    const atual = listAlunos(turmaId);
    setAlunos(atual);
    setPresencas(prev => {
      const next = { ...prev };
      for (const a of atual) if (next[a.id] === undefined) next[a.id] = true;
      return next;
    });
    if (fileRef.current) fileRef.current.value = "";
    alert(`${nomes.length} aluno(s) importado(s)`);
  }

  function onToggleAluno(aid: string) {
    setPresencas(prev => ({ ...prev, [aid]: !prev[aid] }));
  }

  function onSalvarChamada() {
    const cleanTitulo = titulo.trim();
    const cleanConteudo = conteudo.trim();
    if (!cleanTitulo) return alert("Informe o nome da aula.");
    addChamada(turmaId, { titulo: cleanTitulo, conteudo: cleanConteudo, presencas });
    alert("Chamada salva!");
    router.push(`/turmas/${turmaId}/chamadas`);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-4">
        <Link href={`/turmas/${turmaId}/chamadas`} className="underline text-sm">Voltar para Chamadas</Link>
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
        {alunos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum aluno cadastrado. Adicione manualmente ou importe por CSV.</p>
        ) : (
          <ul className="divide-y">
            {alunos.map(a => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span className="truncate pr-3">{a.nome}</span>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!presencas[a.id]} onChange={()=>onToggleAluno(a.id)} />
                  Presente
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={onSalvarChamada} className="btn-primary">Salvar chamada</button>
        <button onClick={onAddAluno} className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border border-[color:var(--color-secondary)] text-[color:var(--color-secondary)] hover:bg-blue-50">
          Adicionar aluno
        </button>
        <label className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border cursor-pointer hover:bg-gray-50">
          Adicionar alunos (CSV)
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) onImportCSV(f); }} />
        </label>
        <a href="/templates/modelo-alunos.csv" className="underline text-sm" target="_blank" rel="noreferrer">planilha padrão</a>
      </div>
    </div>
  );
}
