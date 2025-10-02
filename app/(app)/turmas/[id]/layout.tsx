"use client";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fb; }
  catch { return fb; }
}

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const base = `/turmas/${id}`;

  const [turmaNome, setTurmaNome] = useState<string>("");

  useEffect(() => {
    const turmas = readJSON<{ id: string; nome: string }[]>("guieduc:turmas", []);
    setTurmaNome(turmas.find(t => t.id === String(id))?.nome || "");
  }, [id]);

  // Se a rota for /turmas/:id/chamadas/:chamadaId (mas NÃO /conteudo),
  // mostramos o botão "Conteúdo" ao lado do título.
  let rightAction: React.ReactNode = null;
  if (pathname) {
    // ex: /turmas/123/chamadas/abc
    const m = pathname.match(/^\/turmas\/([^/]+)\/chamadas\/([^/]+)(?:$|\/(?!conteudo).*)/);
    if (m && m[1] && m[2] && !pathname.includes("/conteudo")) {
      const chamadaId = m[2];
      rightAction = (
        <Link
          href={`${base}/chamadas/${chamadaId}/conteudo`}
          className="btn-primary px-5 py-2"
        >
          Conteúdo
        </Link>
      );
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Cabeçalho: título da turma à esquerda + ação à direita */}
      <div className="mx-auto w-full max-w-4xl mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{turmaNome || "Turma"}</h1>
        {rightAction}
      </div>

      <div className="mx-auto w-full max-w-4xl">
        {children}
      </div>
    </div>
  );
}
