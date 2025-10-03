"use client";

import { useEffect } from "react";
import { APP_VERSION } from "@/lib/version";

/** remove apenas dados do app (pref. 'guieduc:') do localStorage */
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
    // lido com primeira execução ou troca de versão
    const KEY = "__guieduc_app_version";
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;

    if (stored === APP_VERSION) return;

    // versão mudou: limpar dados do app + caches, atualizar SW e recarregar
    clearGuieducLocalStorage();
    clearCaches();
    hardUpdateServiceWorker().finally(() => {
      try {
        localStorage.setItem(KEY, APP_VERSION);
      } catch {}
      // Recarrega para garantir que todos assets / rotas usam a nova versão
      location.reload();
    });
  }, []);

  return null;
}
