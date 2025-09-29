"use client";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ChamadasHomePage() {
  const { id } = useParams<{ id: string }>();
  const base = `/turmas/${id}`;

  return (
    <div>
      <div className="flex gap-2">
        <Link href={`${base}/chamadas/nova`} className="btn-primary">Adicionar chamadas</Link>
      </div>
    </div>
  );
}
