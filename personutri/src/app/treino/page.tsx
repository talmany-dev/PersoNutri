"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type StatusSessao = "concluida" | "pendente" | "descanso" | "hoje";

interface SessaoPlano {
  id: string;
  nome: string;
  dia_semana: number;
  eh_descanso: boolean;
  grupos_musculares: string[];
  status: StatusSessao;
  num_exercicios?: number;
  volume_series?: number;
}

interface PlanoTreino {
  id: string;
  nome: string;
  divisao: string;
  semanas_previstas: number;
  versao: number;
  sessoes: SessaoPlano[];
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Mock plan — substitua pela query Supabase quando conectado
const PLANO_MOCK: PlanoTreino = {
  id: "mock-1",
  nome: "PPL Intermediário — Rafael",
  divisao: "Push / Pull / Legs",
  semanas_previstas: 12,
  versao: 1,
  sessoes: [
    { id: "s1", nome: "Push A — Peito + Tríceps",     dia_semana: 1, eh_descanso: false, grupos_musculares: ["Peito","Tríceps","Ombros"],   status: "concluida", num_exercicios: 5, volume_series: 18 },
    { id: "s2", nome: "Pull A — Costas + Bíceps",     dia_semana: 2, eh_descanso: false, grupos_musculares: ["Costas","Bíceps"],           status: "concluida", num_exercicios: 5, volume_series: 16 },
    { id: "s3", nome: "Legs A — Quadríceps",          dia_semana: 3, eh_descanso: false, grupos_musculares: ["Quadríceps","Glúteos"],      status: "hoje",      num_exercicios: 5, volume_series: 16 },
    { id: "s4", nome: "Descanso",                     dia_semana: 4, eh_descanso: true,  grupos_musculares: [],                            status: "descanso" },
    { id: "s5", nome: "Push B — Ombros + Tríceps",   dia_semana: 5, eh_descanso: false, grupos_musculares: ["Ombros","Tríceps"],          status: "pendente",  num_exercicios: 5, volume_series: 16 },
    { id: "s6", nome: "Pull B — Costas + Bíceps",    dia_semana: 6, eh_descanso: false, grupos_musculares: ["Costas","Bíceps","Antebraço"],status: "pendente",  num_exercicios: 5, volume_series: 16 },
    { id: "s7", nome: "Legs B — Posterior + Glúteos",dia_semana: 0, eh_descanso: false, grupos_musculares: ["Posteriores","Glúteos"],     status: "pendente",  num_exercicios: 4, volume_series: 14 },
  ],
};

type ViewState = "loading_check" | "no_plan" | "generating" | "plan";

export default function TreinoPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("loading_check");
  const [plano, setPlano] = useState<PlanoTreino | null>(null);
  const [genStep, setGenStep] = useState(0);

  useEffect(() => {
    // Simulate checking for existing plan
    const existing = localStorage.getItem("personutri_plano");
    setTimeout(() => {
      if (existing) {
        setPlano(JSON.parse(existing));
        setView("plan");
      } else {
        setView("no_plan");
      }
    }, 600);
  }, []);

  function handleGenerar() {
    setView("generating");
    setGenStep(0);
    const steps = [
      "Analisando seu perfil e anamnese…",
      "Selecionando exercícios do banco…",
      "Calculando volume e intensidade…",
      "Montando progressão dupla…",
      "Plano gerado com sucesso!",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setGenStep(i);
      if (i >= steps.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          localStorage.setItem("personutri_plano", JSON.stringify(PLANO_MOCK));
          setPlano(PLANO_MOCK);
          setView("plan");
        }, 800);
      }
    }, 900);
  }

  if (view === "loading_check") return <LoadingScreen />;
  if (view === "generating")   return <GeneratingScreen step={genStep} />;
  if (view === "no_plan")      return <NoPlanScreen onGenerate={handleGenerar} />;
  if (plano)                   return <PlanView plano={plano} onIniciar={(id) => router.push(`/treino/sessao/${id}`)} onRegenerar={() => { localStorage.removeItem("personutri_plano"); setView("no_plan"); }} />;
  return null;
}

