"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Aluno = { id: string; nome: string; createdAt: number };
type Chamada = {
  id: string;
  turmaId: string;
  nome?: string;
  conteudo?: string;
  presencas?: Record<string, boolean>;
  createdAt: number;
};

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb; }
  catch { return fb; }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export default function EditarChamadaPage() {
  const { id, chamadaId } = useParams<{ id: string; chamadaId: string }>();
  const base = `/turmas/${id}`;

  const [chamada, setChamada] = useState<Chamada | null>(null);
  const [nomeAula, setNomeAula] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [pres, setPres] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ckey = `guieduc:chamadas:${id}`;
    const akey = `guieduc:alunos:${id}`;
    const arrC = readJSON<Chamada[]>(ckey, []);
    const arrA = readJSON<Aluno[]>(akey, []);
    const c = arrC.find(x => x.id === String(chamadaId)) || null;
    setChamada(c);
    setNomeAula(c?.nome || "");
    setPres(c?.presencas || {});
    setAlunos(arrA);
  }, [id, chamadaId]);

  function salvarNomeAula(nextNome: string) {
    setNomeAula(nextNome);
    const key = `guieduc:chamadas:${id}`;
    const arr = readJSON<Chamada[]>(key, []);
    const i = arr.findIndex(x => x.id === String(chamadaId));
    if (i >= 0) {
      arr[i] = { ...arr[i], nome: nextNome };
      writeJSON(key, arr);
    }
  }

  function togglePresenca(alunoId: string) {
    const next = { ...pres, [alunoId]: !pres[alunoId] };
    setPres(next);
    const ckey = `guieduc:chamadas:${id}`;
    const arr = readJSON<Chamada[]>(ckey, []);
    const i = arr.findIndex(x => x.id === String(chamadaId));
    if (i >= 0) {
      arr[i] = { ...arr[i], presencas: next };
      writeJSON(ckey, arr);
    }
  }

  const alunosOrdenados = useMemo(() => {
    const strip = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
    return [...alunos].sort((a,b)=> {
      const na = strip(a.nome), nb = strip(b.nome);
      if (na < nb) return -1; if (na > nb) return 1; return 0;
    });
  }, [alunos]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar chamada</h1>
        <Link href={`${base}/chamadas`} className="underline">Voltar para Chamadas</Link>
      </div>

      {/* Mantém o design: grid com Nome da aula + botão Conteúdo */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nome da aula</label>
            <input
              className="input"
              value={nomeAula}
              onChange={(e)=>salvarNomeAula(e.target.value)}
              placeholder="Ex.: Aula 5 — Frações"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Conteúdo</label>
            <Link
              href={`${base}/chamadas/${chamadaId}/conteudo`}
              className="btn-primary w-full text-center"
            >
              Conteúdo da aula
            </Link>
          </div>
        </div>
      </div>

      {/* Lista de presença (inalterada) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Lista de presença</h2>
        <ul className="divide-y divide-gray-100 rounded-2xl overflow-hidden">
          {alunosOrdenados.map((a, idx) => (
            <li
              key={a.id}
              className={`flex items-center justify-between py-2 px-4 gap-3 ${idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}`}
            >
              <div className="flex-1 min-w-0">
                <span className="block truncate">{a.nome}</span>
              </div>
              <label className="inline-flex items-center gap-2 text-sm shrink-0">
                <input
                  type="checkbox"
                  checked={!!pres[a.id]}
                  onChange={() => togglePresenca(a.id)}
                />
                Presente
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
