import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { computeReport, type PeriodKey, type AulaReport, type RankingItem } from "@/lib/report";
import { getTurma } from "@/lib/storage";

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function gerarRelatorioPDF(turmaId: string, period: PeriodKey) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const turma = getTurma(turmaId);
  const data = computeReport(turmaId, period);
  const inicio = new Date(data.start);
  const fim = new Date(data.now);

  // Cabeçalho
  doc.setFontSize(16);
  doc.text(`GUIEDUC — Relatório de Chamadas`, 40, 40);
  doc.setFontSize(12);
  doc.text(`Turma: ${turma?.nome ?? turmaId}`, 40, 60);
  doc.text(`Período: ${formatDate(inicio)} a ${formatDate(fim)} (${period})`, 40, 78);
  doc.text(`Resumo: ${data.totalAulas} aula(s), ${data.totalAlunos} aluno(s)`, 40, 96);

  // Tabela 1: Presença por aula
  autoTable(doc, {
    startY: 120,
    head: [["Data", "Aula", "Presentes", "% Presença"]],
    body: data.aulas.map((a: AulaReport) => [
      formatDate(a.data),
      a.titulo || "Sem título",
      `${a.presentes}/${a.totalAlunos}`,
      a.pctPresenca == null ? "-" : `${Math.round(a.pctPresenca)}%`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [10, 102, 255] },
    theme: "striped",
  });

  // Tabela 2: Ranking ausentes
  const afterFirst = (doc as any).lastAutoTable?.finalY || 120;
  autoTable(doc, {
    startY: afterFirst + 20,
    head: [["Pos.", "Aluno", "Faltas", "% de faltas"]],
    body: data.ranking.map((r: RankingItem, i: number) => [
      String(i + 1),
      r.nome,
      String(r.faltas),
      `${Math.round(r.taxaFalta)}%`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [10, 102, 255] },
    theme: "striped",
  });

  // Rodapé
  const dateStr = new Date().toLocaleString("pt-BR");
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Gerado em ${dateStr}`, 40, doc.internal.pageSize.getHeight() - 28);
    doc.text(`Página ${i}/${pageCount}`, doc.internal.pageSize.getWidth() - 100, doc.internal.pageSize.getHeight() - 28);
  }

  const turmaSlug = (turma?.nome ?? turmaId).replace(/\s+/g, "-").toLowerCase();
  doc.save(`relatorio-chamadas-${turmaSlug}-${period}.pdf`);
}
