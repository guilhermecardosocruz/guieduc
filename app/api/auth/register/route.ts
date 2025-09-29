import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, token: "demo-token" }, { status: 200 });
}
