#!/usr/bin/env bash
set -euo pipefail

rebuild() {
  local F="$1"
  [ -f "$F" ] || { echo "Aviso: não encontrei $F"; return 0; }

  cp "$F" "$F.bak_rebuild" || true

  # 1) Normalizar BOM/CRLF
  perl -0777 -pe 's/^\xEF\xBB\xBF//; s/\r//g' "$F" > "$F.__n"

  # 2) Extrair TODOS os imports válidos (linha começando com "import ")
  #    e o restante do código a partir da 1ª linha que NÃO seja "use client" ou import
  awk '
    BEGIN { in_header=1 }
    {
      if (in_header==1) {
        if ($0 ~ /^"use client";[[:space:]]*$/) { next }           # ignora; vamos recolocar no topo
        if ($0 ~ /^import[[:space:]].*;[[:space:]]*$/) {
          print $0 > ".__imports"
          next
        }
        in_header=0
      }
      print $0 > ".__resto"
    }
  ' "$F.__n"

  # 3) Garante nossos imports essenciais (sem duplicar)
  #    - StudentList
  #    - storage/chamadas (com os nomes usados nas páginas)
  touch .__imports
  grep -q 'from "@/components/chamada/StudentList"' .__imports || \
    echo 'import StudentList from "@/components/chamada/StudentList";' >> .__imports

  # Na [chamadaId] usamos getChamada; na "nova" ele pode ficar como unused e o TS só avisa em build estrita.
  # Mantemos o mesmo import, é seguro:
  grep -q 'from "@/lib/storage/chamadas"' .__imports || \
    echo 'import { togglePresenca, updateAlunoNome, deleteAluno, getChamada, upsertChamada } from "@/lib/storage/chamadas";' >> .__imports

  # 4) Ordenar e remover duplicatas dos imports (estável por conteúdo)
  sort -u .__imports > .__imports.sorted

  # 5) Remontar arquivo: "use client" + imports + linha em branco + resto
  {
    echo '"use client";'
    cat .__imports.sorted
    echo
    # Se por acaso __resto começa com "use client" ou imports, não tem problema:
    # mas vamos ainda cortar tudo que seja import/ "use client" redundante no início
    awk '
      BEGIN { start=0 }
      {
        if (start==0) {
          if ($0 ~ /^"use client";/ || $0 ~ /^import /) { next }
          start=1
        }
        print $0
      }
    ' .__resto 2>/dev/null || true
  } > "$F.__rebuilt"

  mv "$F.__rebuilt" "$F"
  rm -f "$F.__n" .__imports .__imports.sorted .__resto 2>/dev/null || true

  echo "✔ Cabeçalho refeito: $F"
}

rebuild 'app/(app)/turmas/[id]/chamadas/[chamadaId]/page.tsx'
rebuild 'app/(app)/turmas/[id]/chamadas/nova/page.tsx'
