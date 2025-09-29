"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import TabBtn from "@/components/TabBtn";
import {
  listAlunos, addAluno, addAlunosCSV,
  listChamadas, addChamada,
  type Aluno
} from "@/lib/storage";

export default function ChamadasPage() {
  const { id: turmaId } = useParams<{ id: string }>();
  const base = `/turmas/${turmaId}`;

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // carregar alunos e preparar presenças
  useEffect(() => {
    const arr = listAlunos(turmaId);
    setAlunos(arr);
    const init: Record<string, boolean> = {};
    for (const a of arr) init[a.id] = true; // padrão: presente
    setPresencas(init);
  }, [turmaId]);

  function openEditor() { setEditing(true); }

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
    const payload = { titulo: cleanTitulo, conteudo: cleanConteudo, presencas };
    addChamada(turmaId, payload);
    setTitulo("");
    setConteudo("");
    alert("Chamada salva!");
  }

  useEffect(() => { listChamadas(turmaId); }, [turmaId]);

  return (
    <div>
      {/* Botões (Chamadas abre em nova aba) */}
      <div className="flex gap-2">
        <TabBtn href={`${base}/chamadas`} active newTab>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active={false}>Conteúdos</TabBtn>
      </div>

      {/* Botão principal para abrir o editor */}
      <div className="mt-6">
        <button onClick={openEditor} className="btn-primary">Adicionar chamada</button>
      </div>

      {/* Editor da chamada */}
      {editing && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
          {/* Campos: Nome da aula + Conteúdo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Nome da aula</label>
              <input
                className="input"
                placeholder="Ex.: Frações — revisão"
                value={titulo}
                onChange={(e)=>setTitulo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Conteúdo</label>
              <input
                className="input"
                placeholder="Ex.: Frações próprias e impróprias; exercícios 1–10"
                value={conteudo}
                onChange={(e)=>setConteudo(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de alunos / presença */}
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
                      <input
                        type="checkbox"
                        checked={!!presencas[a.id]}
                        onChange={()=>onToggleAluno(a.id)}
                      />
                      Presente
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Ações abaixo da lista (na ordem solicitada) */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={onSalvarChamada} className="btn-primary">Salvar chamada</button>

            <button
              onClick={onAddAluno}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border border-[color:var(--color-secondary)] text-[color:var(--color-secondary)] hover:bg-blue-50"
            >
              Adicionar aluno
            </button>

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
          </div>
        </div>
      )}
    </div>
  );
}
