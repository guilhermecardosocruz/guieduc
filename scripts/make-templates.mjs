import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function alunosWorkbook() {
  const data = [
    { nome: "Maria Silva" },
    { nome: "João Pereira" },
    { nome: "Ana Costa" },
  ];
  const ws = XLSX.utils.json_to_sheet(data, { header: ["nome"] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alunos");
  return wb;
}

function conteudosWorkbook() {
  const data = [
    { titulo: "Frações — revisão", descricao: "Exercícios 1–10 sobre frações" },
    { titulo: "Sistema Solar", descricao: "Planetas e características" },
  ];
  const ws = XLSX.utils.json_to_sheet(data, { header: ["titulo","descricao"] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Conteudos");
  return wb;
}

function saveWb(wb, outPath) {
  // writeFile (XLSX) retorna ArrayBuffer; convertemos para Buffer p/ salvar
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  writeFileSync(outPath, Buffer.from(buf));
}

const alunosXlsx = __dirname + "/../public/templates/modelo-alunos.xlsx";
const conteudosXlsx = __dirname + "/../public/templates/modelo-conteudos.xlsx";

saveWb(alunosWorkbook(), alunosXlsx);
saveWb(conteudosWorkbook(), conteudosXlsx);

console.log("✔ Planilhas XLSX geradas em public/templates/");
