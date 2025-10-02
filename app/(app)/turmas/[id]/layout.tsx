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

  // Href do botão VOLTAR conforme a tela atual
  function getBackHref() {
    if (!pathname) return "/dashboard";
    if (pathname.match(/^\/turmas\/[^/]+\/chamadas\/[^/]+/)) {
      // edição/visualização de uma chamada -> volta para a lista de chamadas
      return `${base}/chamadas`;
    }
    if (pathname.match(/^\/turmas\/[^/]+\/chamadas\/?$/)) {
      // lista de chamadas -> volta para a turma
      return `${base}`;
    }
    // páginas da própria turma (index, conteúdos etc.) -> volta para dashboard
    return "/dashboard";
  }

  // Botão "Conteúdo" à direita do título, apenas quando estiver numa chamada (e não na rota /conteudo)
  let rightAction: React.ReactNode = null;
  if (pathname) {
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
      {/* Linha 1: botão Voltar (barra superior) */}
      <div className="mx-auto w-full max-w-4xl mb-4">
        <Link href={getBackHref()} className="btn-primary inline-flex px-5 py-2">
          Voltar
        </Link>
      </div>

      {/* Linha 2: título da turma à esquerda + ação à direita */}
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
