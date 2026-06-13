"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type EstiloAlimentar = "onivoro" | "vegetariano" | "vegano" | "low_carb" | "mediterraneo" | "sem_gluten";
type HorarioTreino   = "manha" | "tarde" | "noite" | "variado";
type Orcamento       = "economico" | "moderado" | "premium";

interface NutricaoForm {
  estilo_alimentar:     EstiloAlimentar | "";
  restricoes:           string[];
  horario_treino:       HorarioTreino | "";
  refeicoes_por_dia:    number;
  orcamento:            Orcamento | "";
  alimentos_aversao:    string;
  alimentos_preferidos: string;
}

/* ─── Opções ──────────────────────────────────────────────────────────────── */
const ESTILOS: { id: EstiloAlimentar; label: string; desc: string; icon: string }[] = [
  { id: "onivoro",      label: "Onívoro",          desc: "Como de tudo",                           icon: "🍖" },
  { id: "vegetariano",  label: "Vegetariano",       desc: "Sem carnes, com ovos e laticínios",      icon: "🥚" },
  { id: "vegano",       label: "Vegano",            desc: "Sem produtos de origem animal",          icon: "🌱" },
  { id: "low_carb",     label: "Low Carb",          desc: "Restrição de carboidratos",              icon: "🥑" },
  { id: "mediterraneo", label: "Mediterrâneo",      desc: "Peixe, azeite, legumes e grãos",        icon: "🫒" },
  { id: "sem_gluten",   label: "Sem Glúten",        desc: "Restrição a trigo, centeio e cevada",   icon: "🌾" },
];

const RESTRICOES: { id: string; label: string; icon: string }[] = [
  { id: "lactose",      label: "Intolerância à lactose",  icon: "🥛" },
  { id: "gluten",       label: "Intolerância ao glúten",  icon: "🌾" },
  { id: "ovo",          label: "Alergia a ovos",          icon: "🥚" },
  { id: "amendoim",     label: "Alergia a amendoim",      icon: "🥜" },
  { id: "frutos_mar",   label: "Alergia a frutos do mar", icon: "🦐" },
  { id: "soja",         label: "Alergia a soja",          icon: "🫘" },
  { id: "carne_suina",  label: "Não como carne suína",    icon: "🐷" },
  { id: "carne_bovina", label: "Não como carne bovina",   icon: "🐄" },
];

const HORARIOS: { id: HorarioTreino; label: string; desc: string; icon: string }[] = [
  { id: "manha",   label: "Manhã",    desc: "6h – 12h · carboidratos antes do treino",   icon: "🌅" },
  { id: "tarde",   label: "Tarde",    desc: "12h – 18h · jantar pós-treino",             icon: "☀️" },
  { id: "noite",   label: "Noite",    desc: "18h – 22h · ceia rica em proteína",         icon: "🌙" },
  { id: "variado", label: "Variado",  desc: "Horário muda conforme o dia",               icon: "🔄" },
];

const ORCAMENTOS: { id: Orcamento; label: string; exemplos: string }[] = [
  { id: "economico", label: "Econômico",  exemplos: "Ovo, frango, feijão, aveia" },
  { id: "moderado",  label: "Moderado",   exemplos: "+ Iogurte grego, salmão, whey" },
  { id: "premium",   label: "Premium",    exemplos: "+ Carne vermelha, suplementos variados" },
];

