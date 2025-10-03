"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getChamada,
  saveChamada,
  deleteChamada,
  listAlunos,
  addAluno,
  updateAluno,
  removeAluno,
  getAulaNumber,
  getConteudoByAula,
  importAlunosFromFile
} from "@/lib/storage";
import Modal from "@/components/Modal";

type AlunoEditState = null | { id: string; nome: string };

export default function EditarChamadaPage() {
  const params = useParams<{ id: string; chamadaId: string }>();
  const turmaId = params.id;
  const chamadaId = params.chamadaId;
  const router = useRouter();

  const [nome, setNome] = useState<string>("");
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [alunos, setAlunos] = useState(listAlunos(turmaId));

  const [openConteudo, setOpenConteudo] = useState(false);
  const [openAlunoEdit, setOpenAlunoEdit] = useState<AlunoEditState>(null);
  const [openAlunoMore, setOpenAlunoMore] = useState<AlunoEditState>(null);

  useEffect(() => {
    const c = getChamada(turmaId, chamadaId);
    if (c) {
      setNome(c.nome ?? "");  // garante string
      setPresencas(c.presencas || {});
    } else {
      setNome("");
      setPresencas({});
    }
    setAlunos(listAlunos(turmaId));
  }, [turmaId, chamadaId]);

  // Força sempre um number: -1 quando não encontrado
  const aulaNumber = useMemo<number>(() => {
    const n = getAulaNumber(turmaId, chamadaId);
    return typeof n === "number" ? n : -1;
  }, [turmaId, chamadaId]);

  const conteudo = useMemo(() => {
    return aulaNumber > 0 ? getConteudoByAula(turmaId, aulaNumber) : null;
  }, [turmaId, aulaNumber]);

  function togglePresenca(alunoId: string) {
    setPresencas(prev => ({ ...prev, [alunoId]: !prev[alunoId] }));
  }

  function onSalvar() {
    const c = getChamada(turmaId, chamadaId);
    if (!c) return;
    saveChamada(turmaId, { ...c, nome: nome.trim() || c.nome, presencas });
    router.refresh();
  }
  function onExcluir() {
    if (confirm("Excluir esta chamada?")) {
      deleteChamada(turmaId, chamadaId);
      router.push(`/turmas/${turmaId}/chamadas`);
    }
  }
  function onAdicionarAluno() {
    const nome = prompt("Nome do aluno:");
    if (!nome) return;
    addAluno(turmaId, nome);
    setAlunos(listAlunos(turmaId));
  }
  async function onImportAlunos(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const count = await importAlunosFromFile(turmaId, file);
    alert(`${count} aluno(s) importado(s).`);
    setAlunos(listAlunos(turmaId));
    e.target.value = "";
  }

  // Suporte a toque prolongado (long press)
  const longPressTimers = useRef<Record<string, number | undefined>>({});

  function startLongPress(alunoId: string, alunoNome: string) {
    clearLongPress(alunoId);
    longPressTimers.current[alunoId] = window.setTimeout(() => {
      setOpenAlunoEdit({ id: alunoId, nome: alunoNome });
    }, 550);
  }
  function clearLongPress(alunoId: string) {
    const t = longPressTimers.current[alunoId];
    if (t) {
      clearTimeout(t);
      longPressTimers.current[alunoId] = undefined;
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Turma {turmaId}</h1>
            <button
              onClick={() => setOpenConteudo(true)}
              className="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
              title="Abrir Conteúdo desta Aula (somente leitura)"
            >
              Conteúdo
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSalvar}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-white hover:opacity-90"
            >
              Salvar chamada
            </button>
            <button
              onClick={onAdicionarAluno}
              className="rounded-xl border px-4 py-2 hover:bg-gray-50"
            >
              Adicionar aluno
            </button>
            <label className="rounded-xl border px-4 py-2 hover:bg-gray-50 cursor-pointer">
              Adicionar alunos (CSV/XLSX)
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={onImportAlunos}
              />
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Nome da aula</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={`Aula ${aulaNumber > 0 ? aulaNumber : "?"}`}
          />
        </div>

        <div className="mb-2 text-sm text-gray-500">
          Aula (número estável): <strong>{aulaNumber > 0 ? aulaNumber : "—"}</strong>
        </div>

        <div className="w-full overflow-hidden rounded-xl border">
          <ul>
            {alunos.map((a, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <li
                  key={a.id}
                  onDoubleClick={() => setOpenAlunoEdit({ id: a.id, nome: a.nome })}
                  onMouseDown={() => startLongPress(a.id, a.nome)}
                  onMouseUp={() => clearLongPress(a.id)}
                  onMouseLeave={() => clearLongPress(a.id)}
                  onTouchStart={() => startLongPress(a.id, a.nome)}
                  onTouchEnd={() => clearLongPress(a.id)}
                  onTouchCancel={() => clearLongPress(a.id)}
                  className={`flex w-full items-center justify-between px-3 py-2 select-none ${
                    isEven ? "bg-blue-50" : "bg-white"
                  }`}
                  title="Duplo clique (desktop) ou toque prolongado (mobile) para editar"
                >
                  <span className="truncate">{a.nome}</span>
                  <label className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Presente</span>
                    <input
                      type="checkbox"
                      checked={!!presencas[a.id]}
                      onChange={() => togglePresenca(a.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                </li>
              );
            })}
            {alunos.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">Sem alunos na turma.</li>
            )}
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onExcluir}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Excluir chamada
          </button>
        </div>
      </div>

      <Modal
        open={openConteudo}
        onClose={() => setOpenConteudo(false)}
        title={`Conteúdo da Aula ${aulaNumber > 0 ? aulaNumber : "—"}`}
      >
        {conteudo ? (
          <div className="space-y-2">
            <p><strong>Título:</strong> {conteudo.titulo || "—"}</p>
            <p><strong>Conteúdo:</strong> {conteudo.conteudo || "—"}</p>
            <p><strong>Objetivos:</strong> {conteudo.objetivos || "—"}</p>
            <p><strong>Desenvolvimento:</strong> {conteudo.desenvolvimento || "—"}</p>
            <p><strong>Recursos:</strong> {conteudo.recursos || "—"}</p>
            <p><strong>BNCC:</strong> {conteudo.bncc || "—"}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Nenhum conteúdo cadastrado para esta aula.</p>
        )}
      </Modal>

      <Modal
        open={!!openAlunoEdit}
        onClose={() => setOpenAlunoEdit(null)}
        title="Editar aluno"
      >
        {openAlunoEdit && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              updateAluno(turmaId, openAlunoEdit.id, openAlunoEdit.nome);
              setAlunos(listAlunos(turmaId));
              setOpenAlunoEdit(null);
            }}
          >
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={openAlunoEdit.nome}
              onChange={(e) =>
                setOpenAlunoEdit({ ...openAlunoEdit, nome: e.target.value })
              }
              placeholder="Nome do aluno"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-xl bg-[#0A66FF] px-4 py-2 text-white hover:opacity-90"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setOpenAlunoEdit(null)}
                className="rounded-xl border px-4 py-2 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Excluir este aluno?")) {
                    removeAluno(turmaId, openAlunoEdit.id);
                    setAlunos(listAlunos(turmaId));
                    setOpenAlunoEdit(null);
                  }
                }}
                className="rounded-xl border px-4 py-2 hover:bg-gray-50"
              >
                Excluir
              </button>
              <button
                type="button"
                onClick={() => setOpenAlunoMore(openAlunoEdit)}
                className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                title="Abrir mais dados do aluno"
              >
                Mais dados
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!openAlunoMore}
        onClose={() => setOpenAlunoMore(null)}
        title="Mais dados do aluno"
      >
        {openAlunoMore ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              <p><strong>Nome atual:</strong> {openAlunoMore.nome}</p>
            </div>
            <div className="rounded-xl border p-3 text-sm text-gray-600">
              Espaço reservado para informações adicionais (ex.: responsável, contato,
              observações, necessidades específicas). Quando desejar, integro esses campos
              ao armazenamento offline-first.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpenAlunoMore(null)}
                className="rounded-xl border px-4 py-2 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
