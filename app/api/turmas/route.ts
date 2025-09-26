import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const turmas = await prisma.turma.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ok: true, turmas });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro ao listar turmas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Nome inválido" }, { status: 400 });
    }
    const turma = await prisma.turma.create({ data: { name: String(name).trim() } });
    return NextResponse.json({ ok: true, turma }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro ao criar turma" }, { status: 500 });
  }
}
