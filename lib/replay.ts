type SyncEvent = {
  id: string;
  entity: "turma"|"aluno"|"chamada";
  op: "create"|"update"|"delete";
  payload: any; // { id, ... }
  ts: number;
};

function readJSON<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb; }
  catch { return fb; }
}
function writeJSON<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

function upsertById<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex(x => x.id === item.id);
  if (i >= 0) {
    const next = arr.slice();
    next[i] = item;
    return next;
  }
  return [...arr, item];
}

function removeById<T extends { id: string }>(arr: T[], id: string): T[] {
  return arr.filter(x => x.id !== id);
}

/** Aplica um único evento no localStorage */
function applyEvent(e: SyncEvent) {
  const p = e.payload || {};
  switch (e.entity) {
    case "turma": {
      const key = "guieduc:turmas";
      const cur = readJSON<any[]>(key, []);
      if (e.op === "create" || e.op === "update") {
        writeJSON(key, upsertById(cur, p));
      } else if (e.op === "delete") {
        writeJSON(key, removeById(cur, p.id));
        // limpa dependências
        if (p.id) {
          writeJSON(`guieduc:alunos:${p.id}`, []);
          writeJSON(`guieduc:chamadas:${p.id}`, []);
        }
      }
      break;
    }
    case "aluno": {
      const turmaId = String(p.turmaId || p.turma_id || "");
      if (!turmaId) break;
      const key = `guieduc:alunos:${turmaId}`;
      const cur = readJSON<any[]>(key, []);
      if (e.op === "create" || e.op === "update") {
        writeJSON(key, upsertById(cur, p));
      } else if (e.op === "delete") {
        writeJSON(key, removeById(cur, p.id));
        // também remover presença nas chamadas dessa turma
        const ckey = `guieduc:chamadas:${turmaId}`;
        const chamadas = readJSON<any[]>(ckey, []);
        const next = chamadas.map(c => {
          const pres = { ...(c.presencas || {}) };
          if (p.id in pres) delete pres[p.id];
          return { ...c, presencas: pres };
        });
        writeJSON(ckey, next);
      }
      break;
    }
    case "chamada": {
      const turmaId = String(p.turmaId || p.turma_id || "");
      if (!turmaId) break;
      const key = `guieduc:chamadas:${turmaId}`;
      const cur = readJSON<any[]>(key, []);
      if (e.op === "create" || e.op === "update") {
        writeJSON(key, upsertById(cur, p));
      } else if (e.op === "delete") {
        writeJSON(key, removeById(cur, p.id));
      }
      break;
    }
  }
}

/** Aplica uma lista de eventos em ordem */
export function applyEvents(events: SyncEvent[]) {
  for (const e of events) applyEvent(e as any);
}

/** Hidrata do Neon se o storage local estiver vazio */
export async function hydrateFromNeonIfEmpty() {
  if (typeof window === "undefined") return;
  try {
    const hasTurmas = !!localStorage.getItem("guieduc:turmas");
    if (hasTurmas) return; // já tem dados locais, não sobrescreve
    const res = await fetch("/api/pull", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const events: SyncEvent[] = Array.isArray(data?.events) ? data.events : [];
    if (!events.length) return;
    applyEvents(events);
    // opcional: poderíamos mostrar um toast aqui
  } catch {}
}
