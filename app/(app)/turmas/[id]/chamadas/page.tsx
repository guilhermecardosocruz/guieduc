"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { listChamadas, type Chamada } from "@/lib/storage";

type SortOrder = "asc" | "desc";

export default function ChamadasHomePage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;
  const [order, setOrder] = useState<SortOrder>("desc");
  const [items, setItems] = useState<Chamada[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("guieduc:sort:chamadas");
      if (saved === "asc" || saved === "desc") setOrder(saved);
    }
    setItems(listChamadas(id));
  }, [id]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => (order === "asc" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
    return arr;
  }, [items, order]);

  function onChangeOrder(val: SortOrder) {
    setOrder(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("guieduc:sort:chamadas", val);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <a href={`${base}`} className="underline text-sm">Voltar para Turma</a>
        <a href={`${base}/chamadas/nova`} className="btn-primary">Adicionar chamada</a>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600">Ordenar:</label>
          <select
            className="input"
            value={order}
            onChange={(e)=>onChangeOrder(e.target.value as SortOrder)}
          >
            <option value="asc">Crescente (mais antiga → nova)</option>
            <option value="desc">Decrescente (mais nova → antiga)</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma chamada criada ainda.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((c, idx) => {
            const numero = idx + 1; // numeração conforme a ordem atual
            const date = new Date(c.createdAt);
            const dataFmt = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
            return (
              <a
                key={c.id}
                href={`${base}/chamadas/${c.id}`}
                className="block rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-xs shrink-0">
                      {numero}
                    </div>
                    <div className="font-medium truncate">{c.titulo || "Sem título"}</div>
                  </div>
                  <div className="text-xs text-gray-500 shrink-0">{dataFmt}</div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
