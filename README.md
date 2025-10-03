# GUIEDUC — PWA

Stack: Next.js 15, React 19, TypeScript, TailwindCSS, next-pwa.  
Tema: primário branco, secundário azul (#0A66FF).

Rotas:
- /login
- /register
- /recover
- /dashboard

PWA:
- Manifest: /public/manifest.webmanifest
- Ícones: /public/icons/*
- Service Worker: gerado no build (produção) pelo next-pwa

APIs de autenticação são **mockadas** (apenas para a demo). Troque por NextAuth, JWT ou backend próprio depois.

## Atualização automática ao mudar versão
- O app compara NEXT_PUBLIC_APP_VERSION (ou commit do Vercel) com um valor salvo em localStorage.
- Se mudou, ele limpa caches (PWA) e chaves `guieduc:*` do localStorage, pede `SKIP_WAITING` ao SW e recarrega a página.
- No Vercel, configure o build command como:
  `NEXT_PUBLIC_APP_VERSION=$VERCEL_GIT_COMMIT_SHA pnpm build`
