export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  // Linhas de exemplo
  const rows = [
    { Nome: "Ana Silva", Email: "ana.silva@exemplo.com" },
    { Nome: "Bruno Souza", Email: "bruno.souza@exemplo.com" }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["Nome", "Email"] });
  XLSX.utils.book_append_sheet(wb, ws, "Alunos");

  // Gera binário .xlsx
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="alunos-exemplo.xlsx"'
    }
  });
}
