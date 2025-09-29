import { redirect } from "next/navigation";

export default async function TurmaIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/turmas/${id}/chamadas`);
}
