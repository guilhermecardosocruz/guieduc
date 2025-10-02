"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listAlunos, addChamada, type Aluno } from "@/lib/storage";

export default function NovaChamadaPage() {
  const { id: turmaId } = useParams<{ id: string }>();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const as = listAlunos(turmaId);
    setAlunos(as);
    const preset: Record<string, boolean> = {};
    as.forEach(a => { preset[a.id] = false; });
    setPresencas(preset);
  }, [turmaId]);

  const toggle = (alunoId: string) =>
    setPresencas(p => ({ ...p, [alunoId]: !p[alunoId] }));

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          className="rounded-full bg-blue-600 text-white px-4 py-2"
          onClick={() => router.back()}
        >
          Voltar
        </button>
        <h1 className="text-2xl font-bold">Nova chamada</h1>
        <div />
      </div>

      <div className="rounded-2xl border border-gray-200 p-4">
        <label className="block text-sm font-medium mb-2">Nome da aula</label>
        <input
          className="w-full rounded-xl border px-3 py-2 mb-4"
          placeholder="Ex.: Frações — revisão"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <p className="text-sm font-semibold mb-2">
          Lista de alunos ({alunos.length})
        </p>

        <ul className="w-full overflow-hidden rounded-2xl border border-blue-100">
          {alunos.map((a, idx) => (
            <li
              key={a.id}
              className={`w-full flex items-center justify-between px-4 py-3 ${idx % 2 === 0 ? "bg-blue-50" : "bg-blue-100"}`}
            >
              <span className="truncate">{a.nome}</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!presencas[a.id]}
                  onChange={() => toggle(a.id)}
                />
                Presente
              </label>
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-500 mt-2">
          Marque a caixa para indicar presença.
        </p>

        <div className="flex gap-3 mt-4">
          <button
            className="rounded-xl bg-blue-600 text-white px-4 py-2"
            onClick={async () => {
              await addChamada(turmaId, { nome, presencas });
              router.back();
            }}
          >
            Salvar chamada
          </button>

          <button
            className="rounded-xl border px-4 py-2"
            onClick={() => router.back()}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
