import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
