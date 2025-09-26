import Link from "next/link";

async function getTurma(id: string) {
  // Tenta absoluto (produção com NEXT_PUBLIC_APP_URL) e relativo
  const abs = process.env.NEXT_PUBLIC_APP_URL
    ? await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/turmas/${id}`, { cache: "no-store" }).catch(() => null)
    : null;

  if (abs && abs.ok) return abs.json();

  const rel = await fetch(`/api/turmas/${id}`, { cache: "no-store" }).catch(() => null);
  if (!rel || !rel.ok) return null;
  return rel.json();
}

// Tipagem compatível com Next 15 typed routes: params é uma Promise
export default async function TurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getTurma(id);
  const turma = data?.turma;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">GUIEDUC</h1>
          <Link href="/dashboard" className="btn-primary">Voltar</Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {turma ? (
            <>
              <h2 className="text-3xl font-bold mb-2">{turma.name}</h2>
              <p className="text-gray-600">Página da turma (em breve: alunos, aulas, chamadas).</p>
            </>
          ) : (
            <p className="text-red-600">Turma não encontrada.</p>
          )}
        </div>
      </main>
    </div>
  );
}
