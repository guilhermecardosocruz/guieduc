import { redirect } from "next/navigation";

export default function TurmaIndexPage({ params }: { params: { id: string } }) {
  redirect(`/turmas/${params.id}/chamadas`);
}
