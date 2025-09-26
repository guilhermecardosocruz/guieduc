-- CreateTable
CREATE TABLE "public"."Aula" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aula_turmaId_numero_idx" ON "public"."Aula"("turmaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Aula_turmaId_numero_key" ON "public"."Aula"("turmaId", "numero");

-- AddForeignKey
ALTER TABLE "public"."Aula" ADD CONSTRAINT "Aula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
