"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listTurmas, type Turma } from "@/lib/storage";
import { gerarRelatorioPDF } from "@/lib/pdf";
import type { PeriodKey } from "@/lib/report";

function RelatoriosInner() {
  const params = useSearchParams();
  const turmaParam = params.get("turma") || "";
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>("");
  const [period, setPeriod] = useState<PeriodKey>("mensal");

  useEffect(() => {
    const all = listTurmas();
    setTurmas(all);
    if (turmaParam && all.find((t: Turma) => t.id === turmaParam)) {
      setTurmaId(turmaParam);
    } else if (all[0]) {
      setTurmaId(all[0].id);
    }
  }, [turmaParam]);

  const hasTurmas = useMemo(() => turmas.length > 0, [turmas]);

  function onGerar() {
    if (!turmaId) {
      alert("Selecione uma turma para gerar o PDF.");
      return;
    }
    gerarRelatorioPDF(turmaId, period);
  }

  return (
    <div>
      {!hasTurmas ? (
        <p className="text-sm text-gray-600">
          Nenhuma turma cadastrada. Crie uma turma no Dashboard para gerar relatórios.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          <div>
            <label className="block text-sm mb-1">Turma</label>
            <select
              className="input w-full"
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Período</label>
            <select
              className="input w-full"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            >
              <option value="semanal">Semanal (7 dias)</option>
              <option value="mensal">Mensal (30 dias)</option>
              <option value="trimestral">Trimestral (90 dias)</option>
              <option value="semestral">Semestral (≈182 dias)</option>
              <option value="anual">Anual (365 dias)</option>
            </select>
          </div>
        </div>
      )}

      <div className="mt-4">
        <button onClick={onGerar} className="btn-primary" disabled={!hasTurmas}>
          Gerar em PDF
        </button>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-3">
        <a href="/dashboard" className="underline text-sm">
          Voltar para Dashboard
        </a>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Relatório de chamadas (PDF)</h2>

      <Suspense fallback={<p className="text-sm text-gray-500">Carregando…</p>}>
        <RelatoriosInner />
      </Suspense>
    </div>
  );
}
