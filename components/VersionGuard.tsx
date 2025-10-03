"use client";

import { useEffect } from "react";
import { APP_VERSION, DATA_SCHEMA } from "@/lib/version";

const VERSION_KEY = "__guieduc_app_version";
const SCHEMA_KEY = "__guieduc_data_schema";
const BACKUP_KEY = "__guieduc_backup_last";

/** Faz backup de todas as chaves guieduc:* em um único JSON */
function backupGuieducData() {
  try {
    const obj: Record<string, any> = {};
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith("guieduc:")) {
        obj[k] = localStorage.getItem(k);
      }
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(obj));
  } catch {}
}

/** Restaura backup (se você quiser expor em UI depois) */
export function restoreLastBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(obj)) {
      localStorage.setItem(k, v);
    }
    return true;
  } catch {
    return false;
  }
}

/** Limpa somente as chaves do app (prefixo guieduc:) */
function clearGuieducLocalStorage() {
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith("guieduc:")) localStorage.removeItem(k);
    }
  } catch {}
}

/** limpa todos os caches do PWA */
function clearCaches() {
  try {
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  } catch {}
}

/** força update do SW: envia SKIP_WAITING e pede update() */
async function hardUpdateServiceWorker() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        await reg.update();
      }
    }
  } catch {}
}

export default function VersionGuard() {
  useEffect(() => {
    const storedVersion = typeof window !== "undefined" ? localStorage.getItem(VERSION_KEY) : null;
    const storedSchema = typeof window !== "undefined" ? localStorage.getItem(SCHEMA_KEY) : null;

    const versionChanged = storedVersion !== APP_VERSION;
    const schemaChanged = storedSchema !== DATA_SCHEMA;

    if (!versionChanged && !schemaChanged) return;

    // 1) Em QUALQUER mudança de versão: atualizar SW e limpar CACHES (mas não mexer nos dados)
    const doVersionMaintenance = async () => {
      clearCaches();
      await hardUpdateServiceWorker();
      try {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      } catch {}
    };

    // 2) Só quando o ESQUEMA mudar: backup + limpar dados do app
    const doSchemaMaintenance = () => {
      backupGuieducData();
      clearGuieducLocalStorage();
      try {
        localStorage.setItem(SCHEMA_KEY, DATA_SCHEMA);
      } catch {}
    };

    (async () => {
      await doVersionMaintenance();
      if (schemaChanged) {
        doSchemaMaintenance();
      }
      // Recarrega para garantir assets e rotas novos (e/ou dados migrados)
      location.reload();
    })();
  }, []);

  return null;
}
