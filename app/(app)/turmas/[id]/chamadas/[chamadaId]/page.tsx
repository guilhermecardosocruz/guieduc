"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
const strip = (s: string) => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

export default function EditarChamadaPage() {
  const { id, chamadaId } = useParams<{ id: string; chamadaId: string }>();
  const base = `/turmas/${id}`;
  const fileRef = useRef<HTMLInputElement>(null);

  const [nomeAula, setNomeAula] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [pres, setPres] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const ckey = `guieduc:chamadas:${id}`;
    const akey = `guieduc:alunos:${id}`;
    const arrC = readJSON<Chamada[]>(ckey, []);
    const arrA = readJSON<Aluno[]>(akey, []);
    const c = arrC.find(x => x.id === String(chamadaId));
    setNomeAula(c?.nome || "");
    setPres(c?.presencas || {});
    setAlunos(arrA);
  }, [id, chamadaId]);

  function salvarChamada() {
    const key = `guieduc:chamadas:${id}`;
    const arr = readJSON<Chamada[]>(key, []);
    const i = arr.findIndex(x => x.id === String(chamadaId));
    if (i >= 0) {
      arr[i] = { ...arr[i], nome: nomeAula, presencas: pres };
      writeJSON(key, arr);
      alert("Chamada salva!");
    }
  }

  function addAlunoManual() {
    const nome = prompt("Nome do aluno:");
    if (!nome) return;
    const akey = `guieduc:alunos:${id}`;
    const cur = readJSON<Aluno[]>(akey, []);
    const novo: Aluno = { id: crypto.randomUUID(), nome: nome.trim(), createdAt: Date.now() };
    const next = [...cur, novo].sort((a,b)=> strip(a.nome)<strip(b.nome)?-1:strip(a.nome)>strip(b.nome)?1:0);
    writeJSON(akey, next);
    setAlunos(next);
  }

  function importarPlanilha() { fileRef.current?.click(); }
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
    } catch (err: any) {
      alert(`Falha ao importar: ${err?.message || err}`);
    } finally {
      e.target.value = "";
    }
  }

  function togglePresenca(alunoId: string) {
    setPres(p => ({ ...p, [alunoId]: !p[alunoId] }));
  }

  const alunosOrdenados = useMemo(
    () => [...alunos].sort((a,b)=>{
      const na = strip(a.nome), nb = strip(b.nome);
      return na<nb ? -1 : na>nb ? 1 : 0;
    }),
    [alunos]
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-3">
        <Link href={`${base}/chamadas`} className="underline">Voltar para Chamadas</Link>
      </div>

      {/* Card central mais largo */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
        {/* Nome da aula (como no design) */}
        <label className="block text-sm mb-1">Nome da aula</label>
        <input
          className="input mb-4"
          value={nomeAula}
          onChange={(e)=>setNomeAula(e.target.value)}
          placeholder="Ex.: Frações — revisão"
        />

        {/* Conteúdo -> BOTÃO (sem mudar o resto do layout) */}
        <label className="block text-sm mb-1">Conteúdo</label>
        <Link
          href={`${base}/chamadas/${chamadaId}/conteudo`}
          className="btn-primary w-full text-center mb-4"
        >
          Conteúdo da aula
        </Link>

        {/* Lista de alunos em LINHAS (faixas de lado a lado ocupando toda a largura) */}
        <p className="text-sm font-semibold mb-2">Lista de alunos ({alunosOrdenados.length})</p>
        <ul className="divide-y divide-gray-100 rounded-2xl overflow-hidden">
          {alunosOrdenados.map((a, idx) => (
            <li
              key={a.id}
              className={`flex items-center justify-between py-2 px-4 gap-3 ${idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}`}
            >
              <span className="truncate">{a.nome}</span>
              <label className="inline-flex items-center gap-2 text-sm shrink-0">
                <input type="checkbox" checked={!!pres[a.id]} onChange={()=>togglePresenca(a.id)} />
                Presente
              </label>
            </li>
          ))}
        </ul>

        {/* Botões na MESMA LINHA e sem ficarem largos demais */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-primary px-5" onClick={salvarChamada}>Salvar chamada</button>
          <button
            className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 font-medium hover:bg-gray-50"
            onClick={addAlunoManual}
          >
            Adicionar aluno
          </button>
        </div>

        {/* Importar planilha (como antes) */}
        <div className="mt-4">
          <button
            className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 font-medium hover:bg-gray-50"
            onClick={importarPlanilha}
          >
            Adicionar alunos (CSV/XLSX)
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={onFile} />
          <div className="mt-2 flex gap-4 text-sm">
            <Link href="/templates/alunos.csv" className="underline">planilha padrão (CSV)</Link>
            <Link href="/templates/alunos.xlsx" className="underline">planilha padrão (XLSX)</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
