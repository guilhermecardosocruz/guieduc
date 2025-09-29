"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listTurmas, type Turma } from "@/lib/storage";

export default function TurmasGrid() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  useEffect(() => { setTurmas(listTurmas()); }, []);

  if (turmas.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 p-6 bg-white">
        <p className="text-gray-600">Nenhuma turma ainda. Use o formulário acima para criar sua primeira turma.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {turmas.map((t) => (
        <Link key={t.id} href={`/turmas/${t.id}`} className="rounded-3xl border border-gray-100 p-6 bg-white hover:shadow transition">
          <div className="text-sm text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</div>
          <div className="mt-1 text-lg font-semibold">{t.nome}</div>
          <div className="mt-2 text-sm underline">Abrir turma</div>
        </Link>
      ))}
    </div>
  );
}
