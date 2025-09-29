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
      {/* (opcional) nome da turma no topo já é exibido pelo layout */}
      <div className="flex gap-2">
        <TabBtn href={`${base}/chamadas`} active>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active={false}>Conteúdos</TabBtn>
      </div>
    </div>
  );
}
