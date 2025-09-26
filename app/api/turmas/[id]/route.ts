export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function extractId(req: Request) {
  const segments = new URL(req.url).pathname.split("/");
  const idx = segments.findIndex((s) => s === "turmas");
  return idx >= 0 ? segments[idx + 1] : undefined;
}

export async function GET(req: Request) {
  try {
    const id = extractId(req);
    if (!id) return NextResponse.json({ ok: false, error: "ID não informado" }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; createdAt: Date }>>(
      Prisma.sql`SELECT id, name, "createdAt" FROM "Turma" WHERE id = ${id} LIMIT 1`
    );
    const turma = rows[0];
    if (!turma) return NextResponse.json({ ok: false, error: "Turma não encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, turma });
  } catch (e) {
    console.error("GET /api/turmas/[id]", e);
    return NextResponse.json({ ok: false, error: "Erro ao buscar turma" }, { status: 500 });
  }
}
