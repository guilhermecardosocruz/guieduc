-- CreateTable
CREATE TABLE "public"."Chamada" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chamada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chamada_turmaId_date_idx" ON "public"."Chamada"("turmaId", "date");

-- AddForeignKey
ALTER TABLE "public"."Chamada" ADD CONSTRAINT "Chamada_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "public"."Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
