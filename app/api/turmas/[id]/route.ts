import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || segments.pop();
    if (!id) return NextResponse.json({ ok: false, error: "ID não informado" }, { status: 400 });

    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; createdAt: Date }>>(
      Prisma.sql`SELECT id, name, "createdAt" FROM "Turma" WHERE id = ${id} LIMIT 1`
    );
    const turma = rows[0];
    if (!turma) return NextResponse.json({ ok: false, error: "Turma não encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, turma });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro ao buscar turma" }, { status: 500 });
  }
}
