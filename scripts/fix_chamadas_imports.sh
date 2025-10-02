#!/usr/bin/env bash
set -euo pipefail

fix_one() {
  local F="$1"
  if [ ! -f "$F" ]; then
    echo "Aviso: não encontrei $F"
    return 0
  fi

  # 1) Corrige o caso: import "...StudentList";{ useParams, useRouter } from "next/navigation";
  sed -i 's|";[[:space:]]*{ useParams, useRouter } from "next/navigation";|";\
import { useParams, useRouter } from "next/navigation";|g' "$F"

  # 2) Qualquer ocorrência de '";import ' colada -> quebra em nova linha
  sed -i 's|";[[:space:]]*import |";\
import |g' "$F"

  # 3) (opcional e seguro) manter "use client" como 1ª linha, se já existir no arquivo
  if grep -q '^"use client";$' "$F"; then
    sed -i '/^"use client";$/d' "$F"
    sed -i '1i "use client";' "$F"
  fi

  echo "OK: corrigido $F"
}

fix_one 'app/(app)/turmas/[id]/chamadas/[chamadaId]/page.tsx'
fix_one 'app/(app)/turmas/[id]/chamadas/nova/page.tsx'
