"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type NivelTreino   = "iniciante" | "intermediario" | "avancado";
type DivisaoTreino = "fullbody" | "upper_lower" | "push_pull_legs" | "bro_split";

interface AnamneseForm {
  experiencia_anos:    string;
  dias_por_semana:     number;
  duracao_sessao_min:  number;
  divisao_preferida:   DivisaoTreino | "";
  equipamentos:        string[];
  historico_lesoes:    string;
  preferencias:        string;
  objetivo_especifico: string;
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
  { id: "fullbody",       label: "Full Body",          desc: "Treino o corpo inteiro em cada sessão", min_dias: 2 },
  { id: "upper_lower",    label: "Upper / Lower",      desc: "Alterna superior e inferior",           min_dias: 3 },
  { id: "push_pull_legs", label: "Push / Pull / Legs", desc: "Empurrar, puxar e pernas",              min_dias: 4 },
  { id: "bro_split",      label: "Bro Split",          desc: "Um grupo muscular por dia",             min_dias: 5 },
];

function calcNivel(anos: number): NivelTreino {
  if (anos < 1)  return "iniciante";
  if (anos <= 3) return "intermediario";
  return "avancado";
}

function recomendar(dias: number, nivel: NivelTreino | null): { id: DivisaoTreino; motivo: string } {
  if (dias <= 2) return { id: "fullbody",       motivo: "Com 2 dias/semana, o Full Body maximiza a frequência de estímulo por grupo muscular — o fator mais importante para hipertrofia com pouco volume semanal." };
  if (dias === 3) {
    if (nivel === "iniciante") return { id: "fullbody",    motivo: "Iniciantes respondem melhor a alta frequência. O Full Body 3× permite mais repetições de cada padrão de movimento, acelerando o aprendizado motor." };
    return { id: "upper_lower", motivo: "Upper/Lower 3× é a divisão com melhor evidência para intermediários: frequência 1,5× por músculo, volume adequado e boa recuperação entre sessões." };
  }
  if (dias === 4) return { id: "upper_lower",    motivo: "Upper/Lower 4× é o protocolo com mais suporte científico para hipertrofia — frequência 2× por grupo muscular e volume distribuído de forma ideal (Schoenfeld et al., 2016)." };
  if (dias === 5) {
    if (nivel === "avancado") return { id: "push_pull_legs", motivo: "PPL 5× oferece volume alto por sessão com frequência adequada para avançados que precisam de maior estímulo por sessão para continuar progredindo." };
    return { id: "upper_lower", motivo: "Upper/Lower 4× + 1 sessão extra (Upper ou Lower) dá frequência alta sem comprometer a recuperação — ideal para quem tem 5 dias mas ainda não é avançado." };
  }
  return { id: "push_pull_legs", motivo: "Com 6 dias/semana, o PPL 2× é a melhor escolha: cada grupo muscular treinado 2× com volume alto por sessão. Requer boa recuperação e alimentação alinhada." };
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
    preferencias:        "",
    objetivo_especifico: "",
  });
  const [errors, setErrors]           = useState<Partial<Record<keyof AnamneseForm, string>>>({});
  const [submitted, setSubmitted]     = useState(false);
  const [showOutras, setShowOutras]   = useState(false);

  const anos           = parseFloat(form.experiencia_anos);
  const nivelCalculado = isNaN(anos) ? null : calcNivel(anos);
  const recomendacao   = useMemo(() => recomendar(form.dias_por_semana, nivelCalculado), [form.dias_por_semana, nivelCalculado]);

  // Divisão efetiva: manual se escolheu outra, senão a recomendada
  const divisaoEfetiva: DivisaoTreino = (form.divisao_preferida || recomendacao.id) as DivisaoTreino;
  const divisaoInfo = DIVISOES.find(d => d.id === divisaoEfetiva)!;

  const divisoesAlternativas = DIVISOES.filter(d => d.min_dias <= form.dias_por_semana && d.id !== recomendacao.id);

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
    if (form.equipamentos.length === 0)        errs.equipamentos     = "Selecione pelo menos um equipamento";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const existing = JSON.parse(localStorage.getItem("personutri_profile") || "{}");
    localStorage.setItem("personutri_anamnese", JSON.stringify({
      ...form,
      divisao_preferida: divisaoEfetiva,
      nivel_treino: nivelCalculado,
      user_id: existing.id ?? null,
    }));
    setSubmitted(true);
    setTimeout(() => router.push("/treino"), 1800);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: "#ECFDF5" }}>✅</div>
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Anamnese salva!</h2>
          <p className="text-sm mt-1" style={{ color: "#666" }}>Gerando seu plano personalizado…</p>
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
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-3" style={{ color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Voltar
        </button>
        <h1 className="text-white text-2xl font-bold leading-tight">Anamnese de treino</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Personalize seu plano de hipertrofia</p>
        <ProgressDots current={1} total={2} />
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 px-5 py-6 gap-7">

        {/* Experiência */}
        <Section title="Experiência">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
              Anos de treino com pesos <span style={{ color: "#D85A30" }}>*</span>
            </label>
            <div className="flex gap-3 items-start">
              <input
                type="number" inputMode="decimal"
                value={form.experiencia_anos}
                onChange={e => { setForm(prev => ({ ...prev, experiencia_anos: e.target.value })); setErrors(prev => ({ ...prev, experiencia_anos: undefined })); }}
                placeholder="Ex: 2.5" min={0} max={50} step={0.5}
                className="w-32 px-3 py-3 rounded-lg text-sm outline-none"
                style={{ border: errors.experiencia_anos ? "1px solid #D85A30" : "0.5px solid #E5E5E5", background: "#F7F7F7" }}
              />
              {nivelCalculado && (
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: NIVEL_CONFIG[nivelCalculado].bg }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: NIVEL_CONFIG[nivelCalculado].color }} />
                  <div>
                    <div className="text-xs font-bold" style={{ color: NIVEL_CONFIG[nivelCalculado].color }}>{NIVEL_CONFIG[nivelCalculado].label}</div>
                    <div className="text-xs" style={{ color: NIVEL_CONFIG[nivelCalculado].color, opacity: 0.7 }}>{NIVEL_CONFIG[nivelCalculado].desc}</div>
                  </div>
                </div>
              )}
            </div>
            {errors.experiencia_anos && <p className="text-xs font-medium" style={{ color: "#D85A30" }}>⚠ {errors.experiencia_anos}</p>}
          </div>
        </Section>

        {/* Logística */}
        <Section title="Logística de treino">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Dias por semana <span style={{ color: "#D85A30" }}>*</span></label>
              <span className="text-lg font-bold" style={{ color: "#1A56A0" }}>{form.dias_por_semana}×</span>
            </div>
            <input type="range" min={2} max={6} step={1} value={form.dias_por_semana}
              onChange={e => setForm(prev => ({ ...prev, dias_por_semana: parseInt(e.target.value), divisao_preferida: "" }))}
              className="w-full h-2 rounded-full outline-none cursor-pointer" style={{ accentColor: "#1A56A0" }} />
            <div className="flex justify-between text-xs px-0.5" style={{ color: "#999" }}>
              {[2,3,4,5,6].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Duração da sessão <span style={{ color: "#D85A30" }}>*</span></label>
              <span className="text-lg font-bold" style={{ color: "#1A56A0" }}>{form.duracao_sessao_min} min</span>
            </div>
            <input type="range" min={30} max={120} step={15} value={form.duracao_sessao_min}
              onChange={e => setForm(prev => ({ ...prev, duracao_sessao_min: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-full outline-none cursor-pointer" style={{ accentColor: "#1A56A0" }} />
            <div className="flex justify-between text-xs px-0.5" style={{ color: "#999" }}>
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
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm text-left transition-all"
                  style={{ border: active ? "1px solid #1A56A0" : "0.5px solid #E5E5E5", background: active ? "rgba(26,86,160,0.05)" : "#fff" }}>
                  <span className="text-lg leading-none">{eq.icon}</span>
                  <span className="font-medium leading-tight text-xs" style={{ color: "#1A1A1A" }}>{eq.label}</span>
                  {active && (
                    <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#1A56A0" }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {errors.equipamentos && <p className="text-xs font-medium" style={{ color: "#D85A30" }}>⚠ {errors.equipamentos}</p>}
        </Section>

        {/* Divisão — recomendação automática */}
        <Section title="Divisão de treino recomendada">
          <div className="rounded-xl p-4" style={{ background: "rgba(26,86,160,0.05)", border: "1px solid #1A56A0" }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold" style={{ color: "#1A56A0" }}>{divisaoInfo.label}</span>
                  {!form.divisao_preferida && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#1A56A0", color: "#fff" }}>Recomendado</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#666" }}>{divisaoInfo.desc}</p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1A56A0" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: "#444" }}>{recomendacao.motivo}</p>
          </div>

          {/* Ver outras opções */}
          {divisoesAlternativas.length > 0 && (
            <div>
              <button type="button" onClick={() => setShowOutras(v => !v)}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: "#1A56A0", background: "none", border: "none", cursor: "pointer" }}>
                {showOutras ? "▲ Ocultar outras opções" : "▼ Ver outras opções"}
              </button>
              {showOutras && (
                <div className="flex flex-col gap-2 mt-2">
                  {divisoesAlternativas.map(div => {
                    const active = form.divisao_preferida === div.id;
                    return (
                      <button key={div.id} type="button"
                        onClick={() => setForm(prev => ({ ...prev, divisao_preferida: active ? "" : div.id }))}
                        className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                        style={{ border: active ? "1px solid #1A56A0" : "0.5px solid #E5E5E5", background: active ? "rgba(26,86,160,0.05)" : "#fff" }}>
                        <div className="text-left">
                          <div className="font-semibold" style={{ color: "#1A1A1A" }}>{div.label}</div>
                          <div className="text-xs" style={{ color: "#666" }}>{div.desc} · mín. {div.min_dias} dias</div>
                        </div>
                        {active && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="#1A56A0"/>
                            <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Histórico (opcional) */}
        <Section title="Histórico e preferências (opcional)">
          <div className="flex flex-col gap-3">
            {[
              { key: "historico_lesoes",    label: "Lesões ou limitações físicas",  placeholder: "Ex: tendinite no ombro direito, dor lombar crônica…" },
              { key: "preferencias",        label: "Preferências de exercícios",    placeholder: "Ex: prefiro exercícios compostos, não gosto de leg press…" },
              { key: "objetivo_especifico", label: "Objetivo específico",           placeholder: "Ex: aumentar peito e ombros, melhorar postura…" },
            ].map(field => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{field.label}</label>
                <textarea
                  value={form[field.key as keyof AnamneseForm] as string}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder} rows={2}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ border: "0.5px solid #E5E5E5", background: "#F7F7F7", color: "#1A1A1A" }}
                />
              </div>
            ))}
          </div>
        </Section>

        <button type="submit" style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base mt-auto transition-opacity active:opacity-80">
          Gerar meu plano de treino →
        </button>
        <p className="text-center text-xs pb-4" style={{ color: "#999" }}>
          Plano gerado com IA baseado em evidências científicas de hipertrofia
        </p>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#666" }}>{title}</h2>
      {children}
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 mt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-1.5"}`}
          style={{ background: i === current ? "#fff" : "rgba(255,255,255,0.4)" }} />
      ))}
    </div>
  );
}
