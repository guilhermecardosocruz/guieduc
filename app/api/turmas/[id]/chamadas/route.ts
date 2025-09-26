import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Extrai id da URL (evita tipagem instável do context)
function extractId(req: Request) {
  const segments = new URL(req.url).pathname.split("/");
  // .../api/turmas/{id}/chamadas
  const idx = segments.findIndex((s) => s === "turmas");
  return idx >= 0 ? segments[idx + 1] : undefined;
}

export async function GET(req: Request) {
  try {
    const turmaId = extractId(req);
    if (!turmaId) return NextResponse.json({ ok: false, error: "ID da turma ausente" }, { status: 400 });

    const chamadas = await prisma.$queryRaw<Array<{ id: string; turmaId: string; date: Date; notes: string | null; createdAt: Date }>>(
      Prisma.sql`SELECT id, "turmaId", date, notes, "createdAt"
                 FROM "Chamada"
                 WHERE "turmaId" = ${turmaId}
                 ORDER BY date DESC, "createdAt" DESC`
    );
    return NextResponse.json({ ok: true, chamadas });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro ao listar chamadas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const turmaId = extractId(req);
    if (!turmaId) return NextResponse.json({ ok: false, error: "ID da turma ausente" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const date = body?.date ? new Date(body.date) : new Date();
    const notes = typeof body?.notes === "string" ? body.notes.trim() : null;

    const id = crypto.randomUUID(); // evita depender de extensão SQL
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`INSERT INTO "Chamada" (id, "turmaId", date, notes, "createdAt")
                 VALUES (${id}, ${turmaId}, ${date}, ${notes}, now())
                 RETURNING id`
    );
    return NextResponse.json({ ok: true, chamadaId: rows[0]?.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro ao criar chamada" }, { status: 500 });
  }
}
