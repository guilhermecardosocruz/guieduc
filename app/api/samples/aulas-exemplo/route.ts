export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const rows = [
    { Numero: 1, Titulo: "Introdução ao conteúdo" },
    { Numero: 2, Titulo: "Prática orientada" }
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["Numero", "Titulo"] });
  XLSX.utils.book_append_sheet(wb, ws, "Aulas");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="aulas-exemplo.xlsx"'
    }
  });
}
