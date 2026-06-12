"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface CheckinForm {
  horas_sono:     number;
  qualidade_sono: number;
  energia:        number;
  dor_muscular:   number;
  peso_kg:        string;
  notas:          string;
}

// Score de recuperação:
// qualidade_sono*0.4 + energia*0.3 + (10-dor)*0.2 + min(horas/8,1)*10*0.1
function calcScore(form: Omit<CheckinForm, "peso_kg" | "notas">): number {
  const sono_norm = Math.min(form.horas_sono / 8, 1) * 10;
  const score =
    form.qualidade_sono * 0.4 +
    form.energia        * 0.3 +
    (10 - form.dor_muscular) * 0.2 +
    sono_norm * 0.1;
  return Math.round(score * 10) / 10;
}

function scoreColor(score: number): string {
  if (score >= 8)  return "#1D9E75";
  if (score >= 6)  return "#1A56A0";
  if (score >= 4)  return "#F59E0B";
  return "#D85A30";
}

function scoreLabel(score: number): string {
  if (score >= 8)  return "Excelente";
  if (score >= 6)  return "Bom";
  if (score >= 4)  return "Regular";
  return "Baixo";
}

const METRICAS = [
  {
    key: "qualidade_sono" as const,
    label: "Qualidade do sono",
    icon: "🌙",
    min: 1, max: 10, step: 1,
    lowLabel: "Péssimo", highLabel: "Ótimo",
    weight: 0.4,
    hint: (v: number) => v >= 8 ? "Sono restaurador" : v >= 5 ? "Sono regular" : "Sono fragmentado",
  },
  {
    key: "horas_sono" as const,
    label: "Horas de sono",
    icon: "⏰",
    min: 3, max: 12, step: 0.5,
    lowLabel: "3h", highLabel: "12h",
    weight: 0.1,
    hint: (v: number) => v >= 8 ? "Ideal para recuperação" : v >= 6 ? "Abaixo do ideal" : "Privação severa",
    isFloat: true,
    unit: "h",
  },
  {
    key: "energia" as const,
    label: "Nível de energia",
    icon: "⚡",
    min: 1, max: 10, step: 1,
    lowLabel: "Exausto", highLabel: "Energizado",
    weight: 0.3,
    hint: (v: number) => v >= 8 ? "Ótimo para treinar" : v >= 5 ? "Treino moderado" : "Considere descanso",
  },
  {
    key: "dor_muscular" as const,
    label: "Dor muscular (DOMS)",
    icon: "💪",
    min: 0, max: 10, step: 1,
    lowLabel: "Sem dor", highLabel: "Extrema",
    weight: 0.2,
    hint: (v: number) => v <= 2 ? "Sem limitação" : v <= 5 ? "Leve, treino normal" : "Descanso recomendado",
    invertColor: true,
  },
];

export default function CheckinPage() {
  const router = useRouter();
  const [form, setForm] = useState<CheckinForm>({
    horas_sono:     7.5,
    qualidade_sono: 7,
    energia:        7,
    dor_muscular:   3,
    peso_kg:        "",
    notas:          "",
  });
  const [saved, setSaved] = useState(false);

  const score = useMemo(() => calcScore(form), [form]);
  const color = scoreColor(score);

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  async function handleSave() {
    const hoje = new Date().toISOString().split("T")[0];
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("checkins").upsert(
        {
          user_id:           user.id,
          data:              hoje,
          qualidade_sono:    form.qualidade_sono,
          energia:           form.energia,
          dor_muscular:      form.dor_muscular,
          horas_sono:        form.horas_sono,
          peso_kg:           form.peso_kg ? parseFloat(form.peso_kg) : null,
          notas:             form.notas || null,
          score_recuperacao: score,
        },
        { onConflict: "user_id,data" }
      );
    }

    // Cache local como fallback
    const existing = JSON.parse(localStorage.getItem("personutri_checkins") || "[]");
    const filtrado = existing.filter((c: { data: string }) => c.data !== hoje);
    localStorage.setItem("personutri_checkins", JSON.stringify([
      { ...form, score_recuperacao: score, data: hoje }, ...filtrado
    ]));
    setSaved(true);
  }

  if (saved) {
    return <CheckinSalvo score={score} color={color} label={scoreLabel(score)} onVoltar={() => router.push("/dashboard")} />;
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-10 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-white/60 text-sm mb-3 hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar
        </button>
        <h1 className="text-white text-2xl font-bold">Check-in diário</h1>
        <p className="text-white/70 text-sm mt-1">{todayCap}</p>
      </header>

      <div className="flex flex-col flex-1 px-5 py-5 gap-5">

        {/* Score em tempo real */}
        <ScoreCard score={score} color={color} label={scoreLabel(score)} />

        {/* Sliders */}
        <div className="flex flex-col gap-4">
          {METRICAS.map(m => (
            <SliderCard
              key={m.key}
              metrica={m}
              value={form[m.key]}
              onChange={v => setForm(prev => ({ ...prev, [m.key]: v }))}
            />
          ))}
        </div>

        {/* Peso (opcional) */}
        <div className="bg-white rounded-xl border border-border px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚖️</span>
            <p className="text-sm font-semibold text-text">Peso hoje (opcional)</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="decimal"
              value={form.peso_kg}
              onChange={e => setForm(prev => ({ ...prev, peso_kg: e.target.value }))}
              placeholder="Ex: 82.4"
              min={30} max={300} step={0.1}
              className="w-32 px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <span className="text-sm text-muted">kg</span>
            {form.peso_kg && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium ml-auto">
                Registrado ✓
              </span>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-xl border border-border px-4 py-4">
          <p className="text-sm font-semibold text-text mb-2">Notas (opcional)</p>
          <textarea
            value={form.notas}
            onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))}
            placeholder="Como foi o dia? Alguma observação relevante…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm outline-none bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          />
        </div>

        {/* Base científica */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex gap-3">
          <span className="text-blue-400 mt-0.5 flex-shrink-0">🔬</span>
          <p className="text-xs text-blue-600 leading-relaxed">
            Score baseado em <strong>Kellmann & Kallus (2001)</strong> — Recovery-Stress Questionnaire.
            Ponderação: sono qualidade (40%), energia (30%), dor muscular inversa (20%), horas sono (10%).
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          style={{ background: color }}
          className="w-full text-white font-bold py-4 rounded-xl text-base mt-auto active:opacity-80 transition-all">
          Registrar check-in · {score.toFixed(1)}/10
        </button>

        <div className="pb-6" />
      </div>
    </div>
  );
}

