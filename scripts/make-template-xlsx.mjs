import * as fs from "node:fs";
import * as path from "node:path";
import xlsx from "xlsx";

const headers = [
  "Aula",
  "Título",
  "Conteúdo da Aula",
  "Objetivos",
  "Desenvolvimento das Atividades",
  "Recursos Didáticos",
  "BNCC",
];

const exemplos = [
  [1, "Frações — revisão", "Frações próprias e impróprias", "Revisar conceitos", "Exercícios em dupla", "Quadro, livro", "EF06MA06"],
  [2, "Ângulos", "Tipos de ângulos", "Identificar ângulos", "Atividade em grupo", "Transferidor", "EF07MA12"],
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([headers, ...exemplos]);

// largura de colunas (ajuste fino opcional)
ws["!cols"] = [
  { wch: 6 },   // Aula
  { wch: 24 },  // Título
  { wch: 40 },  // Conteúdo da Aula
  { wch: 28 },  // Objetivos
  { wch: 40 },  // Desenvolvimento
  { wch: 24 },  // Recursos
  { wch: 16 },  // BNCC
];

xlsx.utils.book_append_sheet(wb, ws, "Conteúdos");
const outPath = path.join(process.cwd(), "public", "templates", "conteudos.xlsx");
xlsx.writeFile(wb, outPath);
console.log("Gerado:", outPath);
