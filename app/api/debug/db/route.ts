import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = await prisma.$queryRaw<{ now: Date }[]>`SELECT now()`;
    return NextResponse.json({ ok: true, now: now[0]?.now });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
