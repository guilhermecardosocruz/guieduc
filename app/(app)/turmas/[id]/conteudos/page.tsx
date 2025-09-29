"use client";
import { useParams } from "next/navigation";
import TabBtn from "@/components/TabBtn";

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;

  return (
    <div>
      {/* Botões azuis maiores */}
      <div className="flex gap-2">
        <TabBtn href={`${base}/chamadas`} active={false}>Chamadas</TabBtn>
        <TabBtn href={`${base}/conteudos`} active>Conteúdos</TabBtn>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
        Placeholder de conteúdos.
      </div>
    </div>
  );
}
