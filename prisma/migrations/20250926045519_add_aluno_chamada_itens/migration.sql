/*
  Warnings:

  - You are about to drop the column `notes` on the `Chamada` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Chamada" DROP COLUMN "notes",
ADD COLUMN     "conteudo" TEXT;

-- CreateTable
CREATE TABLE "public"."Aluno" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChamadaItem" (
    "id" TEXT NOT NULL,
    "chamadaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChamadaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aluno_turmaId_nome_idx" ON "public"."Aluno"("turmaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "ChamadaItem_chamadaId_alunoId_key" ON "public"."ChamadaItem"("chamadaId", "alunoId");

-- AddForeignKey
ALTER TABLE "public"."Aluno" ADD CONSTRAINT "Aluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChamadaItem" ADD CONSTRAINT "ChamadaItem_chamadaId_fkey" FOREIGN KEY ("chamadaId") REFERENCES "public"."Chamada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChamadaItem" ADD CONSTRAINT "ChamadaItem_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "public"."Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
