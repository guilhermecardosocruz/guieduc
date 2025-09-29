"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function TurmaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const turma = typeof window !== "undefined" ? getTurma(params.id) : null;

  if (!turma) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="card text-center">
          <h2 className="form-title">Turma não encontrada</h2>
          <p className="form-subtitle">Verifique o endereço ou volte ao dashboard.</p>
          <div className="mt-4">
            <Link href="/dashboard" className="btn-primary">Voltar</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="btn-primary">Voltar</Link>
          <div className="text-lg font-semibold">{turma.nome}</div>
          <div /> {/* espaçador */}
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">{turma.nome}</h1>
          <p className="text-gray-600">Página da turma (em breve: alunos, chamadas, aulas...)</p>
        </div>
      </main>
    </div>
  );
}
