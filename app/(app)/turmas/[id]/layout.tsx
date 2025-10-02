"use client";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import Brand from "@/components/Brand";
import {
  listChamadas,
  getAulaNumber,
  getConteudoByAula,
  type Conteudo,
} from "@/lib/storage";

export default function TurmaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { id: turmaId } = useParams<{ id: string }>();
  const [open, setOpen] = useState(false);
  const [conteudo, setConteudo] = useState<Conteudo | null>(null);

  const isNova = pathname?.includes("/chamadas/nova");
  const isEditar = pathname?.includes("/chamadas/") && !isNova;

  const aulaAlvo = useMemo(() => {
    if (!pathname || !turmaId) return null;
    if (isNova) return listChamadas(turmaId).length + 1; // próxima aula (string ou number, tratamos depois)
    const segs = pathname.split("/");
    const ix = segs.indexOf("chamadas");
    const chamadaId = ix >= 0 ? segs[ix + 1] : null;
    return chamadaId ? getAulaNumber(turmaId, chamadaId) : null;
  }, [pathname, turmaId, isNova]);

  function onAbrirConteudo() {
    if (!turmaId || aulaAlvo == null) return;
    const c = getConteudoByAula(turmaId, aulaAlvo);
    // Fallback “somente leitura”
    const base: any = {
      id: "preview",
      turmaId,
      aula: String(aulaAlvo),
      titulo: "",
      conteudo: "-",
      conteudoAula: "-",
      objetivos: "-",
      desenvolvimento: "-",
      recursos: "-",
      bncc: "-",
      createdAt: Date.now(),
    };
    setConteudo((c as any) || (base as Conteudo));
    setOpen(true);
  }

  const showConteudoBtn = isNova || isEditar;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-2xl bg-[color:var(--color-secondary)] text-white"
          >
            Voltar
          </button>

          <div className="flex items-center gap-3">
            <Brand />
          </div>

          {showConteudoBtn ? (
            <button
              onClick={onAbrirConteudo}
              className="px-5 py-2 rounded-2xl bg-[color:var(--color-secondary)] text-white"
            >
              Conteúdo
            </button>
          ) : (
            <div className="w-[94px]" />
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</div>
      </main>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Conteúdo — Aula {(conteudo as any)?.aula ?? "?"}
              </h3>
              <button className="underline" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p><b>Aula:</b> {(conteudo as any)?.aula ?? "-"}</p>
              <p><b>Título:</b> {(conteudo as any)?.titulo || "-"}</p>
              <p><b>Conteúdo da Aula:</b> {(conteudo as any)?.conteudo ?? (conteudo as any)?.conteudoAula ?? "-"}</p>
              <p><b>Objetivos:</b> {(conteudo as any)?.objetivos || "-"}</p>
              <p><b>Desenvolvimento das Atividades:</b> {(conteudo as any)?.desenvolvimento || "-"}</p>
              <p><b>Recursos Didáticos:</b> {(conteudo as any)?.recursos || "-"}</p>
              <p><b>BNCC:</b> {(conteudo as any)?.bncc || "-"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
