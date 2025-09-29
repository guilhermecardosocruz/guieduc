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
