"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import NovaTurmaForm from "@/components/NovaTurmaForm";
import TurmasGrid from "@/components/TurmasGrid";
import { Turma, listTurmas, addTurma, removeTurma } from "@/lib/storage";

export default function DashboardPage() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // carrega ao montar
  useEffect(() => { setTurmas(listTurmas()); }, []);

  async function handleAdd(nome: string) {
    const nova = addTurma(nome);        // persiste
    setTurmas(prev => [nova, ...prev]); // atualiza imediatamente
  }

  function handleDelete(id: string) {
    setTurmas(prev => prev.filter(t => t.id !== id)); // otimista
    removeTurma(id);                                   // persiste
  }

  function fakeLogout() { router.push("/login"); }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Brand />
          <button onClick={fakeLogout} className="btn-primary">Sair</button>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 mb-6">Gerencie suas turmas. As turmas criadas aparecem como cards clicáveis.</p>

          <NovaTurmaForm onAdd={handleAdd} />
          <TurmasGrid turmas={turmas} onDelete={handleDelete} />
        </div>
      </main>
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-gray-500">© GUIEDUC — multiplataforma (Web / Android / iOS)</div>
      </footer>
    </div>
  );
}
