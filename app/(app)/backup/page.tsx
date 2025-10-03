'use client';

import { useCallback, useRef, useState } from "react";
import { exportAllToJSON, importAllFromJSON } from "@/lib/storage";

export default function BackupPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<string>("");

  const onExport = useCallback(() => {
    try {
      const json = exportAllToJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guieduc-backup-${location.host}-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setInfo("Backup exportado com sucesso.");
    } catch (e: any) {
      setInfo("Falha ao exportar: " + (e?.message || String(e)));
    }
  }, []);

  const onImportClick = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const res = importAllFromJSON(txt);
      setInfo(`Import concluído. Turmas: ${res.turmas} | Alunos: ${res.alunos} | Chamadas: ${res.chamadas} | Conteúdos: ${res.conteudos}. Recarregue a página (F5).`);
    } catch (e: any) {
      setInfo("Falha ao importar: " + (e?.message || String(e)));
    } finally {
      ev.target.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="rounded-2xl border border-gray-200 p-6 bg-white">
        <h1 className="text-xl font-semibold mb-4">Backup &amp; Restauração</h1>
        <p className="text-sm text-gray-600 mb-6">
          Use esta página para exportar ou importar os dados das suas turmas, alunos, chamadas e conteúdos
          no formato da versão atual (chaves <code>guieduc:*</code>).
        </p>

        <div className="flex gap-3">
          <button
            onClick={onExport}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
          >
            Exportar (.json)
          </button>
          <button
            onClick={onImportClick}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            Importar (.json)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportFile}
          />
        </div>

        {info && (
          <div className="mt-4 text-sm text-gray-700">
            {info}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          Dica: para migrar dados de um domínio antigo do Vercel, exporte lá (se tiver uma página de backup)
          ou use o snippet de Console, depois importe aqui.
        </div>
      </div>
    </div>
  );
}
