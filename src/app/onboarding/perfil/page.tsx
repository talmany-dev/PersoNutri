"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  calcTMB,
  calcTDEE,
  calcMetaCalorica,
  calcMacros,
  type Objetivo,
  type NivelAtividade,
  type SexoBiologico,
} from "@/lib/calculations";

interface FormData {
  nome: string;
  email: string;
  senha: string;
  peso_kg: string;
  altura_cm: string;
  idade: string;
  sexo_biologico: SexoBiologico | "";
  percentual_gordura: string;
  objetivo: Objetivo | "";
  nivel_atividade: NivelAtividade | "";
}

interface ResultData {
  tmb: number;
  tdee: number;
  meta_calorica: number;
  proteina_g: number;
  gordura_g: number;
  carboidrato_g: number;
}

const OBJETIVO_LABELS: Record<Objetivo, string> = {
  bulk: "Ganho de massa (Bulk)",
  recomp: "Recomposição corporal",
  cut: "Definição (Cut)",
};

const ATIVIDADE_LABELS: Record<NivelAtividade, string> = {
  sedentario:  "Sedentário (sem exercício)",
  leve:        "Leve (1–3 dias/sem)",
  moderado:    "Moderado (3–5 dias/sem)",
  ativo:       "Ativo (6–7 dias/sem)",
  muito_ativo: "Muito ativo (2× por dia)",
};

const OBJETIVO_DESC: Record<Objetivo, string> = {
  bulk:   "+250 kcal acima do TDEE",
  recomp: "Igual ao TDEE",
  cut:    "−400 kcal abaixo do TDEE",
};

