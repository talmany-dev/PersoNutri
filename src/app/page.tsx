"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: "#1A56A0" }}>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 pt-16 pb-8 gap-6">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ background: "#1D9E75" }}>
          <span className="text-white text-4xl font-black">P</span>
        </div>

        <div className="text-center">
          <h1 className="text-white text-4xl font-black tracking-tight">PersoNutri</h1>
          <p className="text-white/70 text-base mt-2 leading-relaxed">
            Treino e nutrição personalizados<br />para hipertrofia muscular
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {["Progressão dupla", "Diário alimentar", "Check-in diário", "Análise de platôs"].map(f => (
            <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 flex flex-col gap-3">
        <button
          onClick={() => router.push("/onboarding/perfil")}
          className="w-full py-4 rounded-2xl text-base font-bold transition-opacity active:opacity-80"
          style={{ background: "#1D9E75", color: "#fff" }}>
          Criar conta grátis
        </button>

        <button
          onClick={() => router.push("/login")}
          className="w-full py-4 rounded-2xl text-base font-bold border-2 transition-opacity active:opacity-80"
          style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}>
          Já tenho conta
        </button>

        <p className="text-center text-white/40 text-xs mt-1">
          Baseado em evidências científicas · NSCA · ACSM
        </p>
      </div>
    </div>
  );
}
