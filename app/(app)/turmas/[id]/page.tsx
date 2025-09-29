"use client";
import { useParams } from "next/navigation";
import { getTurma } from "@/lib/storage";
import TabBtn from "@/components/TabBtn";

export default function TurmaIndexPage() {
  const { id } = useParams<{ id: string }>();
  const turma = typeof window !== "undefined" ? getTurma(id) : null;
  const base = `/turmas/${id}`;

  return (
    <div>
      {/* Botões principais da turma */}
      <div className="flex gap-2">
        {/* Chamadas abre em NOVA ABA */}
        <TabBtn href={`${base}/chamadas`} active newTab>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active={false}>Conteúdos</TabBtn>
      </div>
    </div>
  );
}
