"use client";
import DataBackup from "@/components/DataBackup";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";
import TurmasGrid from "@/components/TurmasGrid";
import { listTurmas, addTurma, removeTurma, type Turma } from "@/lib/storage";

type User = { name: string; email: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [novoNome, setNovoNome] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("guieduc:user");
      setUser(raw ? (JSON.parse(raw) as User) : null);
    } catch {
      setUser(null);
    }
    setTurmas(listTurmas());
  }, []);

  function onLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("guieduc:user");
    }
    router.push("/login");
  }

  function onAddTurma(e: React.FormEvent) {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    addTurma(nome);
    setTurmas(listTurmas());
    setNovoNome("");
  }

  function onDeleteTurma(id: string) {
    if (!confirm("Excluir esta turma?")) return;
    removeTurma(id);
    setTurmas(listTurmas());
  }

  const nome = user?.name || "Usuário";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Brand />
          <button onClick={onLogout} className="btn-primary">Sair</button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Olá, {nome}</h1>
          <p className="text-gray-600">Gerencie suas turmas abaixo.</p>

          <form onSubmit={onAddTurma} className="mt-6 flex flex-wrap items-center gap-2">
            <input
              className="input max-w-xs"
              placeholder="Nome da nova turma"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <button className="btn-primary">Adicionar turma</button>
          </form>

          <TurmasGrid turmas={turmas} onDelete={onDeleteTurma} />
        </div>
      </main>
        <DataBackup />

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-gray-500">
          © GUIEDUC — multiplataforma (Web / Android / iOS)
        </div>
      </footer>
    </div>
  );
}