const REFEICOES_OPTIONS = [3, 4, 5, 6];

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function OnboardingNutricaoPage() {
  const router = useRouter();
  const [form, setForm] = useState<NutricaoForm>({
    estilo_alimentar:     "",
    restricoes:           [],
    horario_treino:       "",
    refeicoes_por_dia:    4,
    orcamento:            "",
    alimentos_aversao:    "",
    alimentos_preferidos: "",
  });
  const [errors, setErrors]   = useState<{ estilo?: string; horario?: string; orcamento?: string }>({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  function toggleRestricao(id: string) {
    setForm(prev => ({
      ...prev,
      restricoes: prev.restricoes.includes(id)
        ? prev.restricoes.filter(r => r !== id)
        : [...prev.restricoes, id],
    }));
  }

  function validate() {
    const errs: typeof errors = {};
    if (!form.estilo_alimentar) errs.estilo  = "Selecione seu estilo alimentar";
    if (!form.horario_treino)   errs.horario  = "Selecione o horário de treino";
    if (!form.orcamento)        errs.orcamento = "Selecione seu orçamento";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      estilo_alimentar:     form.estilo_alimentar,
      restricoes_alimentares: form.restricoes,
      horario_treino:       form.horario_treino,
      refeicoes_por_dia:    form.refeicoes_por_dia,
      orcamento_alimentar:  form.orcamento,
      alimentos_aversao:    form.alimentos_aversao || null,
      alimentos_preferidos: form.alimentos_preferidos || null,
    };

    // Salva no localStorage como cache imediato
    const perfil = JSON.parse(localStorage.getItem("personutri_profile") || "{}");
    localStorage.setItem("personutri_profile", JSON.stringify({ ...perfil, ...payload }));

    // Tenta salvar no Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("users").update(payload).eq("id", user.id);
      }
    } catch (_) { /* falha silenciosa — dado está no localStorage */ }

    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-5 px-6" style={{ background: "#F7F7F7" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: "#ECFDF5" }}>✅</div>
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Perfil nutricional salvo!</h2>
          <p className="text-sm mt-1" style={{ color: "#666" }}>Personalizando suas recomendações…</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1D9E75", animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header style={{ background: "#1D9E75" }} className="px-5 pt-12 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-3"
          style={{ color: "rgba(255,255,255,0.75)", background: "none", border: "none", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Voltar
        </button>
        <h1 className="text-white text-2xl font-bold leading-tight">Perfil nutricional</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>Restrições, preferências e estilo alimentar</p>
        <ProgressDots current={2} total={3} />
      </header>

      <div className="flex flex-col flex-1 px-5 py-6 gap-7">

        {/* Estilo alimentar */}
        <Section title="Estilo alimentar" error={errors.estilo}>
          <div className="grid grid-cols-2 gap-2">
            {ESTILOS.map(e => {
              const active = form.estilo_alimentar === e.id;
              return (
                <button key={e.id} type="button"
                  onClick={() => { setForm(p => ({ ...p, estilo_alimentar: e.id })); setErrors(p => ({ ...p, estilo: undefined })); }}
                  className="flex flex-col gap-1 p-3 rounded-xl text-left transition-all"
                  style={{ border: active ? "1px solid #1D9E75" : "0.5px solid #E5E5E5", background: active ? "rgba(29,158,117,0.06)" : "#fff" }}>
                  <span className="text-xl">{e.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: active ? "#1D9E75" : "#1A1A1A" }}>{e.label}</span>
                  <span className="text-[10px] leading-tight" style={{ color: "#999" }}>{e.desc}</span>
                  {active && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#1D9E75" }}>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Restrições e alergias */}
        <Section title="Restrições e alergias" subtitle="Opcional — selecione todas que se aplicam">
          <div className="grid grid-cols-2 gap-2">
            {RESTRICOES.map(r => {
              const active = form.restricoes.includes(r.id);
              return (
                <button key={r.id} type="button" onClick={() => toggleRestricao(r.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{ border: active ? "1px solid #D85A30" : "0.5px solid #E5E5E5", background: active ? "rgba(216,90,48,0.05)" : "#fff" }}>
                  <span className="text-base">{r.icon}</span>
                  <span className="text-[11px] font-medium leading-tight" style={{ color: active ? "#D85A30" : "#1A1A1A" }}>{r.label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Horário de treino */}
        <Section title="Horário de treino" subtitle="Impacta o timing de carboidratos" error={errors.horario}>
          <div className="flex flex-col gap-2">
            {HORARIOS.map(h => {
              const active = form.horario_treino === h.id;
              return (
                <button key={h.id} type="button"
                  onClick={() => { setForm(p => ({ ...p, horario_treino: h.id })); setErrors(p => ({ ...p, horario: undefined })); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{ border: active ? "1px solid #1A56A0" : "0.5px solid #E5E5E5", background: active ? "rgba(26,86,160,0.05)" : "#fff" }}>
                  <span className="text-xl">{h.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{h.label}</p>
                    <p className="text-[11px]" style={{ color: "#999" }}>{h.desc}</p>
                  </div>
                  {active && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1A56A0" }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Refeições por dia */}
        <Section title="Refeições por dia">
          <div className="flex gap-2">
            {REFEICOES_OPTIONS.map(n => {
              const active = form.refeicoes_por_dia === n;
              return (
                <button key={n} type="button" onClick={() => setForm(p => ({ ...p, refeicoes_por_dia: n }))}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ border: active ? "1px solid #1A56A0" : "0.5px solid #E5E5E5", background: active ? "#1A56A0" : "#fff", color: active ? "#fff" : "#999" }}>
                  {n}×
                </button>
              );
            })}
          </div>
          <p className="text-xs" style={{ color: "#999" }}>
            {form.refeicoes_por_dia <= 3 ? "Café, almoço e jantar" :
             form.refeicoes_por_dia === 4 ? "Café, lanche, almoço e jantar" :
             form.refeicoes_por_dia === 5 ? "Café, lanche, almoço, lanche da tarde e jantar" :
             "Café, lanche, almoço, lanche, jantar e ceia"}
          </p>
        </Section>

        {/* Orçamento */}
        <Section title="Orçamento alimentar" error={errors.orcamento}>
          <div className="flex flex-col gap-2">
            {ORCAMENTOS.map(o => {
              const active = form.orcamento === o.id;
              return (
                <button key={o.id} type="button"
                  onClick={() => { setForm(p => ({ ...p, orcamento: o.id })); setErrors(p => ({ ...p, orcamento: undefined })); }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                  style={{ border: active ? "1px solid #1A56A0" : "0.5px solid #E5E5E5", background: active ? "rgba(26,86,160,0.05)" : "#fff" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{o.label}</p>
                    <p className="text-xs" style={{ color: "#999" }}>{o.exemplos}</p>
                  </div>
                  {active && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1A56A0" }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Aversões e preferências */}
        <Section title="Preferências específicas" subtitle="Opcional">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Alimentos que não gosto ou evito</label>
              <textarea value={form.alimentos_aversao}
                onChange={e => setForm(p => ({ ...p, alimentos_aversao: e.target.value }))}
                placeholder="Ex: fígado, beterraba, couve-flor…"
                rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ border: "0.5px solid #E5E5E5", background: "#F7F7F7", color: "#1A1A1A" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Alimentos que adoro e quero incluir</label>
              <textarea value={form.alimentos_preferidos}
                onChange={e => setForm(p => ({ ...p, alimentos_preferidos: e.target.value }))}
                placeholder="Ex: salmão, abacate, iogurte grego, banana…"
                rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ border: "0.5px solid #E5E5E5", background: "#F7F7F7", color: "#1A1A1A" }} />
            </div>
          </div>
        </Section>

        <button onClick={handleSave} disabled={saving}
          style={{ background: "#1D9E75" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base transition-opacity active:opacity-80 disabled:opacity-60">
          {saving ? "Salvando…" : "Concluir perfil →"}
        </button>

        <p className="text-center text-xs pb-6" style={{ color: "#999" }}>
          Você pode alterar essas preferências a qualquer momento nas configurações
        </p>
      </div>
    </div>
  );
}

function Section({ title, subtitle, error, children }: {
  title: string; subtitle?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#666" }}>{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#999" }}>{subtitle}</p>}
      </div>
      {children}
      {error && <p className="text-xs font-medium" style={{ color: "#D85A30" }}>⚠ {error}</p>}
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 mt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="h-1.5 rounded-full transition-all"
          style={{ width: i === current ? 24 : 6, background: i === current ? "#fff" : "rgba(255,255,255,0.4)" }} />
      ))}
    </div>
  );
}
