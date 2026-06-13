"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RecomendacaoTreino {
  divisao: string;
  justificativa: string;
  estrutura_semanal: string[];
  volume_recomendado: string;
  progressao: string;
  dicas: string[];
}

interface RecomendacaoNutricao {
  distribuicao_macros: string;
  timing_pre_treino: string;
  timing_pos_treino: string;
  alimentos_prioritarios: string[];
  estrategia_proteina: string;
  dicas: string[];
}

interface Recomendacoes {
  treino: RecomendacaoTreino;
  nutricao: RecomendacaoNutricao;
  resumo: string;
  referencias: string[];
}

type Stage = "loading" | "ready" | "error";

const LOADING_MESSAGES = [
  "Analisando seu perfil…",
  "Calculando volume ideal de treino…",
  "Ajustando timing nutricional…",
  "Gerando recomendações personalizadas…",
];

export default function RecomendacoesPage() {
  const router = useRouter();
  const [stage, setStage]                   = useState<Stage>("loading");
  const [recomendacoes, setRecomendacoes]   = useState<Recomendacoes | null>(null);
  const [loadingMsg, setLoadingMsg]         = useState(0);
  const [activeTab, setActiveTab]           = useState<"treino" | "nutricao">("treino");
  const [error, setError]                   = useState("");

  // Rotaciona as mensagens de loading
  useEffect(() => {
    if (stage !== "loading") return;
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [stage]);

  // Busca recomendações
  useEffect(() => {
    async function fetchRecomendacoes() {
      const perfil = JSON.parse(localStorage.getItem("personutri_profile") || "{}");
      const anamnese = JSON.parse(localStorage.getItem("personutri_anamnese") || "{}");
      const payload = { ...perfil, ...anamnese };

      try {
        const res = await fetch("/api/recomendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Persiste as recomendações para uso no app
        localStorage.setItem("personutri_recomendacoes", JSON.stringify(data));
        setRecomendacoes(data);
        setStage("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
        setStage("error");
      }
    }
    fetchRecomendacoes();
  }, []);

  /* ── Loading ── */
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-8 px-8" style={{ background: "#F7F7F7" }}>
        <div className="relative">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
            style={{ background: "#EFF6FF", border: "2px solid #BFDBFE" }}>
            🧠
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: "#1A56A0" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1A1A1A" }}>IA analisando seu perfil</h2>
          <p className="text-sm transition-all duration-500" style={{ color: "#666" }}>
            {LOADING_MESSAGES[loadingMsg]}
          </p>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: "#1A56A0", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>

        <p className="text-xs text-center" style={{ color: "#CCC" }}>
          Baseado em evidências científicas peer-reviewed
        </p>
      </div>
    );
  }

  /* ── Error ── */
  if (stage === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-5 px-6" style={{ background: "#F7F7F7" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "#FEF2F2" }}>⚠️</div>
        <div className="text-center">
          <h2 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Não foi possível gerar as recomendações</h2>
          <p className="text-sm mt-1" style={{ color: "#666" }}>{error}</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => { setStage("loading"); setError(""); }}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: "#1A56A0" }}>
            Tentar novamente
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "#F3F4F6", color: "#666" }}>
            Pular e ir ao dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Ready ── */
  const rec = recomendacoes!;

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: "#F7F7F7" }}>
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
            style={{ background: "rgba(255,255,255,0.2)" }}>✓</div>
          <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Onboarding completo</span>
        </div>
        <h1 className="text-white text-2xl font-bold leading-tight">Seu plano personalizado</h1>
        <p className="text-white/70 text-sm mt-1">Gerado pela IA com base no seu perfil</p>
      </header>

      <div className="flex flex-col gap-4 px-4 py-5 pb-8 max-w-[390px] mx-auto w-full">

        {/* Resumo */}
        <div className="rounded-2xl px-4 py-4 flex gap-3" style={{ background: "#EFF6FF", border: "0.5px solid #BFDBFE" }}>
          <span className="text-xl flex-shrink-0">🎯</span>
          <p className="text-sm leading-relaxed" style={{ color: "#1A3A6A" }}>{rec.resumo}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "#ECECEC" }}>
          {([
            { id: "treino",  label: "🏋️ Treino"   },
            { id: "nutricao", label: "🥗 Nutrição" },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: activeTab === tab.id ? "#fff" : "transparent",
                color: activeTab === tab.id ? "#1A56A0" : "#999",
                boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Treino */}
        {activeTab === "treino" && (
          <div className="flex flex-col gap-3">
            {/* Divisão recomendada */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-3" style={{ border: "0.5px solid #E5E5E5" }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "#EFF6FF" }}>🗓️</div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#999" }}>Divisão recomendada</p>
                  <p className="text-base font-bold mt-0.5" style={{ color: "#1A56A0" }}>{rec.treino.divisao}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#444" }}>{rec.treino.justificativa}</p>
            </div>

            {/* Estrutura semanal */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "0.5px solid #E5E5E5" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Estrutura semanal</p>
              <div className="flex flex-col gap-2">
                {rec.treino.estrutura_semanal.map((dia, i) => (
                  <div key={i} className="flex items-start gap-3 py-2"
                    style={{ borderBottom: i < rec.treino.estrutura_semanal.length - 1 ? "0.5px solid #F0F0F0" : "none" }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "#EFF6FF", color: "#1A56A0" }}>
                      {i + 1}
                    </div>
                    <p className="text-sm leading-snug" style={{ color: "#1A1A1A" }}>{dia}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume e progressão */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-3" style={{ border: "0.5px solid #E5E5E5" }}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#999" }}>Volume semanal</p>
                <p className="text-sm" style={{ color: "#1A1A1A" }}>{rec.treino.volume_recomendado}</p>
              </div>
              <div style={{ borderTop: "0.5px solid #F0F0F0", paddingTop: 12 }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#999" }}>Progressão</p>
                <p className="text-sm" style={{ color: "#1A1A1A" }}>{rec.treino.progressao}</p>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "0.5px solid #E5E5E5" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Dicas baseadas em evidências</p>
              <div className="flex flex-col gap-2.5">
                {rec.treino.dicas.map((dica, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "#ECFDF5" }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    </div>
                    <p className="text-sm leading-snug" style={{ color: "#444" }}>{dica}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Nutrição */}
        {activeTab === "nutricao" && (
          <div className="flex flex-col gap-3">
            {/* Macros */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-2" style={{ border: "0.5px solid #E5E5E5" }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "#ECFDF5" }}>📊</div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#999" }}>Distribuição de macros</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#444" }}>{rec.nutricao.distribuicao_macros}</p>
            </div>

            {/* Timing */}
            <div className="bg-white rounded-2xl p-4 flex flex-col gap-3" style={{ border: "0.5px solid #E5E5E5" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#999" }}>Timing nutricional</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">⚡</span>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#1A56A0" }}>Pré-treino</p>
                    <p className="text-sm leading-snug" style={{ color: "#444" }}>{rec.nutricao.timing_pre_treino}</p>
                  </div>
                </div>
                <div style={{ borderTop: "0.5px solid #F0F0F0" }} />
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">🔄</span>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#1D9E75" }}>Pós-treino</p>
                    <p className="text-sm leading-snug" style={{ color: "#444" }}>{rec.nutricao.timing_pos_treino}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alimentos prioritários */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "0.5px solid #E5E5E5" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Alimentos prioritários</p>
              <div className="flex flex-col gap-2">
                {rec.nutricao.alimentos_prioritarios.map((alimento, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5"
                    style={{ borderBottom: i < rec.nutricao.alimentos_prioritarios.length - 1 ? "0.5px solid #F5F5F5" : "none" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "#FFF7ED" }}>
                      <span style={{ fontSize: 10 }}>⭐</span>
                    </div>
                    <p className="text-sm leading-snug" style={{ color: "#444" }}>{alimento}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Estratégia proteína */}
            <div className="rounded-2xl px-4 py-3.5 flex gap-3" style={{ background: "#EFF6FF", border: "0.5px solid #BFDBFE" }}>
              <span className="text-lg flex-shrink-0">💪</span>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#1A56A0" }}>Estratégia proteica</p>
                <p className="text-sm leading-relaxed" style={{ color: "#1A3A6A" }}>{rec.nutricao.estrategia_proteina}</p>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "0.5px solid #E5E5E5" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Dicas nutricionais</p>
              <div className="flex flex-col gap-2.5">
                {rec.nutricao.dicas.map((dica, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "#ECFDF5" }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    </div>
                    <p className="text-sm leading-snug" style={{ color: "#444" }}>{dica}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referências */}
            {rec.referencias?.length > 0 && (
              <div className="rounded-2xl px-4 py-3.5" style={{ background: "#F9FAFB", border: "0.5px solid #E5E5E5" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#BBB" }}>Referências</p>
                {rec.referencias.map((ref, i) => (
                  <p key={i} className="text-[11px] leading-snug" style={{ color: "#AAA" }}>• {ref}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <button onClick={() => router.push("/dashboard")}
          className="w-full text-white font-bold py-4 rounded-2xl text-sm transition-opacity active:opacity-80 mt-2"
          style={{ background: "#1A56A0" }}>
          Ir para o dashboard →
        </button>
      </div>
    </div>
  );
}
