"use client";
import { useEffect, useRef, useState } from "react";
import type { Aluno } from "@/lib/storage";
import { updateAlunoName } from "@/lib/storage";

export default function AlunoNameEditor({
  turmaId,
  aluno,
  onSaved
}: {
  turmaId: string;
  aluno: Aluno;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(aluno.nome);
  const timerRef = useRef<number | null>(null);

  // mantém o valor em sincronia se a lista recarregar
  useEffect(() => setValor(aluno.nome), [aluno.nome]);

  function startLongPress() {
    stopLongPress();
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, 600); // ~600ms para "toque longo"
  }
  function stopLongPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function onDoubleClick() {
    setOpen(true);
  }

  function salvar() {
    const ok = updateAlunoName(turmaId, aluno.id, valor);
    if (ok) {
      onSaved();
      setOpen(false);
    } else {
      alert("Informe um nome válido.");
    }
  }

  return (
    <>
      <span
        className="truncate pr-3 cursor-pointer select-none"
        title="Duplo clique (desktop) ou toque longo (mobile) para editar"
        onDoubleClick={onDoubleClick}
        onMouseDown={startLongPress}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={stopLongPress}
      >
        {aluno.nome}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3">Editar nome do aluno</h3>
            <input
              className="input w-full"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") salvar();
                if (e.key === "Escape") setOpen(false);
              }}
              autoFocus
              placeholder="Nome do aluno"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
              <button className="btn-primary" onClick={salvar}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
