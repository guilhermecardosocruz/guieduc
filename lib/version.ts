export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  "dev";

/**
 * Versão de ESQUEMA de dados local (localStorage).
 * Aumente para "2", "3", ... apenas quando houver mudança incompatível.
 * Nunca altere só por deploy; isso evita perder turmas/alunos/chamadas/conteúdos.
 */
export const DATA_SCHEMA =
  process.env.NEXT_PUBLIC_DATA_SCHEMA || "1";
