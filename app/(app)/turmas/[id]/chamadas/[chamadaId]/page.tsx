"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Helpers locais (sem depender do lib/storage)
type Chamada = { id: string; titulo?: string; createdAt: number; presencas?: Record<string, boolean> };
type Conteudo = {
  aula: number;
  titulo?: string;
  conteudo?: string;
  objetivos?: string;
  desenvolvimento?: string;
  recursos?: string;
  bncc?: string;
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function EditarChamadaPage() {
  const router = useRouter();
  const { id, chamadaId } = useParams<{ id: string; chamadaId: string }>();

  // estado já existente da tela…
  const [titulo, setTitulo] = useState("");

  // ===== Novo: Modal de Conteúdo (leitura) =====
  const [showConteudo, setShowConteudo] = useState(false);
  const [conteudoAula, setConteudoAula] = useState<Conteudo | null>(null);
  const [aulaNumero, setAulaNumero] = useState<number | null>(null);

  // calcula o número da aula desta chamada (1..N) pela ordem de criação (crescente)
  const numeroAulaDaChamada = useMemo(() => {
    const chamadas = readJSON<Chamada[]>(`guieduc:chamadas:${id}`, []);
    const list = [...chamadas].sort((a, b) => a.createdAt - b.createdAt);
    const idx = list.findIndex((c) => c.id === (chamadaId as string));
    return idx >= 0 ? idx + 1 : null;
  }, [id, chamadaId]);

  useEffect(() => {
    setAulaNumero(numeroAulaDaChamada);
  }, [numeroAulaDaChamada]);

  // abrir modal e buscar conteúdo correspondente à aulaNumero
  function openConteudoModal() {
    if (!aulaNumero) {
      setConteudoAula(null);
      setShowConteudo(true);
      return;
    }
    const conteudos = readJSON<Conteudo[]>(`guieduc:conteudos:${id}`, []);
    const match =
      conteudos.find((c) => Number(c.aula) === Number(aulaNumero)) || null;
    setConteudoAula(match);
    setShowConteudo(true);
  }

  // ===== resto da tela (já existente) =====
  // Traz título salvo da chamada (se houver)
  useEffect(() => {
    const chamadas = readJSON<Chamada[]>(`guieduc:chamadas:${id}`, []);
    const atual = chamadas.find((c) => c.id === (chamadaId as string));
    if (atual?.titulo) setTitulo(atual.titulo);
  }, [id, chamadaId]);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push(`/turmas/${id}/chamadas`)} className="btn-primary">Voltar</button>
          <h1 className="text-3xl font-bold">{titulo || "Sem título"}</h1>
          <button onClick={openConteudoModal} className="btn-primary">Conteúdo</button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-6">
          {/* Seu formulário de edição já existente: nome da aula, lista de alunos etc */}
          <div className="card w-full">
            <label className="block text-sm mb-1">Nome da aula</label>
            <input
              className="input"
              placeholder="Ex.: Frações — revisão"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            {/* …demais campos e lista de alunos continuam como você já tem… */}
          </div>
        </div>
      </main>

      {/* ===== Modal de leitura do Conteúdo ===== */}
      {showConteudo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowConteudo(false)}>
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Conteúdo — {aulaNumero ? `Aula ${aulaNumero}` : "Aula ?"} </h2>
              <button className="text-sm underline" onClick={() => setShowConteudo(false)}>Fechar</button>
            </div>

            {aulaNumero && conteudoAula ? (
              <div className="space-y-3 text-sm">
                <div><span className="font-medium">Aula:</span> {conteudoAula.aula}</div>
                <div><span className="font-medium">Título:</span> {conteudoAula.titulo || "-"}</div>
                <div><span className="font-medium">Conteúdo da Aula:</span> {conteudoAula.conteudo || "-"}</div>
                <div><span className="font-medium">Objetivos:</span> {conteudoAula.objetivos || "-"}</div>
                <div><span className="font-medium">Desenvolvimento das Atividades:</span> {conteudoAula.desenvolvimento || "-"}</div>
                <div><span className="font-medium">Recursos Didáticos:</span> {conteudoAula.recursos || "-"}</div>
                <div><span className="font-medium">BNCC:</span> {conteudoAula.bncc || "-"}</div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {aulaNumero
                  ? <>Sem conteúdo cadastrado para a <b>aula {aulaNumero}</b>.</>
                  : "Não foi possível identificar o número desta aula."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
