type SyncEvent = {
  id: string;
  entity: "turma"|"aluno"|"chamada";
  op: "create"|"update"|"delete";
  payload: any;
  ts: number;
};

const QKEY = "guieduc:syncqueue";

function uid() {
  return Math.random().toString(36).slice(2)+Date.now().toString(36).slice(2);
}

export function enqueueEvent(e: Omit<SyncEvent,"id"|"ts">) {
  if (typeof window === "undefined") return;
  const q: SyncEvent[] = JSON.parse(localStorage.getItem(QKEY) || "[]");
  q.push({ id: uid(), ts: Date.now(), ...e });
  localStorage.setItem(QKEY, JSON.stringify(q));
}

export function getQueue(): SyncEvent[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(QKEY) || "[]");
}

export async function flushQueue() {
  if (typeof window === "undefined") return;
  const q = getQueue();
  if (!q.length) return;
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: q })
    });
    if (!res.ok) throw new Error("Falha no sync");
    localStorage.setItem(QKEY, JSON.stringify([]));
  } catch (e) {
    console.warn("sync falhou, tentar depois:", e);
  }
}
