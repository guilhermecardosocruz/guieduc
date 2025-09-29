"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTurma } from "@/lib/storage";

function TabBtn({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  const turma = typeof window !== "undefined" ? getTurma(id) : null;
  const base = `/turmas/${id}`;

  return (
    <div>
      <h1 className="text-2xl font-bold">Conteúdos — {turma?.nome ?? "Turma"}</h1>

      {/* Botões no lugar do "Em breve..." */}
      <div className="mt-4 flex gap-2">
        <TabBtn href={`${base}/chamadas`} active={false}>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active>Conteúdos</TabBtn>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
        Placeholder de conteúdos.
      </div>
    </div>
  );
}
