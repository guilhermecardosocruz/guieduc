export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function parseIds(req: Request) {
  const seg = new URL(req.url).pathname.split("/");
  const ti = seg.findIndex((s) => s === "turmas");
  const ci = seg.findIndex((s) => s === "chamadas");
  return {
    turmaId: ti >= 0 ? seg[ti + 1] : undefined,
    chamadaId: ci >= 0 ? seg[ci + 1] : undefined,
  };
}

export async function GET(req: Request) {
  try {
    const { turmaId, chamadaId } = parseIds(req);
    if (!turmaId || !chamadaId) return NextResponse.json({ ok:false, error:"IDs ausentes" }, { status:400 });

    // detalhe da chamada
    const chRows = await prisma.$queryRaw<Array<{ id:string; turmaId:string; date:Date; conteudo:string|null }>>(
      Prisma.sql`SELECT id,"turmaId",date,conteudo FROM "Chamada" WHERE id=${chamadaId} AND "turmaId"=${turmaId} LIMIT 1`
    );
    const chamada = chRows[0];
    if (!chamada) return NextResponse.json({ ok:false, error:"Chamada não encontrada" }, { status:404 });

    // itens (alunos + presença)
    const itens = await prisma.$queryRaw<Array<{ itemId:string; alunoId:string; nome:string; email:string|null; presente:boolean }>>(
      Prisma.sql`
        SELECT ci.id as "itemId", a.id as "alunoId", a.nome, a.email, ci.presente
        FROM "ChamadaItem" ci
        JOIN "Aluno" a ON a.id = ci."alunoId"
        WHERE ci."chamadaId" = ${chamadaId}
        ORDER BY a.nome ASC
      `
    );

    return NextResponse.json({ ok:true, chamada, itens });
  } catch (e) {
    console.error("GET chamada detail", e);
    return NextResponse.json({ ok:false, error:"Erro ao carregar chamada" }, { status:500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { turmaId, chamadaId } = parseIds(req);
    if (!turmaId || !chamadaId) return NextResponse.json({ ok:false, error:"IDs ausentes" }, { status:400 });

    const body = await req.json().catch(() => ({}));
    const date = body?.date ? new Date(body.date) : undefined;
    const conteudo = typeof body?.conteudo === "string" ? body.conteudo.trim() : undefined;
    const alunos: Array<{ nome: string; email?: string | null; presente?: boolean }> = Array.isArray(body?.alunos) ? body.alunos : [];

    // atualiza metadados da chamada
    if (date || typeof conteudo !== "undefined") {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE "Chamada" SET
          date = ${date ?? Prisma.raw(`"Chamada".date`)},
          conteudo = ${typeof conteudo === "undefined" ? Prisma.raw(`"Chamada".conteudo`) : conteudo}
        WHERE id = ${chamadaId} AND "turmaId" = ${turmaId}`
      );
    }

    // regra simples: zera itens e recria conforme envio (mais fácil de manter consistente)
    await prisma.$executeRaw(Prisma.sql`DELETE FROM "ChamadaItem" WHERE "chamadaId" = ${chamadaId}`);

    for (const a of alunos) {
      const nome = String(a?.nome ?? "").trim();
      if (!nome) continue;
      const email = a?.email ?? null;
      const presente = a?.presente ?? true;

      // encontra aluno por nome (case-insensitive) ou cria
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

    return NextResponse.json({ ok:true });
  } catch (e) {
    console.error("PUT chamada detail", e);
    return NextResponse.json({ ok:false, error:"Erro ao salvar chamada" }, { status:500 });
  }
}
