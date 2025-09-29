"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import Brand from "@/components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function inferNameFromEmail(e: string) {
    const part = e.split("@")[0] || "";
    if (!part) return "Usuário";
    // capitaliza primeiras letras
    return part
      .replace(/[._-]+/g, " ")
      .split(" ")
      .map(w => w ? (w[0].toUpperCase() + w.slice(1)) : w)
      .join(" ");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error("Credenciais inválidas");

      // mock: salvar usuário local
      const user = { name: inferNameFromEmail(email), email };
      if (typeof window !== "undefined") {
        localStorage.setItem("guieduc:user", JSON.stringify(user));
      }

      router.push("/dashboard");
    } catch (e:any) {
      setErr(e.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <Brand />
          <Link href="/register" className="text-sm underline">Criar conta</Link>
        </div>
        <h2 className="form-title">Entrar</h2>
        <p className="form-subtitle">Acesse sua conta GUIEDUC</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </div>
          <div>
            <label className="block text-sm mb-1">Senha</label>
            <input className="input" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/recover" className="text-sm underline">Esqueci minha senha</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
