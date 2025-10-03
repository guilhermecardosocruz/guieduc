import {
  listAlunos,
  listChamadas,
  getAulaNumber,
  getConteudoByAula,
  type Chamada,
  type Aluno,
} from "@/lib/storage";

/** Períodos aceitos no baseline (/relatorios): */
export type PeriodKey = "semanal" | "mensal" | "trimestral" | "semestral" | "anual";

/** Relato por aula dentro do período (shape que o PDF espera) */
export type AulaReport = {
  aula: number;           // número (no período) 1..N
  chamadaId: string;
  presentes: number;
  totalAlunos: number;
  pctPresenca: number | null; // 0..100
  data: Date;            // Date (PDF chama formatDate(Date))
  titulo: string;        // título do conteúdo da aula (se houver)
};

/** Ranking (top ausentes/presentes) dentro do período (shape que o PDF espera) */
export type RankingItem = {
  alunoId: string;
  nome: string;
  presencas: number;
  ausencias: number;
  faltas: number;     // alias de ausencias (PDF usa 'faltas')
  taxaFalta: number;  // 0..100
  total: number;      // total de chamadas no período
};

export function computeReport(
  turmaId: string,
  period: PeriodKey,
  refDate: Date = new Date()
): {
  start: number; end: number; now: number;
  totalAulas: number; totalAlunos: number;
  aulas: AulaReport[];
  ranking: RankingItem[];
} {
  const { start, end } = periodRange(period, refDate);
  const now = Date.now();

  const alunos: Aluno[] = listAlunos(turmaId);
  const alunosMap = new Map(alunos.map(a => [a.id, a.nome]));

  // recorte por período
  const chamadasNoPeriodo: Chamada[] = filterChamadasPorPeriodo(turmaId, start, end)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // AulaReport compatível com PDF:
  const aulas: AulaReport[] = chamadasNoPeriodo.map((c, idx) => {
    const presentes = Object.values(c.presencas || {}).filter(Boolean).length;
    const totalAlunos = alunos.length;
    const pctPresenca = totalAlunos > 0 ? (presentes / totalAlunos) * 100 : null;

    // tentar obter título do conteúdo pela numeração global da aula
    const aulaGlobal = getAulaNumber(turmaId, c.id); // -1 se não encontrado
    const conteudo = aulaGlobal > 0 ? getConteudoByAula(turmaId, aulaGlobal) : null;

    return {
      aula: idx + 1, // numeração no período para ordenação
      chamadaId: c.id,
      presentes,
      totalAlunos,
      pctPresenca,
      data: new Date(c.createdAt),   // <-- agora é Date
      titulo: conteudo?.titulo || "",
    };
  });

  // Ranking:
  const totalChamadas = chamadasNoPeriodo.length;
  const presencasCount = new Map<string, number>();
  for (const a of alunos) presencasCount.set(a.id, 0);

  for (const c of chamadasNoPeriodo) {
    const presencas = c.presencas || {};
    for (const a of alunos) {
      if (presencas[a.id]) presencasCount.set(a.id, (presencasCount.get(a.id) ?? 0) + 1);
    }
  }

  const ranking: RankingItem[] = alunos.map(a => {
    const pres = presencasCount.get(a.id) ?? 0;
    const aus = Math.max(totalChamadas - pres, 0);
    const taxaFalta = totalChamadas > 0 ? (aus / totalChamadas) * 100 : 0;
    return {
      alunoId: a.id,
      nome: a.nome,
      presencas: pres,
      ausencias: aus,
      faltas: aus,
      taxaFalta,
      total: totalChamadas,
    };
  }).sort((r1, r2) => {
    if (r2.ausencias !== r1.ausencias) return r2.ausencias - r1.ausencias;
    return r1.nome.localeCompare(r2.nome, "pt-BR", { sensitivity: "base" });
  });

  return {
    start,
    end,
    now,
    totalAulas: totalChamadas,
    totalAlunos: alunos.length,
    aulas,
    ranking,
  };
}

/* ================= Helpers usados ================= */

export function filterChamadasPorPeriodo(
  turmaId: string,
  start: number,
  end: number
): Chamada[] {
  return listChamadas(turmaId).filter(c => {
    const t = new Date(c.createdAt).getTime();
    return t >= start && t <= end;
  });
}

/** Calcula [start,end] em ms para o período selecionado baseado na refDate */
export function periodRange(period: PeriodKey, refDate: Date): { start: number; end: number } {
  const d = new Date(refDate);
  const end = d.getTime();

  function startOfMonth(dt: Date) { return new Date(dt.getFullYear(), dt.getMonth(), 1).getTime(); }
  function startOfQuarter(dt: Date) {
    const q = Math.floor(dt.getMonth() / 3) * 3;
    return new Date(dt.getFullYear(), q, 1).getTime();
  }
  function startOfSemester(dt: Date) {
    const s = dt.getMonth() < 6 ? 0 : 6;
    return new Date(dt.getFullYear(), s, 1).getTime();
  }
  function startOfYear(dt: Date) { return new Date(dt.getFullYear(), 0, 1).getTime(); }

  let start: number;
  switch (period) {
    case "semanal": {
      const wd = d.getDay(); // 0=Dom..6=Sáb
      const mondayOffset = (wd + 6) % 7;
      const monday = new Date(d); monday.setDate(d.getDate() - mondayOffset);
      monday.setHours(0,0,0,0);
      start = monday.getTime();
      break;
    }
    case "mensal":
      start = startOfMonth(d); break;
    case "trimestral":
      start = startOfQuarter(d); break;
    case "semestral":
      start = startOfSemester(d); break;
    case "anual":
      start = startOfYear(d); break;
    default:
      start = startOfMonth(d);
  }
  return { start, end };
}
