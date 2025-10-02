"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AlunoNameEditor, { type Aluno } from "@/components/AlunoNameEditor";

type Chamada = {
  id: string;
  turmaId: string;
  numero?: number;
  nome?: string;
  presencas?: Record<string, boolean>;
  createdAt: number;
};

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fb; }
  catch { return fb; }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}
const strip = (s: string) => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

export default function NovaChamadaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const base = `/turmas/${id}`;

  const [nomeAula, setNomeAula] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [pres, setPres] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAlunos(readJSON<Aluno[]>(`guieduc:alunos:${id}`, []));
  }, [id]);

  const alunosOrdenados = useMemo(
    () => [...alunos].sort((a,b)=> strip(a.nome)<strip(b.nome)?-1:strip(a.nome)>strip(b.nome)?1:0),
    [alunos]
  );

  function salvar() {
    if (!nomeAula.trim()) { alert("Defina o nome da aula."); return; }
    const key = `guieduc:chamadas:${id}`;
    const arr = readJSON<Chamada[]>(key, []);
    const maxNumero = arr.reduce((m, c) => (c.numero && c.numero > m ? c.numero : m), 0);
    const numero = maxNumero > 0 ? maxNumero + 1 : arr.length + 1;

    const nova: Chamada = {
      id: crypto.randomUUID(),
      turmaId: String(id),
      numero,
      nome: nomeAula.trim(),
      presencas: pres,
      createdAt: Date.now()
    };
    writeJSON(key, [...arr, nova]);
    router.push(`${base}/chamadas`);
  }

  function toggle(alunoId: string) {
    setPres(p => ({ ...p, [alunoId]: !p[alunoId] }));
  }

  function addAluno() {
    const nome = prompt("Nome do aluno:");
    if (!nome) return;
    const akey = `guieduc:alunos:${id}`;
    const cur = readJSON<Aluno[]>(akey, []);
    const novo: Aluno = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
    const next = [...cur, novo].sort((a,b)=> strip(a.nome)<strip(b.nome)?-1:strip(a.nome)>strip(b.nome)?1:0);
    writeJSON(akey, next);
    setAlunos(next);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const akey = `guieduc:alunos:${id}`;
    const cur = readJSON<Aluno[]>(akey, []);
    try {
      let nomes: string[] = [];
      if (/\.xlsx$/i.test(f.name)) {
        const XLSX = await import("xlsx");
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        nomes = (json||[]).map(r => String(r?.[0] ?? "").trim()).filter(Boolean);
      } else {
        const text = await f.text();
        nomes = text.split(/\r?\n/).map(l => l.split(/[;,]/)[0]?.trim() || "").filter(Boolean);
      }
      const novos: Aluno[] = nomes.map(n => ({ id: crypto.randomUUID(), nome: n, createdAt: Date.now() }));
      const next = [...cur, ...novos].sort((a,b)=> strip(a.nome)<strip(b.nome)?-1:strip(a.nome)>strip(b.nome)?1:0);
      writeJSON(akey, next);
      setAlunos(next);
      alert(`Importados ${novos.length} aluno(s).`);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5">
      <Link href={base + "/chamadas"} className="underline">Voltar para Chamadas</Link>

      <div className="mt-4">
        <label className="block text-sm mb-1">Nome da aula</label>
        <input className="input" placeholder="Ex.: Frações — revisão" value={nomeAula} onChange={e=>setNomeAula(e.target.value)} />
      </div>

      <p className="text-sm font-semibold mt-6 mb-2">Lista de alunos ({alunosOrdenados.length})</p>

      <ul className="w-full overflow-hidden rounded-2xl border border-blue-100">
        {alunosOrdenados.map((a, idx) => (
          <li key={a.id} className={`w-full flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}`}>
            <div className="flex-1 min-w-0">
              <AlunoNameEditor turmaId={id} aluno={a} onSaved={()=>{
                setAlunos(readJSON<Aluno[]>(`guieduc:alunos:${id}`, []));
              }} />
            </div>
            <input type="checkbox" className="h-5 w-5" title="Marcado = presente" checked={!!pres[a.id]} onChange={()=>toggle(a.id)} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-500">Marcado = presente.</p>

      <div className="mt-4 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <button className="btn-primary px-5" onClick={salvar}>Salvar chamada</button>
        <button className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 font-medium hover:bg-gray-50" onClick={addAluno}>Adicionar aluno</button>
        <button className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 font-medium hover:bg-gray-50" onClick={()=>fileRef.current?.click()}>Adicionar alunos (CSV/XLSX)</button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={onFile} />
      </div>

      <div className="mt-2 flex gap-4 text-sm">
        <Link href="/templates/alunos.csv" className="underline">planilha padrão (CSV)</Link>
        <Link href="/templates/alunos.xlsx" className="underline">planilha padrão (XLSX)</Link>
      </div>
    </div>
  );
}
