"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { getTurma } from "@/lib/storage";

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const turma = typeof window !== "undefined" ? getTurma(id) : null;
  const base = `/turmas/${id}`;

  // se estiver em rotas de chamadas, o Voltar aponta para /turmas/[id]/chamadas
  // se estiver em conteúdos, aponta para /turmas/[id]/conteudos
  // caso contrário, volta para a raiz da turma
  const backHref =
    pathname?.startsWith(`${base}/chamadas`) ? `${base}/chamadas` :
    pathname?.startsWith(`${base}/conteudos`) ? `${base}/conteudos` :
    base;

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
