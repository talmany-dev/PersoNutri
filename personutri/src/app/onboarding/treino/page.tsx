"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type NivelTreino   = "iniciante" | "intermediario" | "avancado";
type DivisaoTreino = "fullbody" | "upper_lower" | "push_pull_legs" | "bro_split";

interface AnamneseForm {
  experiencia_anos:   string;
  dias_por_semana:    number;
  duracao_sessao_min: number;
  divisao_preferida:  DivisaoTreino | "";
  equipamentos:       string[];
  historico_lesoes:   string;
  restricoes_fisicas: string;
  preferencias:       string;
  objetivo_especifico:string;
}

const EQUIPAMENTOS = [
  { id: "academia_completa", label: "Academia completa",       icon: "🏋️" },
  { id: "casa_halteres",     label: "Casa com halteres",       icon: "💪" },
  { id: "casa_sem_equip",    label: "Casa sem equipamento",    icon: "🏠" },
  { id: "crossfit",          label: "Box de CrossFit",         icon: "⚡" },
  { id: "barra_fixa",        label: "Barra fixa / parallelas", icon: "🔩" },
  { id: "faixas_elasticas",  label: "Faixas elásticas",        icon: "🎗️" },
];

const DIVISOES: { id: DivisaoTreino; label: string; desc: string; min_dias: number }[] = [
  { id: "fullbody",        label: "Full Body",          desc: "Treino o corpo inteiro em cada sessão",     min_dias: 2 },
  { id: "upper_lower",     label: "Upper / Lower",      desc: "Alterna superior e inferior",               min_dias: 3 },
  { id: "push_pull_legs",  label: "Push / Pull / Legs", desc: "Empurrar, puxar e pernas",                  min_dias: 4 },
  { id: "bro_split",       label: "Bro Split",          desc: "Um grupo muscular por dia",                 min_dias: 5 },
];

function calcNivel(anos: number): NivelTreino {
  if (anos < 1)  return "iniciante";
  if (anos <= 3) return "intermediario";
  return "avancado";
}

const NIVEL_CONFIG: Record<NivelTreino, { label: string; color: string; bg: string; desc: string }> = {
  iniciante:     { label: "Iniciante",     color: "#1D9E75", bg: "#ECFDF5", desc: "< 1 ano de treino consistente" },
  intermediario: { label: "Intermediário", color: "#1A56A0", bg: "#EBF2FB", desc: "1–3 anos de treino" },
  avancado:      { label: "Avançado",      color: "#D85A30", bg: "#FEF3F0", desc: "> 3 anos de treino" },
};

