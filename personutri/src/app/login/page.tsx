"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      <header style={{ background: "#1A56A0" }} className="px-5 pt-12 pb-8 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#1D9E75" }}>
          <span className="text-white text-2xl font-black">P</span>
        </div>
        <h1 className="text-white text-2xl font-bold">PersoNutri</h1>
        <p className="text-white/60 text-sm">Entre na sua conta</p>
      </header>

      <form onSubmit={handleLogin} className="flex flex-col flex-1 px-5 py-8 gap-4">
        {erro && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#991B1B" }}>
            {erro}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">E-mail</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com" required autoComplete="email"
            className="w-full px-3 py-3 rounded-xl border border-border text-sm outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text">Senha</label>
          <input
            type="password" value={senha} onChange={e => setSenha(e.target.value)}
            placeholder="••••••••" required autoComplete="current-password"
            className="w-full px-3 py-3 rounded-xl border border-border text-sm outline-none bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <button
          type="submit" disabled={loading}
          style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base mt-2 disabled:opacity-60 transition-opacity active:opacity-80">
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <div className="text-center mt-2">
          <p className="text-sm text-muted">
            Primeira vez?{" "}
            <a href="/onboarding/perfil" className="font-bold" style={{ color: "#1A56A0" }}>
              Criar conta
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