export default function PerfilPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    nome: "", email: "", senha: "",
    peso_kg: "", altura_cm: "", idade: "",
    sexo_biologico: "", percentual_gordura: "",
    objetivo: "", nivel_atividade: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [result, setResult] = useState<ResultData | null>(null);
  const [step, setStep] = useState<"form" | "result">("form");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "E-mail inválido";
    if (form.senha.length < 8) errs.senha = "Mínimo 8 caracteres";

    const peso = parseFloat(form.peso_kg);
    if (isNaN(peso) || peso < 30 || peso > 300) errs.peso_kg = "Entre 30 e 300 kg";

    const altura = parseFloat(form.altura_cm);
    if (isNaN(altura) || altura < 100 || altura > 250) errs.altura_cm = "Entre 100 e 250 cm";

    const idade = parseInt(form.idade);
    if (isNaN(idade) || idade < 14 || idade > 90) errs.idade = "Entre 14 e 90 anos";

    if (!form.sexo_biologico) errs.sexo_biologico = "Selecione o sexo";
    if (!form.objetivo) errs.objetivo = "Selecione o objetivo";
    if (!form.nivel_atividade) errs.nivel_atividade = "Selecione o nível de atividade";

    if (form.percentual_gordura) {
      const pg = parseFloat(form.percentual_gordura);
      if (isNaN(pg) || pg < 3 || pg > 60) errs.percentual_gordura = "Entre 3% e 60%";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);

    const peso   = parseFloat(form.peso_kg);
    const altura = parseFloat(form.altura_cm);
    const idade  = parseInt(form.idade);
    const sexo   = form.sexo_biologico as SexoBiologico;
    const obj    = form.objetivo as Objetivo;
    const nivel  = form.nivel_atividade as NivelAtividade;
    const pg     = form.percentual_gordura ? parseFloat(form.percentual_gordura) : undefined;

    const tmb           = calcTMB({ peso_kg: peso, altura_cm: altura, idade, sexo, percentual_gordura: pg });
    const tdee          = calcTDEE(tmb, nivel);
    const meta_calorica = calcMetaCalorica(tdee, obj);
    const macros        = calcMacros(peso, obj, meta_calorica);

    const supabase = createClient();

    // 1. Criar conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
    });

    if (authError || !authData.user) {
      setSaveError(authError?.message === "User already registered"
        ? "Este e-mail já está cadastrado. Faça login."
        : (authError?.message ?? "Erro ao criar conta."));
      setSaving(false);
      return;
    }

    // 2. Salvar perfil na tabela users
    const { error: dbError } = await supabase.from("users").insert({
      id:                 authData.user.id,
      nome:               form.nome,
      email:              form.email,
      peso_kg:            peso,
      altura_cm:          altura,
      idade,
      sexo_biologico:     sexo,
      percentual_gordura: pg ?? null,
      objetivo:           obj,
      nivel_atividade:    nivel,
      tmb,
      tdee,
      meta_calorica,
      proteina_g:         macros.proteina_g,
      gordura_g:          macros.gordura_g,
      carboidrato_g:      macros.carboidrato_g,
    });

    if (dbError) {
      setSaveError("Conta criada, mas erro ao salvar perfil: " + dbError.message);
      setSaving(false);
      return;
    }

    // 3. Salvar no localStorage como cache local
    localStorage.setItem("personutri_profile", JSON.stringify(
      { ...form, tmb, tdee, meta_calorica, ...macros, user_id: authData.user.id }
    ));

    setSaving(false);
    setResult({ tmb, tdee, meta_calorica, ...macros });
    setStep("result");
  }

  if (step === "result" && result) {
    return <ResultCard result={result} objetivo={form.objetivo as Objetivo} onContinue={() => router.push("/onboarding/treino")} />;
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <LogoIcon />
          <span className="text-white text-xs font-medium opacity-75 uppercase tracking-wider">PersoNutri</span>
        </div>
        <h1 className="text-white text-2xl font-bold leading-tight">Crie seu perfil</h1>
        <p className="text-white/70 text-sm mt-1">Vamos calcular suas metas individuais</p>
        <ProgressDots current={0} total={3} />
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 px-5 py-6 gap-6">

        {/* Identificação */}
        <Section title="Identificação">
          <Field label="Nome completo" required error={errors.nome}>
            <input type="text" value={form.nome} onChange={e => set("nome", e.target.value)}
              placeholder="Rafael Mendes" className={inputCls(errors.nome)} />
          </Field>
          <Field label="E-mail" required error={errors.email}>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="rafael@email.com" className={inputCls(errors.email)} />
          </Field>
          <Field label="Senha" required error={errors.senha}>
            <input type="password" value={form.senha} onChange={e => set("senha", e.target.value)}
              placeholder="Mínimo 8 caracteres" className={inputCls(errors.senha)} />
          </Field>
        </Section>

        {/* Dados físicos */}
        <Section title="Dados físicos">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (kg)" required error={errors.peso_kg}>
              <input type="number" inputMode="decimal" value={form.peso_kg}
                onChange={e => set("peso_kg", e.target.value)}
                placeholder="80" min={30} max={300} step={0.1} className={inputCls(errors.peso_kg)} />
            </Field>
            <Field label="Altura (cm)" required error={errors.altura_cm}>
              <input type="number" inputMode="decimal" value={form.altura_cm}
                onChange={e => set("altura_cm", e.target.value)}
                placeholder="178" min={100} max={250} className={inputCls(errors.altura_cm)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Idade" required error={errors.idade}>
              <input type="number" inputMode="numeric" value={form.idade}
                onChange={e => set("idade", e.target.value)}
                placeholder="28" min={14} max={90} className={inputCls(errors.idade)} />
            </Field>
            <Field label="% Gordura" error={errors.percentual_gordura}>
              <input type="number" inputMode="decimal" value={form.percentual_gordura}
                onChange={e => set("percentual_gordura", e.target.value)}
                placeholder="Opcional" min={3} max={60} step={0.1} className={inputCls(errors.percentual_gordura)} />
            </Field>
          </div>
          <Field label="Sexo biológico" required error={errors.sexo_biologico}>
            <div className="flex gap-3">
              {(["M", "F"] as SexoBiologico[]).map(s => (
                <button key={s} type="button"
                  onClick={() => set("sexo_biologico", s)}
                  className={toggleCls(form.sexo_biologico === s)}>
                  {s === "M" ? "Masculino" : "Feminino"}
                </button>
              ))}
            </div>
            {errors.sexo_biologico && <ErrorMsg msg={errors.sexo_biologico} />}
          </Field>
        </Section>

        {/* Objetivos */}
        <Section title="Objetivo">
          <div className="flex flex-col gap-2">
            {(Object.keys(OBJETIVO_LABELS) as Objetivo[]).map(obj => (
              <button key={obj} type="button"
                onClick={() => set("objetivo", obj)}
                className={cardSelectCls(form.objetivo === obj)}>
                <div className="flex items-center gap-3">
                  <ObjectiveIcon obj={obj} active={form.objetivo === obj} />
                  <div className="text-left">
                    <div className="text-sm font-semibold">{OBJETIVO_LABELS[obj]}</div>
                    <div className="text-xs opacity-60">{OBJETIVO_DESC[obj]}</div>
                  </div>
                </div>
                {form.objetivo === obj && <CheckIcon />}
              </button>
            ))}
          </div>
          {errors.objetivo && <ErrorMsg msg={errors.objetivo} />}
        </Section>

        {/* Nível de atividade */}
        <Section title="Nível de atividade">
          <div className="flex flex-col gap-2">
            {(Object.keys(ATIVIDADE_LABELS) as NivelAtividade[]).map(nivel => (
              <button key={nivel} type="button"
                onClick={() => set("nivel_atividade", nivel)}
                className={cardSelectCls(form.nivel_atividade === nivel)}>
                <span className="text-sm font-medium text-left">{ATIVIDADE_LABELS[nivel]}</span>
                {form.nivel_atividade === nivel && <CheckIcon />}
              </button>
            ))}
          </div>
          {errors.nivel_atividade && <ErrorMsg msg={errors.nivel_atividade} />}
        </Section>

        {saveError && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEE2E2", color: "#991B1B" }}>
            {saveError}
          </div>
        )}

        <button type="submit" disabled={saving}
          style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base mt-auto active:opacity-80 transition-opacity disabled:opacity-60">
          {saving ? "Criando conta…" : "Calcular minhas metas →"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Já tem conta?{" "}
          <a href="/login" style={{ color: "#1A56A0" }} className="font-medium">Entrar</a>
        </p>
      </form>
    </div>
  );
}

