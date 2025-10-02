"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listAlunos, getChamada, saveChamada } from "@/lib/storage";

export default function EditarChamadaPage() {
  const { id: turmaId, chamadaId } = useParams<{ id: string; chamadaId: string }>();
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [alunos, setAlunos] = useState(listAlunos(turmaId));
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setAlunos(listAlunos(turmaId));
    const c = getChamada(turmaId, chamadaId);
    if (c) {
      setTitulo((c as any).titulo || "");
      setPresencas(c.presencas || {});
    }
  }, [turmaId, chamadaId]);

  function toggle(id: string) {
    setPresencas((p) => ({ ...p, [id]: !p[id] }));
  }

  async function salvar() {
    await saveChamada(turmaId, chamadaId, { titulo, presencas });
    router.back();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Editar chamada</h1>

      <div className="rounded-3xl border border-gray-100 bg-white p-6">
        <label className="block text-sm mb-1">Nome da aula</label>
        <input
          className="input mb-6"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Frações — revisão"
        />

        <h2 className="font-semibold mb-2">Lista de alunos ({alunos.length})</h2>
        <ul className="w-full overflow-hidden rounded-2xl border border-blue-100">
          {alunos.map((a, idx) => (
            <li
              key={a.id}
              className={`w-full flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}`}
            >
              <div className="flex-1 min-w-0">{a.nome}</div>
              <label className="inline-flex items-center gap-2 text-sm shrink-0">
                <input type="checkbox" checked={!!presencas[a.id]} onChange={() => toggle(a.id)} />
                Presente
              </label>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 mt-6">
          <button onClick={salvar} className="btn-primary">Salvar chamada</button>
        </div>
      </div>
    </div>
  );
}
