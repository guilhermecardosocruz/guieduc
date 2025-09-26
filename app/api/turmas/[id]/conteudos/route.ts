export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function turmaIdFrom(req: Request) {
  const seg = new URL(req.url).pathname.split("/");
  const i = seg.findIndex((s) => s === "turmas");
  return i >= 0 ? seg[i + 1] : undefined;
}

export async function GET(req: Request) {
  try {
    const turmaId = turmaIdFrom(req);
    if (!turmaId) return NextResponse.json({ ok:false, error:"ID da turma ausente" }, { status:400 });

    const aulas = await prisma.$queryRaw<Array<{ id:string; numero:number; titulo:string }>>(
      Prisma.sql`SELECT id, numero, titulo FROM "Aula" WHERE "turmaId"=${turmaId} ORDER BY numero ASC, "createdAt" ASC`
    );
    return NextResponse.json({ ok:true, aulas });
  } catch (e) {
    console.error("GET /conteudos", e);
    return NextResponse.json({ ok:false, error:"Erro ao listar aulas" }, { status:500 });
  }
}

/**
 * POST body:
 *  - { numero: number, titulo: string }  // criação única
 *  - { aulas: Array<{ numero: number, titulo: string }> }  // import em lote
 */
export async function POST(req: Request) {
  try {
    const turmaId = turmaIdFrom(req);
    if (!turmaId) return NextResponse.json({ ok:false, error:"ID da turma ausente" }, { status:400 });

    const body = await req.json().catch(() => ({}));
    const aulas = Array.isArray(body?.aulas) ? body.aulas : null;

    if (aulas) {
      // Import em lote
      for (const a of aulas) {
        const numero = Number(a?.numero);
        const titulo = String(a?.titulo ?? "").trim();
        if (!numero || !Number.isFinite(numero) || titulo.length < 1) continue;

        // UPSERT pela chave (turmaId, numero)
        await prisma.$executeRaw(
          Prisma.sql`
            INSERT INTO "Aula" (id, "turmaId", numero, titulo, "createdAt")
            VALUES (${crypto.randomUUID()}, ${turmaId}, ${numero}, ${titulo}, now())
            ON CONFLICT ("turmaId", numero) DO UPDATE SET titulo = EXCLUDED.titulo
          `
        );
      }
      return NextResponse.json({ ok:true });
    } else {
      // Criação única
      const numero = Number(body?.numero);
      const titulo = String(body?.titulo ?? "").trim();
      if (!numero || !Number.isFinite(numero) || titulo.length < 1) {
        return NextResponse.json({ ok:false, error:"Preencha número e título" }, { status:400 });
      }

      const id = crypto.randomUUID();
      const rows = await prisma.$queryRaw<Array<{ id:string }>>(
        Prisma.sql`
          INSERT INTO "Aula" (id, "turmaId", numero, titulo, "createdAt")
          VALUES (${id}, ${turmaId}, ${numero}, ${titulo}, now())
          ON CONFLICT ("turmaId", numero) DO UPDATE SET titulo = EXCLUDED.titulo
          RETURNING id
        `
      );
      return NextResponse.json({ ok:true, id: rows[0]?.id }, { status:201 });
    }
  } catch (e) {
    console.error("POST /conteudos", e);
    return NextResponse.json({ ok:false, error:"Erro ao criar aula" }, { status:500 });
  }
}
