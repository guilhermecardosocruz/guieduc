#!/usr/bin/env bash
set -euo pipefail

clean_header() {
  local F="$1"
  [ -f "$F" ] || { echo "Aviso: não encontrei $F"; return 0; }

  # 0) Backup rápido
  cp "$F" "$F.bak_ts1109" || true

  # 1) Quebrar casos de import colado após aspas
  sed -i 's|";[[:space:]]*{ useParams, useRouter } from "next/navigation";|";\
import { useParams, useRouter } from "next/navigation";|g' "$F"
  sed -i 's|";[[:space:]]*import |";\
import |g' "$F"

  # 2) Se houver "use client" em qualquer lugar, marcar para recolocar no topo
  local HAS_USE_CLIENT="0"
  if grep -q '^"use client";' "$F"; then
    HAS_USE_CLIENT="1"
    sed -i '/^"use client";$/d' "$F"
  fi

  # 3) Cortar QUALQUER conteúdo antes do 1º import/export/"use client"
  #    (remove lixo que deixa parser dentro de expressão)
  #    Mantém do primeiro match em diante.
  awk '
    BEGIN{ keep=0 }
    {
      if(keep==0){
        if($0 ~ /^import / || $0 ~ /^export / || $0 ~ /^"use client";/){
          keep=1
        } else {
          next
        }
      }
      print $0
    }
  ' "$F" > "$F.tmp_cut"

  mv "$F.tmp_cut" "$F"

  # 4) Recolocar "use client" no topo caso existisse
  if [ "$HAS_USE_CLIENT" = "1" ]; then
    sed -i '1i "use client";' "$F"
  fi

  # 5) Normalizar múltiplos imports colados novamente (só por garantia)
  sed -i 's|";[[:space:]]*import |";\
import |g' "$F"
}

fix_file_pair() {
  clean_header 'app/(app)/turmas/[id]/chamadas/[chamadaId]/page.tsx'
  clean_header 'app/(app)/turmas/[id]/chamadas/nova/page.tsx'
}

fix_file_pair
echo "✔ Limpeza aplicada."
