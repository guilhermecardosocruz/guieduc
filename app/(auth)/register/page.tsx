"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import Brand from "@/components/Brand";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) throw new Error("Não foi possível criar a conta");
      router.push("/dashboard");
    } catch (e:any) {
      setErr(e.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <Brand />
          <Link href="/login" className="text-sm underline">Já tenho conta</Link>
        </div>
        <h2 className="form-title">Criar conta</h2>
        <p className="form-subtitle">Comece no GUIEDUC em segundos</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input className="input" required value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Senha</label>
            <input className="input" type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Criando..." : "Criar conta"}</button>
        </form>
      </div>
    </AuthLayout>
  );
}