/* ─── Loading ─────────────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-sm text-muted">Carregando seu plano…</p>
    </div>
  );
}

/* ─── No Plan ─────────────────────────────────────────────────────────────── */
function NoPlanScreen({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <header style={{ background: "#1A56A0" }} className="px-5 pt-12 pb-8">
        <h1 className="text-white text-2xl font-bold">Meu Plano de Treino</h1>
        <p className="text-white/70 text-sm mt-1">Nenhum plano ativo encontrado</p>
      </header>

      <div className="flex flex-col flex-1 px-5 py-8 items-center justify-center gap-6 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{ background: "#EBF2FB" }}>🤖</div>
        <div>
          <h2 className="text-xl font-bold text-text">Gere seu plano personalizado</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed max-w-xs mx-auto">
            A IA vai criar um plano de hipertrofia baseado no seu perfil, anamnese e evidências científicas.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <InfoRow icon="🧬" text="Baseado em Schoenfeld, Helms & Israetel" />
          <InfoRow icon="📊" text="Progressão dupla automática" />
          <InfoRow icon="🎯" text="Volume adaptado ao seu nível" />
          <InfoRow icon="⚡" text="Divisão Push / Pull / Legs compatível" />
        </div>

        <button onClick={onGenerate}
          style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base active:opacity-80 transition-opacity mt-2">
          Gerar meu plano com IA →
        </button>
        <p className="text-xs text-muted">Leva cerca de 10 segundos</p>
      </div>
    </div>
  );
}

/* ─── Generating ──────────────────────────────────────────────────────────── */
const GEN_STEPS = [
  "Analisando seu perfil e anamnese…",
  "Selecionando exercícios do banco…",
  "Calculando volume e intensidade…",
  "Montando progressão dupla…",
  "Plano gerado com sucesso!",
];

