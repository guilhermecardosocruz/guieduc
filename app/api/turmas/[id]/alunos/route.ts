export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function turmaIdFrom(req: Request) {
  const seg = new URL(req.url).pathname.split("/");
  const i = seg.findIndex(s => s === "turmas");
  return i >= 0 ? seg[i + 1] : undefined;
}

export async function GET(req: Request) {
  try {
    const turmaId = turmaIdFrom(req);
    if (!turmaId) return NextResponse.json({ ok:false, error:"ID da turma ausente" }, { status:400 });
    const alunos = await prisma.$queryRaw<Array<{ id:string; nome:string; email:string|null }>>(
      Prisma.sql`SELECT id, nome, email FROM "Aluno" WHERE "turmaId"=${turmaId} ORDER BY nome ASC`
    );
    return NextResponse.json({ ok:true, alunos });
  } catch (e) {
    console.error("GET /alunos", e);
    return NextResponse.json({ ok:false, error:"Erro ao listar alunos" }, { status:500 });
  }
}

export async function POST(req: Request) {
  try {
    const turmaId = turmaIdFrom(req);
    if (!turmaId) return NextResponse.json({ ok:false, error:"ID da turma ausente" }, { status:400 });
    const { nome, email } = await req.json();
    const n = String(nome ?? "").trim();
    if (n.length < 2) return NextResponse.json({ ok:false, error:"Nome inválido" }, { status:400 });
    const id = crypto.randomUUID();
    const rows = await prisma.$queryRaw<Array<{ id:string }>>(
      Prisma.sql`INSERT INTO "Aluno" (id,"turmaId",nome,email,"createdAt")
                 VALUES (${id}, ${turmaId}, ${n}, ${email ?? null}, now())
                 RETURNING id`
    );
    return NextResponse.json({ ok:true, id: rows[0]?.id }, { status:201 });
  } catch (e) {
    console.error("POST /alunos", e);
    return NextResponse.json({ ok:false, error:"Erro ao criar aluno" }, { status:500 });
  }
}
