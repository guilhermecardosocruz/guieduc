"use client";
import { useParams } from "next/navigation";
import TabBtn from "@/components/TabBtn";

export default function ChamadasPage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;

  return (
    <div>
      {/* Botões azuis maiores */}
      <div className="flex gap-2">
        <TabBtn href={`${base}/chamadas`} active>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active={false}>Conteúdos</TabBtn>
      </div>

      {/* Área da funcionalidade (vazia por enquanto) */}
      <div className="mt-8"></div>
    </div>
  );
}
