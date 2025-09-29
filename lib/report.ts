import { listAlunos, listChamadas, type Chamada, type Aluno } from "@/lib/storage";

export type PeriodKey = "semanal" | "mensal" | "trimestral" | "semestral" | "anual";

export type AulaReport = {
  id: string;
  titulo: string;
  data: Date;
  presentes: number;
  totalAlunos: number;
  pctPresenca: number | null;
};

export type RankingItem = {
  alunoId: string;
  nome: string;
  faltas: number;
  taxaFalta: number;
};

export type Report = {
  start: number;
  now: number;
  totalAulas: number;
  totalAlunos: number;
  aulas: AulaReport[];
  ranking: RankingItem[];
};

function periodToMs(k: PeriodKey): number {
  const day = 24 * 60 * 60 * 1000;
  switch (k) {
    case "semanal": return 7 * day;
    case "mensal": return 30 * day;
    case "trimestral": return 90 * day;
    case "semestral": return 182 * day;
    case "anual": return 365 * day;
  }
}

export function computeReport(turmaId: string, period: PeriodKey): Report {
  const now = Date.now();
  const start = now - periodToMs(period);
  const alunos: Aluno[] = listAlunos(turmaId);
  const chamadas: Chamada[] = listChamadas(turmaId).filter(c => c.createdAt >= start && c.createdAt <= now);

  const totalAlunos = alunos.length || 0;

  const aulas: AulaReport[] = chamadas.map((c) => {
    let presentes = 0;
    if (totalAlunos > 0) {
      for (const a of alunos) if (c.presencas[a.id]) presentes++;
    }
    const pct = totalAlunos > 0 ? (presentes / totalAlunos) * 100 : null;
    return {
      id: c.id,
      titulo: c.titulo || "Sem título",
      data: new Date(c.createdAt),
      presentes,
      totalAlunos,
      pctPresenca: pct,
    };
  });

  const faltasPorAluno = new Map<string, number>();
  for (const a of alunos) faltasPorAluno.set(a.id, 0);
  for (const c of chamadas) {
    for (const a of alunos) {
      const presente = !!c.presencas[a.id];
      if (!presente) faltasPorAluno.set(a.id, (faltasPorAluno.get(a.id) || 0) + 1);
    }
  }
  const totalAulas = chamadas.length;
  const ranking: RankingItem[] = alunos
    .map((a) => {
      const faltas = faltasPorAluno.get(a.id) || 0;
      const taxaFalta = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0;
      return { alunoId: a.id, nome: a.nome, faltas, taxaFalta };
    })
    .filter(r => r.faltas > 0 || totalAulas > 0)
    .sort((a, b) => b.faltas - a.faltas || b.taxaFalta - a.taxaFalta || a.nome.localeCompare(b.nome));

  return { start, now, totalAulas, totalAlunos, aulas, ranking };
}
