"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { getTurma } from "@/lib/storage";

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        "px-3 py-2 rounded-xl text-sm " +
        (active ? "bg-[color:var(--color-secondary)] text-white" : "text-gray-700 hover:bg-gray-100")
      }
    >
      {children}
    </Link>
  );
}

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const turma = typeof window !== "undefined" ? getTurma(id) : null;

  const base = `/turmas/${id}`;
  const isChamadas = pathname?.startsWith(`${base}/chamadas`) || pathname === base;
  const isConteudos = pathname?.startsWith(`${base}/conteudos`);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="btn-primary">Voltar</Link>
          <div className="text-lg font-semibold truncate">{turma?.nome ?? "Turma"}</div>
          <div className="flex gap-2">
            <Tab href={`${base}/chamadas`} active={!!isChamadas}>Chamadas</Tab>
            <Tab href={`${base}/conteudos`} active={!!isConteudos}>Conteúdos</Tab>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