/* ─── Result Card ─────────────────────────────────────────────────────────── */

function ResultCard({ result, objetivo, onContinue }: {
  result: ResultData;
  objetivo: Objetivo;
  onContinue: () => void;
}) {
  const objetivoLabel = OBJETIVO_LABELS[objetivo];
  return (
    <div className="flex flex-col min-h-dvh">
      <header style={{ background: "#1A56A0" }} className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <LogoIcon />
          <span className="text-white text-xs font-medium opacity-75 uppercase tracking-wider">PersoNutri</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Suas metas calculadas</h1>
        <p className="text-white/70 text-sm mt-1">{objetivoLabel}</p>
      </header>

      <div className="flex flex-col px-5 py-6 gap-4 flex-1">

        {/* Metabolismo */}
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Metabolismo</h3>
          <div className="flex gap-3">
            <MetricCard label="TMB" value={result.tmb} unit="kcal" hint="Taxa Metabólica Basal" />
            <MetricCard label="TDEE" value={result.tdee} unit="kcal" hint="Gasto Total Diário" />
            <MetricCard label="Meta" value={result.meta_calorica} unit="kcal" accent />
          </div>
          <p className="text-xs text-muted mt-3">
            {objetivo === "bulk" && "Superávit de +250 kcal para síntese muscular máxima."}
            {objetivo === "recomp" && "Manutenção calórica para recomposição corporal."}
            {objetivo === "cut" && "Déficit de −400 kcal para redução de gordura preservando músculo."}
          </p>
        </div>

        {/* Macros */}
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Distribuição de macros</h3>
          <div className="flex flex-col gap-3">
            <MacroBar label="Proteína" value={result.proteina_g} kcal={result.proteina_g * 4} color="#1A56A0" total={result.meta_calorica} />
            <MacroBar label="Carboidratos" value={result.carboidrato_g} kcal={result.carboidrato_g * 4} color="#1D9E75" total={result.meta_calorica} />
            <MacroBar label="Gorduras" value={result.gordura_g} kcal={result.gordura_g * 9} color="#D85A30" total={result.meta_calorica} />
          </div>
        </div>

        {/* Base científica */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex gap-3">
          <span className="text-blue-400 mt-0.5">🔬</span>
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1">Base científica</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              TMB calculada com <strong>Katch-McArdle</strong> (% gordura fornecida) ou <strong>Mifflin-St Jeor</strong>.
              Proteína baseada em Morton et al. (2018) · Macros via Helms et al. (2014).
            </p>
          </div>
        </div>

        <button onClick={onContinue}
          style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base mt-auto active:opacity-80 transition-opacity">
          Continuar → Anamnese de treino
        </button>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">
        {label}{required && <span className="text-coral ml-0.5">*</span>}
      </label>
      {children}
      {error && <ErrorMsg msg={error} />}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-xs font-medium" style={{ color: "#D85A30" }}>⚠ {msg}</p>;
}

function MetricCard({ label, value, unit, hint, accent }: {
  label: string; value: number; unit: string; hint?: string; accent?: boolean;
}) {
  return (
    <div className={`flex-1 rounded-lg p-3 text-center ${accent ? "bg-navy/10" : "bg-gray-50"}`}
      style={accent ? { background: "#EBF2FB" } : {}}>
      <div className="text-xs text-muted font-medium">{label}</div>
      <div className="text-xl font-bold mt-0.5" style={accent ? { color: "#1A56A0" } : {}}>{value.toLocaleString("pt-BR")}</div>
      <div className="text-xs text-muted">{unit}</div>
      {hint && <div className="text-[10px] text-muted mt-1 leading-tight">{hint}</div>}
    </div>
  );
}

function MacroBar({ label, value, kcal, color, total }: {
  label: string; value: number; kcal: number; color: string; total: number;
}) {
  const pct = Math.round((kcal / total) * 100);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}g</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-muted">{kcal} kcal</span>
        <span className="text-xs text-muted">{pct}%</span>
      </div>
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

function ObjectiveIcon({ obj, active }: { obj: Objetivo; active: boolean }) {
  const icons: Record<Objetivo, string> = { bulk: "💪", recomp: "⚡", cut: "🎯" };
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${active ? "bg-navy/10" : "bg-gray-100"}`}
      style={active ? { background: "#EBF2FB" } : {}}>
      {icons[obj]}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "#1A56A0" }}>
      <circle cx="12" cy="12" r="10" fill="#1A56A0" />
      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
      <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function inputCls(error?: string) {
  return `w-full px-3 py-3 rounded-lg border text-sm outline-none transition-all bg-gray-50 focus:bg-white ${
    error
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-border focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
  }`;
}

function toggleCls(active: boolean) {
  return `flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
    active
      ? "border-blue-500 text-blue-700 bg-blue-50"
      : "border-border text-text bg-gray-50"
  }`;
}

function cardSelectCls(active: boolean) {
  return `w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm transition-all ${
    active
      ? "border-blue-500 bg-blue-50"
      : "border-border bg-white hover:border-gray-300"
  }`;
}
