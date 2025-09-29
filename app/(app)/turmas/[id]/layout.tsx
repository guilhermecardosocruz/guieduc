"use client";
import { useParams, usePathname } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/turmas/${id}`;
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  const isTurmaRoot = pathname === base || pathname === `${base}/`;
  const backHref = isTurmaRoot ? "/dashboard" : base;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <a href={backHref} className="btn-primary">Voltar</a>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="text-2xl font-bold truncate">{turma?.nome ?? "Turma"}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