export default function AnamneseTreinoPage() {
  const router = useRouter();
  const [form, setForm] = useState<AnamneseForm>({
    experiencia_anos:    "",
    dias_por_semana:     4,
    duracao_sessao_min:  60,
    divisao_preferida:   "",
    equipamentos:        [],
    historico_lesoes:    "",
    restricoes_fisicas:  "",
    preferencias:        "",
    objetivo_especifico: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AnamneseForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const anos = parseFloat(form.experiencia_anos);
  const nivelCalculado: NivelTreino | null = isNaN(anos) ? null : calcNivel(anos);

  const divisoesFiltradas = DIVISOES.filter(d => d.min_dias <= form.dias_por_semana);

  function toggleEquipamento(id: string) {
    setForm(prev => ({
      ...prev,
      equipamentos: prev.equipamentos.includes(id)
        ? prev.equipamentos.filter(e => e !== id)
        : [...prev.equipamentos, id],
    }));
    setErrors(prev => ({ ...prev, equipamentos: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof AnamneseForm, string>> = {};
    if (isNaN(anos) || anos < 0 || anos > 50) errs.experiencia_anos = "Informe os anos de treino (0 a 50)";
    if (form.equipamentos.length === 0) errs.equipamentos = "Selecione pelo menos um equipamento";
    if (!form.divisao_preferida) errs.divisao_preferida = "Selecione uma divisão de treino";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Persist (will be replaced by Supabase insert)
    const existing = JSON.parse(localStorage.getItem("personutri_profile") || "{}");
    localStorage.setItem("personutri_anamnese", JSON.stringify({
      ...form,
      nivel_treino: nivelCalculado,
      user_id: existing.id ?? null,
    }));

    setSubmitted(true);
    setTimeout(() => router.push("/treino"), 1800);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ background: "#ECFDF5" }}>✅</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-text">Anamnese salva!</h2>
          <p className="text-sm text-muted mt-1">Gerando seu plano personalizado…</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1A56A0", animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/70 text-sm mb-3 hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar
        </button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-xs font-medium opacity-75 uppercase tracking-wider">PersoNutri</span>
        </div>
        <h1 className="text-white text-2xl font-bold leading-tight">Anamnese de treino</h1>
        <p className="text-white/70 text-sm mt-1">Personalize seu plano de hipertrofia</p>
        <ProgressDots current={1} total={2} />
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 px-5 py-6 gap-7">

        {/* Experiência */}
        <Section title="Experiência">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">
              Anos de treino com pesos <span style={{ color: "#D85A30" }}>*</span>
            </label>
            <div className="flex gap-3 items-start">
              <input
                type="number"
                inputMode="decimal"
                value={form.experiencia_anos}
                onChange={e => {
                  setForm(prev => ({ ...prev, experiencia_anos: e.target.value }));
                  setErrors(prev => ({ ...prev, experiencia_anos: undefined }));
                }}
                placeholder="Ex: 2.5"
                min={0}
                max={50}
                step={0.5}
                className={`w-32 px-3 py-3 rounded-lg border text-sm outline-none bg-gray-50 focus:bg-white transition-all ${
                  errors.experiencia_anos
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-border focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {nivelCalculado && (
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: NIVEL_CONFIG[nivelCalculado].bg }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: NIVEL_CONFIG[nivelCalculado].color }} />
                  <div>
                    <div className="text-xs font-bold" style={{ color: NIVEL_CONFIG[nivelCalculado].color }}>
                      {NIVEL_CONFIG[nivelCalculado].label}
                    </div>
                    <div className="text-xs opacity-70" style={{ color: NIVEL_CONFIG[nivelCalculado].color }}>
                      {NIVEL_CONFIG[nivelCalculado].desc}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {errors.experiencia_anos && <p className="text-xs font-medium" style={{ color: "#D85A30" }}>⚠ {errors.experiencia_anos}</p>}
          </div>
        </Section>

        {/* Logística */}
        <Section title="Logística de treino">
          {/* Dias por semana */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium text-text">
                Dias por semana <span style={{ color: "#D85A30" }}>*</span>
              </label>
              <span className="text-lg font-bold" style={{ color: "#1A56A0" }}>{form.dias_por_semana}×</span>
            </div>
            <input
              type="range"
              min={2} max={6} step={1}
              value={form.dias_por_semana}
              onChange={e => {
                const dias = parseInt(e.target.value);
                setForm(prev => ({
                  ...prev,
                  dias_por_semana: dias,
                  divisao_preferida: DIVISOES.find(d => d.id === prev.divisao_preferida && d.min_dias <= dias)
                    ? prev.divisao_preferida
                    : "",
                }));
              }}
              className="w-full h-2 rounded-full outline-none cursor-pointer"
              style={{ accentColor: "#1A56A0" }}
            />
            <div className="flex justify-between text-xs text-muted px-0.5">
              {[2,3,4,5,6].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>

          {/* Duração */}
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium text-text">
                Duração da sessão <span style={{ color: "#D85A30" }}>*</span>
              </label>
              <span className="text-lg font-bold" style={{ color: "#1A56A0" }}>{form.duracao_sessao_min} min</span>
            </div>
            <input
              type="range"
              min={30} max={120} step={15}
              value={form.duracao_sessao_min}
              onChange={e => setForm(prev => ({ ...prev, duracao_sessao_min: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-full outline-none cursor-pointer"
              style={{ accentColor: "#1A56A0" }}
            />
            <div className="flex justify-between text-xs text-muted px-0.5">
              {[30,45,60,75,90,105,120].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>
        </Section>

        {/* Equipamentos */}
        <Section title="Equipamentos disponíveis">
          <div className="grid grid-cols-2 gap-2">
            {EQUIPAMENTOS.map(eq => {
              const active = form.equipamentos.includes(eq.id);
              return (
                <button key={eq.id} type="button" onClick={() => toggleEquipamento(eq.id)}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm text-left transition-all ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-border bg-white hover:border-gray-300"
                  }`}>
                  <span className="text-lg leading-none">{eq.icon}</span>
                  <span className="font-medium leading-tight text-xs">{eq.label}</span>
                  {active && (
                    <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "#1A56A0" }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {errors.equipamentos && <p className="text-xs font-medium" style={{ color: "#D85A30" }}>⚠ {errors.equipamentos}</p>}
        </Section>

        {/* Divisão de treino */}
        <Section title="Divisão de treino">
          <p className="text-xs text-muted -mt-1">Mostrando divisões compatíveis com {form.dias_por_semana} dias/semana</p>
          <div className="flex flex-col gap-2">
            {divisoesFiltradas.map(div => {
              const active = form.divisao_preferida === div.id;
              return (
                <button key={div.id} type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, divisao_preferida: div.id }));
                    setErrors(prev => ({ ...prev, divisao_preferida: undefined }));
                  }}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm transition-all ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-border bg-white hover:border-gray-300"
                  }`}>
                  <div className="text-left">
                    <div className="font-semibold text-text">{div.label}</div>
                    <div className="text-xs text-muted">{div.desc} · mín. {div.min_dias} dias</div>
                  </div>
                  {active && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#1A56A0" />
                      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {divisoesFiltradas.length === 0 && (
            <p className="text-xs text-muted bg-gray-50 rounded-lg p-3">
              Aumente os dias por semana para ver mais opções de divisão.
            </p>
          )}
          {errors.divisao_preferida && <p className="text-xs font-medium" style={{ color: "#D85A30" }}>⚠ {errors.divisao_preferida}</p>}
        </Section>

        {/* Histórico (opcional) */}
        <Section title="Histórico e preferências (opcional)">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Lesões ou limitações físicas</label>
              <textarea
                value={form.historico_lesoes}
                onChange={e => setForm(prev => ({ ...prev, historico_lesoes: e.target.value }))}
                placeholder="Ex: tendinite no ombro direito, dor lombar crônica…"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Preferências de exercícios</label>
              <textarea
                value={form.preferencias}
                onChange={e => setForm(prev => ({ ...prev, preferencias: e.target.value }))}
                placeholder="Ex: prefiro exercícios compostos, não gosto de leg press…"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Objetivo específico</label>
              <textarea
                value={form.objetivo_especifico}
                onChange={e => setForm(prev => ({ ...prev, objetivo_especifico: e.target.value }))}
                placeholder="Ex: aumentar peito e ombros, melhorar postura…"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </div>
        </Section>

        <button type="submit"
          style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base mt-auto active:opacity-80 transition-opacity">
          Gerar meu plano de treino →
        </button>

        <p className="text-center text-xs text-muted pb-4">
          Plano gerado com IA baseado em evidências científicas de hipertrofia
        </p>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 mt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
      ))}
    </div>
  );
}
