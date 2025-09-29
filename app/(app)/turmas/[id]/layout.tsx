"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link href="/dashboard" className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Nome da turma */}
          <h1 className="text-2xl font-bold truncate">{turma?.nome ?? "Turma"}</h1>

          {/* Conteúdo da página */}
          <div className="mt-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
