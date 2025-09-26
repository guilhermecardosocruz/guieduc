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

    const chamadas = await prisma.$queryRaw<Array<{ id:string; date:Date; conteudo:string|null }>>(
      Prisma.sql`SELECT id, date, conteudo FROM "Chamada"
                 WHERE "turmaId"=${turmaId}
                 ORDER BY date DESC, "createdAt" DESC`
    );
    return NextResponse.json({ ok:true, chamadas });
  } catch (e) {
    console.error("GET /chamadas", e);
    return NextResponse.json({ ok:false, error:"Erro ao listar chamadas" }, { status:500 });
  }
}

export async function POST(req: Request) {
  try {
    const turmaId = turmaIdFrom(req);
    if (!turmaId) return NextResponse.json({ ok:false, error:"ID da turma ausente" }, { status:400 });

    const body = await req.json().catch(() => ({}));
    const date = body?.date ? new Date(body.date) : new Date();
    const conteudo = typeof body?.conteudo === "string" ? body.conteudo.trim() : null;
    const alunos: Array<{ nome: string; email?: string | null; presente?: boolean }> = Array.isArray(body?.alunos) ? body.alunos : [];

    const chamadaId = crypto.randomUUID();

    // cria chamada
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO "Chamada" (id,"turmaId",date,conteudo,"createdAt")
                 VALUES (${chamadaId}, ${turmaId}, ${date}, ${conteudo}, now())`
    );

    // garante alunos (cria se não existem) e cria itens
    for (const a of alunos) {
      const nome = String(a?.nome ?? "").trim();
      if (!nome) continue;
      const email = a?.email ?? null;
      const presente = a?.presente ?? true;

      // tenta achar aluno
      const found = await prisma.$queryRaw<Array<{ id:string }>>(
        Prisma.sql`SELECT id FROM "Aluno" WHERE "turmaId"=${turmaId} AND lower(nome)=lower(${nome}) LIMIT 1`
      );
      const alunoId = found[0]?.id ?? crypto.randomUUID();

      if (!found[0]) {
        await prisma.$executeRaw(
          Prisma.sql`INSERT INTO "Aluno" (id,"turmaId",nome,email,"createdAt")
                     VALUES (${alunoId}, ${turmaId}, ${nome}, ${email}, now())`
        );
      }

      await prisma.$executeRaw(
        Prisma.sql`INSERT INTO "ChamadaItem" (id,"chamadaId","alunoId",presente)
                   VALUES (${crypto.randomUUID()}, ${chamadaId}, ${alunoId}, ${presente})`
      );
    }

    return NextResponse.json({ ok:true, chamadaId }, { status:201 });
  } catch (e) {
    console.error("POST /chamadas", e);
    return NextResponse.json({ ok:false, error:"Erro ao criar chamada" }, { status:500 });
  }
}
