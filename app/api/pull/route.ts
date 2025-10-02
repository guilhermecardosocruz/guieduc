import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * GET /api/pull
 * Retorna todos os eventos (ou até um limite) em ordem cronológica.
 * Você pode paginar/filtrar depois se necessário.
 */
export async function GET() {
  try {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
      // Sem DB configurado, devolve vazio
      return NextResponse.json({ ok: true, events: [] }, { status: 200 });
    }
    const db = getDb();

    // Garante que a tabela exista (idempotente)
    await db/*sql*/`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        entity TEXT NOT NULL,
        op TEXT NOT NULL,
        payload JSONB NOT NULL,
        ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Busca os eventos em ordem (cap a 20k pra não explodir)
    const rows = await db/*sql*/`
      SELECT id, entity, op, payload, extract(epoch from ts)*1000 AS ts
      FROM events
      ORDER BY ts ASC
      LIMIT 20000
    `;
    return NextResponse.json({ ok: true, events: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
