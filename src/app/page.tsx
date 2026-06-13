"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function PNLogo({ size = 48 }: { size?: number }) {
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

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const pills = [
    { label: "Plano personalizado", color: "#1A56A0", bg: "rgba(26,86,160,0.08)",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2L15 8.5 22 9.5 17 14.5 18 22 12 18.5 6 22 7 14.5 2 9.5 9 8.5Z"/></svg> },
    { label: "Baseado em evidências", color: "#1D9E75", bg: "rgba(29,158,117,0.08)",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg> },
    { label: "Consultor IA", color: "#666", bg: "rgba(26,26,26,0.05)",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg> },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-white" style={{ maxWidth: 390, margin: "0 auto" }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16">
        <div className="mb-8">
          <PNLogo size={72} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1A1A1A", letterSpacing: "-0.03em" }}>
          Perso<span style={{ color: "#1D9E75" }}>Nutri</span>
        </h1>
        <p className="text-sm text-center mt-2 leading-relaxed" style={{ color: "#666", maxWidth: 260 }}>
          Nutrição e treino para hipertrofia, guiados por ciência.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {pills.map((p) => (
            <span key={p.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-3 py-1.5"
              style={{ background: p.bg, color: p.color }}>
              {p.icon}
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pt-6 flex flex-col gap-3">
        <button
          onClick={() => router.push("/onboarding/perfil")}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ background: "#1A56A0", color: "#fff", border: "none" }}>
          Criar conta gratuita
        </button>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ background: "transparent", color: "#1A56A0", border: "0.5px solid #1A56A0" }}>
          Já tenho conta
        </button>
        <p className="text-[10px] text-center mt-2 leading-relaxed px-4" style={{ color: "#999" }}>
          Ao continuar, você concorda com os{" "}
          <span className="font-medium" style={{ color: "#1A56A0" }}>Termos de Uso</span> e a{" "}
          <span className="font-medium" style={{ color: "#1A56A0" }}>Política de Privacidade</span>.
        </p>
      </div>
    </div>
  );
}
