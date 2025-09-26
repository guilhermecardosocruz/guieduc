"use client";
import Link from "next/link";
import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import Brand from "@/components/Brand";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error("Erro ao enviar e-mail");
      setSent(true);
    } catch (e:any) {
      setErr(e.message || "Erro ao recuperar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <Brand />
          <Link href="/login" className="text-sm underline">Voltar ao login</Link>
        </div>
        <h2 className="form-title">Recuperar senha</h2>
        <p className="form-subtitle">Informe seu e-mail para receber as instruções</p>
        {sent ? (
          <p className="text-sm text-green-700">Se existir uma conta para <b>{email}</b>, enviaremos o link de recuperação.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar link"}</button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
