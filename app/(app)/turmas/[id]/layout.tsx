"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/turmas/${id}`;
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  // Regras:
  // - Se estou exatamente na raiz da turma (/turmas/[id]) -> voltar para /dashboard
  // - Se estou em /turmas/[id]/chamadas* ou /turmas/[id]/conteudos* -> voltar para /turmas/[id]
  // - Caso contrário, fallback para /dashboard
  const isTurmaRoot =
    pathname === base || pathname === `${base}/` || pathname?.endsWith(`/turmas/${id}`) && pathname?.split('/').length === base.split('/').length;

  const backHref = isTurmaRoot
    ? "/dashboard"
    : (pathname?.startsWith(`${base}/chamadas`) || pathname?.startsWith(`${base}/conteudos`))
      ? base
      : "/dashboard";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link href={backHref} className="btn-primary">Voltar</Link>
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
