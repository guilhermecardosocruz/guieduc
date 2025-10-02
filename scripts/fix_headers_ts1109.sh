#!/usr/bin/env bash
set -euo pipefail

fix_header() {
  local F="$1"
  if [ ! -f "$F" ]; then
    echo "Aviso: não encontrei $F"
    return 0
  fi

  cp "$F" "$F.bak_ts1109" || true

  # 0) Remover BOM e CR (Windows) por segurança
  #    - BOM UTF-8: \xEF\xBB\xBF
  perl -0777 -pe 's/^\xEF\xBB\xBF//; s/\r//g' "$F" > "$F.__tmp1"

  # 1) Quebrar casos de imports colados
  sed -i 's|";[[:space:]]*{ useParams, useRouter } from "next/navigation";|";\
import { useParams, useRouter } from "next/navigation";|g' "$F.__tmp1"
  sed -i 's|";[[:space:]]*import |";\
import |g' "$F.__tmp1"

  # 2) Remover qualquer conteúdo ANTES do primeiro import/export/"use client"
  #    (isso elimina tokens soltos como "}" que causam TS1109)
  perl -0777 -pe '
    # mantém somente a partir da primeira linha que comece com:
    #  "use client";  OU  import  OU  export
    if ($. == 0) { }
  ' "$F.__tmp1" > "$F.__tmp2"
  # A expressão acima precisa de um corte real: usamos awk
  awk '
    BEGIN { keep=0 }
    {
      if (keep==0) {
        if ($0 ~ /^"use client";/ || $0 ~ /^import / || $0 ~ /^export /) { keep=1 }
        else { next }
      }
      print $0
    }
  ' "$F.__tmp1" > "$F.__tmp2"

  # 3) Se houver múltiplos "use client", manter apenas 1 no topo
  if grep -q '^"use client";' "$F.__tmp2"; then
    # remove todas ocorrências
    sed -i '/^"use client";$/d' "$F.__tmp2"
    # recoloca uma no topo
    sed -i '1i "use client";' "$F.__tmp2"
  fi

  # 4) Normalizar novamente imports colados (garantia)
  sed -i 's|";[[:space:]]*import |";\
import |g' "$F.__tmp2"

  # 5) Salvar de volta
  mv "$F.__tmp2" "$F"
  rm -f "$F.__tmp1" 2>/dev/null || true

  echo "✔ Header limpo: $F"
}

fix_header 'app/(app)/turmas/[id]/chamadas/[chamadaId]/page.tsx'
fix_header 'app/(app)/turmas/[id]/chamadas/nova/page.tsx'

# Mostrar cabeçalho para conferência
echo "=== HEAD [chamadaId] ==="
head -n 8 'app/(app)/turmas/[id]/chamadas/[chamadaId]/page.tsx' || true
echo "=== HEAD nova ==="
head -n 8 'app/(app)/turmas/[id]/chamadas/nova/page.tsx' || true
