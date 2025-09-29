"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { listChamadas, type Chamada } from "@/lib/storage";

export default function ChamadasHomePage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;
  const [chamadas, setChamadas] = useState<Chamada[]>([]);

  useEffect(() => { setChamadas(listChamadas(id)); }, [id]);

  return (
    <div>
      <div className="mb-4">
        <Link href={base} className="underline text-sm" data-testid="voltar-atalho">Voltar para a turma</Link>
      </div>

      <div className="flex gap-2">
        <Link href={`${base}/chamadas/nova`} className="btn-primary">Adicionar chamadas</Link>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Chamadas criadas ({chamadas.length})</h3>
        {chamadas.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma chamada criada ainda.</p>
        ) : (
          <ul className="divide-y rounded-2xl border border-gray-100 bg-white">
            {chamadas.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <Link href={`${base}/chamadas/${c.id}`} className="font-medium truncate pr-3">
                  {c.titulo || "Sem título"}
                </Link>
                <Link href={`${base}/chamadas/${c.id}`} className="text-sm underline shrink-0">
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
