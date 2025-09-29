"use client";
import { useParams } from "next/navigation";
import TabBtn from "@/components/TabBtn";

export default function TurmaIndexPage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;

  return (
    <div>
      <div className="flex gap-2">
        {/* ambas em nova aba/página */}
        <TabBtn href={`${base}/chamadas`} active newTab>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active={false} newTab>Conteúdos</TabBtn>
      </div>
    </div>
  );
}