function GeneratingScreen({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-8 gap-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-text">Gerando seu plano</h2>
        <p className="text-sm mt-1" style={{ color: "#1A56A0" }}>{GEN_STEPS[step] ?? GEN_STEPS[0]}</p>
      </div>

      <div className="w-full flex flex-col gap-2">
        {GEN_STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            i < step ? "bg-green-50" : i === step ? "bg-blue-50" : "bg-gray-50"
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              i < step ? "bg-green-500 text-white" :
              i === step ? "bg-blue-600 text-white" :
              "bg-gray-200 text-gray-400"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${i <= step ? "text-text font-medium" : "text-muted"}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Plan View ───────────────────────────────────────────────────────────── */
function PlanView({ plano, onIniciar, onRegenerar }: {
  plano: PlanoTreino;
  onIniciar: (id: string) => void;
  onRegenerar: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const concluidas = plano.sessoes.filter(s => s.status === "concluida").length;
  const total = plano.sessoes.filter(s => !s.eh_descanso).length;

  // Sort: start from Monday (dia_semana 1)
  const ordenado = [...plano.sessoes].sort((a, b) => {
    const da = a.dia_semana === 0 ? 7 : a.dia_semana;
    const db = b.dia_semana === 0 ? 7 : b.dia_semana;
    return da - db;
  });

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-12 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider font-medium">{plano.divisao}</p>
            <h1 className="text-white text-xl font-bold mt-0.5 leading-tight">{plano.nome}</h1>
          </div>
          <button onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/70 mb-1.5">
            <span>{concluidas} de {total} sessões esta semana</span>
            <span>Semana 1 de {plano.semanas_previstas}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${(concluidas/total)*100}%` }} />
          </div>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute right-5 top-16 z-50 bg-white rounded-xl shadow-lg border border-border overflow-hidden w-52">
            <button onClick={() => { setShowMenu(false); onRegenerar(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-gray-50">
              <span>🔄</span> Regenerar plano
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-gray-50">
              <span>📋</span> Ver histórico de versões
            </button>
            <div className="h-px bg-border" />
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
              style={{ color: "#D85A30" }}>
              <span>⏸</span> Pausar plano
            </button>
          </div>
        )}
      </header>

      {/* Sessions list */}
      <div className="flex flex-col gap-3 px-5 py-5">
        {ordenado.map(sessao => (
          <SessaoCard key={sessao.id} sessao={sessao} onIniciar={() => onIniciar(sessao.id)} />
        ))}
      </div>

      {/* Bottom hint */}
      <div className="px-5 pb-8 mt-auto">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-border p-4">
          <span className="text-lg">🔬</span>
          <p className="text-xs text-muted leading-relaxed">
            Plano baseado em <strong>progressão dupla</strong>: aumente reps até o teto, depois suba carga.
            Referência: Israetel et al. (2019).
          </p>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav active="treino" />
    </div>
  );
}

/* ─── Session Card ────────────────────────────────────────────────────────── */
function SessaoCard({ sessao, onIniciar }: { sessao: SessaoPlano; onIniciar: () => void }) {
  const dia = DIAS[sessao.dia_semana];
  const isHoje = sessao.status === "hoje";
  const isConcluida = sessao.status === "concluida";
  const isDescanso = sessao.eh_descanso;

  if (isDescanso) {
    return (
      <div className="flex items-center gap-4 bg-white rounded-xl border border-border px-4 py-3.5 opacity-60">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">💤</div>
        <div>
          <p className="text-sm font-semibold text-text">{dia} · Descanso</p>
          <p className="text-xs text-muted">Recuperação ativa</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${
      isHoje ? "border-blue-400 shadow-sm shadow-blue-100" : "border-border"
    }`}>
      {isHoje && (
        <div style={{ background: "#1A56A0" }} className="px-4 py-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-semibold uppercase tracking-wider">Treino de hoje</span>
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-3.5">
        {/* Status icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
          isConcluida ? "bg-green-50" : isHoje ? "bg-blue-50" : "bg-gray-100"
        }`}>
          {isConcluida ? "✅" : isHoje ? "💪" : "⏳"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted uppercase">{dia}</span>
            {isConcluida && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Concluída ✓</span>
            )}
          </div>
          <p className="text-sm font-bold text-text leading-tight mt-0.5 truncate">{sessao.nome}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {sessao.grupos_musculares.slice(0, 3).map(g => (
              <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-muted font-medium">{g}</span>
            ))}
          </div>
          {sessao.num_exercicios && (
            <p className="text-xs text-muted mt-1">{sessao.num_exercicios} exercícios · {sessao.volume_series} séries</p>
          )}
        </div>

        {/* Action */}
        {!isConcluida && (
          <button onClick={onIniciar}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              isHoje
                ? "text-white"
                : "text-blue-700 bg-blue-50 hover:bg-blue-100"
            }`}
            style={isHoje ? { background: "#1A56A0" } : {}}>
            {isHoje ? "Iniciar" : "Ver"}
          </button>
        )}
        {isConcluida && (
          <button onClick={onIniciar}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium text-muted bg-gray-50 hover:bg-gray-100 transition-all">
            Refazer
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Info Row ────────────────────────────────────────────────────────────── */
function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-border">
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-text font-medium">{text}</span>
    </div>
  );
}

/* ─── Bottom Nav ──────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { id: "treino", label: "Treino", href: "/treino", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 5v14M18 5v14M3 12h4M17 12h4M6 12h12" strokeLinecap="round"/>
    </svg>
  )},
  { id: "nutricao", label: "Nutrição", href: "/nutricao", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" strokeLinecap="round"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )},
  { id: "progresso", label: "Progresso", href: "/progresso", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { id: "ia", label: "IA", href: "/ia", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4" strokeLinecap="round"/>
    </svg>
  )},
];

function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-border flex z-40">
      {NAV_ITEMS.map(item => {
        const isActive = item.id === active;
        return (
          <a key={item.id} href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            style={{ color: isActive ? "#1A56A0" : "#9CA3AF" }}>
            {item.icon}
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
