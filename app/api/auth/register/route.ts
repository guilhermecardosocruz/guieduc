import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, passwordHash } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
