"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Aluno = { id: string; nome: string; createdAt: number };

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fb; }
  catch { return fb; }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export default function AlunoNameEditor({
  turmaId,
  aluno,
  onSaved,
}: {
  turmaId: string | number;
  aluno: Aluno;
  onSaved?: () => void; // pai recarrega alunos+presenças
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(aluno.nome);
  const timerRef = useRef<number | null>(null);
  const pressedRef = useRef(false);

  useEffect(() => setNome(aluno.nome), [aluno.nome]);

  const openEditor = useCallback(() => setOpen(true), []);
  const closeEditor = useCallback(() => {
    setOpen(false);
    setNome(aluno.nome);
  }, [aluno.nome]);

  // Long press (desktop e mobile)
  const startPress = () => {
    pressedRef.current = true;
    timerRef.current = window.setTimeout(() => {
      if (pressedRef.current) openEditor();
    }, 500);
  };
  const cancelPress = () => {
    pressedRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  function save() {
    const akey = `guieduc:alunos:${turmaId}`;
    const arr = readJSON<Aluno[]>(akey, []);
    const i = arr.findIndex((x) => x.id === aluno.id);
    if (i >= 0) {
      arr[i] = { ...arr[i], nome: nome.trim() || arr[i].nome };
      writeJSON(akey, arr);
    }
    setOpen(false);
    onSaved?.();
  }

  function remove() {
    if (!confirm("Excluir este aluno da turma?")) return;
    const akey = `guieduc:alunos:${turmaId}`;
    const arr = readJSON<Aluno[]>(akey, []);
    const next = arr.filter((x) => x.id !== aluno.id);
    writeJSON(akey, next);

    // Não mexemos diretamente nas presenças aqui; o pai deve recarregar
    setOpen(false);
    onSaved?.();
  }

  return (
    <>
      {/* Nome exibido: abre editor com duplo clique ou toque longo */}
      <span
        className="truncate cursor-pointer"
        title="Duplo clique ou toque e segure para editar"
        onDoubleClick={openEditor}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
      >
        {aluno.nome}
      </span>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Editar aluno</h3>

            <label className="block text-sm mb-1">Nome</label>
            <input
              className="input mb-4"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do aluno"
              autoFocus
            />

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={remove}
                className="text-red-600 hover:underline"
              >
                Excluir
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={closeEditor}
                  className="inline-flex items-center justify-center rounded-2xl border px-4 py-2 font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button onClick={save} className="btn-primary px-5">
                  Salvar
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Dica: duplo clique ou toque e segure no nome para editar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
