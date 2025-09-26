import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    // ⚠️ Demo: sem sessão/JWT ainda. Apenas confirma login.
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
