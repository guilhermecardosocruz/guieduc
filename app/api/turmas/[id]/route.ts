import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // pathname ex.: /api/turmas/ck_123
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1] || segments[segments.length - 2]; // tolera barra final
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID não informado" }, { status: 400 });
    }

    const turma = await prisma.turma.findUnique({ where: { id } });
    if (!turma) {
      return NextResponse.json({ ok: false, error: "Turma não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, turma });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro ao buscar turma" }, { status: 500 });
  }
}
