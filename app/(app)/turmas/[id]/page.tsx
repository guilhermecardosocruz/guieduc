"use client";
import { useParams } from "next/navigation";
import TabBtn from "@/components/TabBtn";

export default function TurmaIndexPage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;

  return (
    <div>
      <div className="flex gap-2">
        <TabBtn href={`${base}/chamadas`} active>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active={false}>Conteúdos</TabBtn>
      </div>
    </div>
  );
}
