#!/usr/bin/env bash
set -euo pipefail

rebuild_header() {
  local F="$1"
  local TMP="$F.__tmp"
  local CLEAN="$F.__clean"

  if [ ! -f "$F" ]; then
    echo "Aviso: não encontrei $F"
    return 0
  fi

  cp "$F" "$F.bak_header" || true

  # 1) Normalizar CRLF/BOM e quebrar imports colados
  perl -0777 -pe 's/^\xEF\xBB\xBF//; s/\r//g' "$F" > "$TMP"
  sed -i 's|";[[:space:]]*{ useParams, useRouter } from "next/navigation";|";\
import { useParams, useRouter } from "next/navigation";|g' "$TMP"
  sed -i 's|";[[:space:]]*import |";\
import |g' "$TMP"

  # 2) Remover tudo que vier ANTES do 1º import/export/"use client"
  awk '
    BEGIN { keep=0 }
    {
      if (keep==0) {
        if ($0 ~ /^"use client";/ || $0 ~ /^import / || $0 ~ /^export /) { keep=1 } else { next }
      }
      print $0
    }
  ' "$TMP" > "$CLEAN"

  # 3) Remover imports existentes para evitar duplicar StudentList/storage
  #    (os demais imports continuam intactos)
  sed -i '/from "@\/components\/chamada\/StudentList"/d' "$CLEAN"
  sed -i '/from "@\/lib\/storage\/chamadas"/d' "$CLEAN"

  # 4) Se havia "use client" espalhado, remover e recolocar só no topo depois
  sed -i '/^"use client";$/d' "$CLEAN"

  # 5) Escrever novo arquivo com cabeçalho sólido + conteúdo limpo
  cat > "$F" <<'HEAD'
"use client";
import StudentList from "@/components/chamada/StudentList";
import { togglePresenca, updateAlunoNome, deleteAluno, getChamada, upsertChamada } from "@/lib/storage/chamadas";
HEAD
  # (OBS: Na página "nova", getChamada não é usado; manter aqui não quebra e evita condicional. O TS remove unused na build.)

  # 6) Anexar conteúdo original limpo (mantendo todo o resto, sem mexer no JSX/layout)
  cat "$CLEAN" >> "$F"

  rm -f "$TMP" "$CLEAN" 2>/dev/null || true
  echo "✔ Cabeçalho reconstruído: $F"
}

rebuild_header 'app/(app)/turmas/[id]/chamadas/[chamadaId]/page.tsx'
rebuild_header 'app/(app)/turmas/[id]/chamadas/nova/page.tsx'
