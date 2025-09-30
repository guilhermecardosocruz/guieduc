import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const events = Array.isArray(body?.events) ? body.events : [];

    if (!events.length) {
      return NextResponse.json({ ok: true, saved: 0 }, { status: 200 });
    }

    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
      return NextResponse.json({ ok: true, saved: 0, note: "NEON_DATABASE_URL ausente; sync no-op" }, { status: 200 });
    }

    const db = getDb();
    await db/*sql*/`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        entity TEXT NOT NULL,
        op TEXT NOT NULL,
        payload JSONB NOT NULL,
        ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const values = events.map((e:any) => ({
      id: String(e.id),
      entity: String(e.entity),
      op: String(e.op),
      payload: e.payload ?? {},
      ts: new Date(e.ts || Date.now()).toISOString(),
    }));

    await db/*sql*/`
      INSERT INTO events (id, entity, op, payload, ts)
      SELECT * FROM jsonb_to_recordset(${JSON.stringify(values)}::jsonb)
      AS x(id text, entity text, op text, payload jsonb, ts timestamptz)
      ON CONFLICT (id) DO NOTHING;
    `;

    return NextResponse.json({ ok: true, saved: values.length }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
