-- CreateTable
CREATE TABLE "public"."Turma" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);
