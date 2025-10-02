#!/usr/bin/env bash
set -euo pipefail

# Helper para mostrar quais páginas existem
echo "Arquivos de chamadas:"
find app -type f -path "*/turmas/*/chamadas/*/page.tsx" -maxdepth 10 2>/dev/null | sed 's/^/ - /' || true
echo

patch_edit() {
  local FILE_EDIT='app/(app)/turmas/[id]/chamadas/[chamadaId]/page.tsx'
  if [ ! -f "$FILE_EDIT" ]; then
    echo "Aviso: não encontrei $FILE_EDIT"
    return 0
  fi
 # 7.1) Imports: inserir 1x após a primeira linha que começa com 'import '
  grep -q 'from "@/components/chamada/StudentList"' "$FILE_EDIT" || \
  sed -i '0,/^import /s//&\
import StudentList from "@\/components\/chamada\/StudentList";/' "$FILE_EDIT"

  grep -q 'from "@/lib/storage/chamadas"' "$FILE_EDIT" || \
  sed -i '0,/^import /s//&\
import { togglePresenca, updateAlunoNome, deleteAluno, getChamada, upsertChamada } from "@\/lib\/storage\/chamadas";/' "$FILE_EDIT"

  # 7.2) Trocar {alunos.map(...)} por <StudentList .../> (se existir)
  sed -i -E 's@{[[:space:]]*alunos\.map\([^}]*}\s*}@<StudentList turmaId={turmaId} chamadaId={params.chamadaId} alunos={alunos} onTogglePresenca={(alunoId)=>{ togglePresenca(turmaId, params.chamadaId, alunoId); setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,presente:!a.presente}:a)); }} onRename={(alunoId,novoNome)=>{ updateAlunoNome(turmaId, params.chamadaId, alunoId, novoNome); setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,nome:novoNome}:a)); }} onDelete={(alunoId)=>{ deleteAluno(turmaId, params.chamadaId, alunoId); setAlunos(prev=>prev.filter(a=>a.id!==alunoId)); }} />@g' "$FILE_EDIT" || true

  # 7.3) Fallback: se StudentList ainda não estiver presente, inserir após o state 'alunos'
  grep -q 'StudentList turmaId' "$FILE_EDIT" || \
  sed -i '/const \[alunos, setAlunos\]/a \
\
{/* Lista de Alunos (com edição inline) */}\
<StudentList turmaId={turmaId} chamadaId={params.chamadaId} alunos={alunos} onTogglePresenca={(alunoId)=>{ togglePresenca(turmaId, params.chamadaId, alunoId); setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,presente:!a.presente}:a)); }} onRename={(alunoId,novoNome)=>{ updateAlunoNome(turmaId, params.chamadaId, alunoId, novoNome); setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,nome:novoNome}:a)); }} onDelete={(alunoId)=>{ deleteAluno(turmaId, params.chamadaId, alunoId); setAlunos(prev=>prev.filter(a=>a.id!==alunoId)); }} />' "$FILE_EDIT"

  echo "OK: aplicado em $FILE_EDIT"
}

patch_new() {
  local FILE_NEW='app/(app)/turmas/[id]/chamadas/nova/page.tsx'
  if [ ! -f "$FILE_NEW" ]; then
    echo "Aviso: não encontrei $FILE_NEW"
    return 0
  fi
 # 7.4) Imports
  grep -q 'from "@/components/chamada/StudentList"' "$FILE_NEW" || \
  sed -i '0,/^import /s//&\
import StudentList from "@\/components\/chamada\/StudentList";/' "$FILE_NEW"

  grep -q 'from "@/lib/storage/chamadas"' "$FILE_NEW" || \
  sed -i '0,/^import /s//&\
import { togglePresenca, updateAlunoNome, deleteAluno, upsertChamada } from "@\/lib\/storage\/chamadas";/' "$FILE_NEW"

  # 7.5) Substituir {alunos.map(...)} por <StudentList .../> (se existir)
  sed -i -E 's@{[[:space:]]*alunos\.map\([^}]*}\s*}@<StudentList turmaId={turmaId} chamadaId={chamadaId} alunos={alunos} onTogglePresenca={(alunoId)=>{ setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,presente:!a.presente}:a)); }} onRename={(alunoId,novoNome)=>{ setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,nome:novoNome}:a)); }} onDelete={(alunoId)=>{ setAlunos(prev=>prev.filter(a=>a.id!==alunoId)); }} />@g' "$FILE_NEW" || true

  # 7.6) Fallback
  grep -q 'StudentList turmaId' "$FILE_NEW" || \
  sed -i '/const \[alunos, setAlunos\]/a \
\
{/* Lista de Alunos (com edição inline) */}\
<StudentList turmaId={turmaId} chamadaId={chamadaId} alunos={alunos} onTogglePresenca={(alunoId)=>{ setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,presente:!a.presente}:a)); }} onRename={(alunoId,novoNome)=>{ setAlunos(prev=>prev.map(a=>a.id===alunoId?{...a,nome:novoNome}:a)); }} onDelete={(alunoId)=>{ setAlunos(prev=>prev.filter(a=>a.id!==alunoId)); }} />' "$FILE_NEW"

  echo "OK: aplicado em $FILE_NEW"
}
patch_edit
patch_new
