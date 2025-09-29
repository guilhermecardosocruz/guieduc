"use client";
import { useParams, usePathname } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/turmas/${id}`;
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  // Regras de back:
  // - raiz da turma -> /dashboard
  // - /turmas/[id]/chamadas -> /turmas/[id]
  // - /turmas/[id]/chamadas/* (nova, [chamadaId]) -> /turmas/[id]/chamadas
  // - /turmas/[id]/conteudos* -> /turmas/[id]
  let backHref = "/dashboard";
  if (pathname && pathname !== base && pathname !== `${base}/`) {
    if (pathname === `${base}/chamadas`) backHref = base;
    else if (pathname.startsWith(`${base}/chamadas/`)) backHref = `${base}/chamadas`;
    else if (pathname.startsWith(`${base}/conteudos`)) backHref = base;
    else backHref = base;
  }

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
