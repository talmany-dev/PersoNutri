"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function PNLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#1A56A0"/>
      <path d="M14 34 L14 16 L24 16 C28 16 30 18 30 22 C30 26 28 28 24 28 L14 28"
        stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M24 28 L24 34" stroke="#1D9E75" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="34" cy="14" r="4" fill="#1D9E75"/>
    </svg>
  );
}

function AuthInput({ label, type = "text", placeholder, icon, value, onChange }: {
  label: string; type?: string; placeholder: string;
  icon: React.ReactNode; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "#1A1A1A" }}>{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#666" }}>
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg text-sm py-3 outline-none"
          style={{ border: "0.5px solid #E5E5E5", paddingLeft: 40, paddingRight: 14, color: "#1A1A1A", background: "#fff" }}
        />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.27l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z"/>
    </svg>
  );
}

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
    if (error) { setErro("E-mail ou senha incorretos."); return; }
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-dvh bg-white" style={{ maxWidth: 390, margin: "0 auto" }}>
      {/* Back */}
      <div className="px-5 pt-4">
        <button onClick={() => router.push("/")}
          className="w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ background: "transparent", border: "none", color: "#1A1A1A", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleLogin} className="flex-1 px-6 pt-6 pb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-1">
          <PNLogo size={36} />
          <h1 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Bem-vindo de volta</h1>
        </div>
        <p className="text-sm mb-8" style={{ color: "#666" }}>Entre na sua conta para continuar.</p>

        {erro && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#991B1B" }}>
            {erro}
          </div>
        )}

        {/* Social */}
        <div className="flex flex-col gap-2.5 mb-5">
          {([
            { label: "Continuar com Google", icon: <GoogleIcon /> },
            { label: "Continuar com Apple",  icon: <AppleIcon /> },
          ] as const).map(({ label, icon }) => (
            <button key={label} type="button"
              className="flex items-center justify-center gap-2.5 w-full rounded-lg py-3 px-4 text-sm font-medium"
              style={{ background: "#fff", border: "0.5px solid #E5E5E5", color: "#1A1A1A", cursor: "pointer" }}>
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "#E5E5E5" }}></div>
          <span className="text-xs font-medium" style={{ color: "#666" }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "#E5E5E5" }}></div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <AuthInput label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={setEmail}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>} />
          <AuthInput label="Senha" type="password" placeholder="••••••••" value={senha} onChange={setSenha}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>} />
          <div className="flex justify-end">
            <span className="text-xs font-medium" style={{ color: "#1A56A0", cursor: "pointer" }}>Esqueci minha senha</span>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold mt-6 transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: "#1A56A0", color: "#fff", border: "none", cursor: "pointer" }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="text-sm text-center mt-6" style={{ color: "#666" }}>
          Não tem conta?{" "}
          <span onClick={() => router.push("/onboarding/perfil")}
            className="font-semibold" style={{ color: "#1A56A0", cursor: "pointer" }}>
            Cadastre-se
          </span>
        </p>
      </form>
    </div>
  );
}
