"use client";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";

export default function DashboardPage() {
  const router = useRouter();
  function fakeLogout() { router.push("/login"); }
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Brand />
          <button onClick={fakeLogout} className="btn-primary">Sair</button>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Você está logado(a). Base pronta para evoluir (turmas, aulas, chamadas...).</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-gray-100 p-6 bg-white">Card 1</div>
            <div className="rounded-3xl border border-gray-100 p-6 bg-white">Card 2</div>
            <div className="rounded-3xl border border-gray-100 p-6 bg-white">Card 3</div>
          </div>
        </div>
      </main>
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-gray-500">© GUIEDUC — multiplataforma (Web / Android / iOS)</div>
      </footer>
    </div>
  );
}
