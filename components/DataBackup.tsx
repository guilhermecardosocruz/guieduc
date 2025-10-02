"use client";
import { useRef } from "react";

type Dump = {
  origin: string;
  exportedAt: number;
  data: Record<string, any>;
};

function getAllGuieduc(): Record<string, any> {
  if (typeof window === "undefined") return {};
  const out: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith("guieduc:")) {
      try { out[k] = JSON.parse(localStorage.getItem(k) || "null"); }
      catch { out[k] = localStorage.getItem(k); }
    }
  }
  return out;
}

export default function DataBackup() {
  const fileRef = useRef<HTMLInputElement>(null);

  function exportJSON() {
    const dump: Dump = {
      origin: typeof window !== "undefined" ? window.location.origin : "",
      exportedAt: Date.now(),
      data: getAllGuieduc()
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date(dump.exportedAt).toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `guieduc-backup-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onPickFile() {
    fileRef.current?.click();
  }

  function importJSON(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dump = JSON.parse(String(reader.result || "{}")) as Dump;
        if (!dump || typeof dump !== "object" || !dump.data) throw new Error("Arquivo inválido");
        const keys = Object.keys(dump.data);
        let count = 0;
        for (const k of keys) {
          if (!k.startsWith("guieduc:")) continue;
          try {
            localStorage.setItem(k, JSON.stringify(dump.data[k]));
            count++;
          } catch {}
        }
        alert(`Importado com sucesso ${count} chave(s).\nAtualize a página para ver os dados.`);
      } catch (e: any) {
        alert(`Falha ao importar: ${e?.message || e}`);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="text-base font-semibold mb-2">Backup de dados (localStorage)</h3>
      <p className="text-sm text-gray-600 mb-3">
        Exporte os dados locais (turmas, alunos, chamadas) para um arquivo JSON e importe em outro navegador/origem.
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={exportJSON} className="btn-primary">Exportar JSON</button>
        <button onClick={onPickFile} className="inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border hover:bg-gray-50">
          Importar JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e)=>{ const f = e.target.files?.[0]; if (f) importJSON(f); }}
        />
      </div>
    </div>
  );
}