/* ─── Score Card ──────────────────────────────────────────────────────────── */
function ScoreCard({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = score / 10;

  return (
    <div className="bg-white rounded-xl border border-border px-4 py-4 flex items-center gap-4">
      {/* SVG ring */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score.toFixed(1)}</span>
          <span className="text-[10px] text-muted">/10</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted uppercase tracking-wider font-medium">Score de recuperação</p>
        <p className="text-xl font-bold mt-0.5" style={{ color }}>{label}</p>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          {score >= 8  ? "Condições ideais para treino de alta intensidade." :
           score >= 6  ? "Boas condições. Treine normalmente." :
           score >= 4  ? "Reduza o volume hoje. Priorize técnica." :
                         "Descanso ativo recomendado. Evite treinos intensos."}
        </p>
      </div>
    </div>
  );
}

/* ─── Slider Card ─────────────────────────────────────────────────────────── */
interface MetricaDef {
  key: "horas_sono" | "qualidade_sono" | "energia" | "dor_muscular";
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  lowLabel: string;
  highLabel: string;
  hint: (v: number) => string;
  invertColor?: boolean;
  isFloat?: boolean;
  unit?: string;
}

function SliderCard({ metrica: m, value, onChange }: {
  metrica: MetricaDef;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = (value - m.min) / (m.max - m.min);
  const baseColor = m.invertColor
    ? pct > 0.6 ? "#D85A30" : pct > 0.3 ? "#F59E0B" : "#1D9E75"
    : pct > 0.7 ? "#1D9E75" : pct > 0.4 ? "#1A56A0" : "#D85A30";

  const displayVal = m.isFloat ? value.toFixed(1) : String(value);

  return (
    <div className="bg-white rounded-xl border border-border px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{m.icon}</span>
          <span className="text-sm font-semibold text-text">{m.label}</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-bold" style={{ color: baseColor }}>{displayVal}</span>
          {m.unit && <span className="text-sm text-muted">{m.unit}</span>}
          {!m.unit && <span className="text-xs text-muted">/10</span>}
        </div>
      </div>

      <input
        type="range"
        min={m.min}
        max={m.max}
        step={m.step}
        value={value}
        onChange={e => onChange(m.isFloat ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="w-full h-2 rounded-full outline-none cursor-pointer"
        style={{ accentColor: baseColor }}
      />

      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-muted">{m.lowLabel}</span>
        <span className="text-xs font-medium" style={{ color: baseColor }}>{m.hint(value)}</span>
        <span className="text-xs text-muted">{m.highLabel}</span>
      </div>
    </div>
  );
}

/* ─── Check-in Salvo ──────────────────────────────────────────────────────── */
function CheckinSalvo({ score, color, label, onVoltar }: {
  score: number; color: string; label: string; onVoltar: () => void;
}) {
  const r = 56;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 gap-6">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 10)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score.toFixed(1)}</span>
          <span className="text-sm text-muted">/10</span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold" style={{ color }}>{label}!</h2>
        <p className="text-sm text-muted mt-2">Check-in registrado com sucesso</p>
      </div>

      <div className="w-full flex flex-col gap-3 mt-4">
        <button onClick={onVoltar}
          style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base active:opacity-80 transition-opacity">
          Voltar ao Dashboard
        </button>
        <a href="/treino"
          className="w-full text-center py-3.5 rounded-xl border-2 text-sm font-bold transition-colors hover:bg-gray-50"
          style={{ borderColor: color, color }}>
          Ver treino de hoje
        </a>
      </div>
    </div>
  );
}
