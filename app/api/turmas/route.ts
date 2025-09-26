export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const turmas = await prisma.$queryRaw<Array<{ id: string; name: string; createdAt: Date }>>(
      Prisma.sql`SELECT id, name, "createdAt" FROM "Turma" ORDER BY "createdAt" DESC`
    );
    return NextResponse.json({ ok: true, turmas });
  } catch (e) {
    console.error("GET /api/turmas", e);
    return NextResponse.json({ ok: false, error: "Erro ao listar turmas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    const trimmed = String(name ?? "").trim();
    if (trimmed.length < 2) {
      return NextResponse.json({ ok: false, error: "Nome inválido" }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; createdAt: Date }>>(
      Prisma.sql`INSERT INTO "Turma" (id, name, "createdAt")
                 VALUES (${id}, ${trimmed}, now())
                 RETURNING id, name, "createdAt"`
    );
    return NextResponse.json({ ok: true, turma: rows[0] }, { status: 201 });
  } catch (e) {
    console.error("POST /api/turmas", e);
    return NextResponse.json({ ok: false, error: "Erro ao criar turma" }, { status: 500 });
  }
}
