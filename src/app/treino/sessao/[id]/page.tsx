"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { calcularProgressao, type SerieRegistrada } from "@/lib/progressao";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface ExercicioSessao {
  id: string;
  nome: string;
  grupo_muscular: string;
  padrao_movimento: string;
  series: number;
  reps_min: number;
  reps_max: number;
  rir_alvo: number;
  tempo_descanso_s: number;
  carga_sugerida: number;
}

interface SerieRegistradaLocal extends SerieRegistrada {
  id: string;
  serie_num: number;
}

type ViewSessao = "ativa" | "rest" | "progressao" | "concluida";

const EXERCICIOS_MOCK: ExercicioSessao[] = [];

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function SessaoPage() {
  const router = useRouter();

  // Session state
  const [exercicios] = useState<ExercicioSessao[]>(EXERCICIOS_MOCK);
  const [exIdx, setExIdx] = useState(0);
  const [seriesLog, setSeriesLog] = useState<Record<string, SerieRegistradaLocal[]>>({});
  const [view, setView] = useState<ViewSessao>("ativa");

  // Form inputs
  const [carga, setCarga] = useState(0);
  const [reps, setReps]   = useState(10);
  const [rir, setRir]     = useState(2);

  // Timers
  const [sessaoSecs, setSessaoSecs] = useState(0);
  const [restSecs, setRestSecs] = useState(0);
  const [restTotal, setRestTotal] = useState(120);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Progressão result
  const [progressaoResult, setProgressaoResult] = useState<ReturnType<typeof calcularProgressao> | null>(null);

  // Cronômetro da sessão
  useEffect(() => {
    const interval = setInterval(() => setSessaoSecs(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const ex = exercicios[exIdx];
  const seriesEx = seriesLog[ex.id] ?? [];
  const serieAtual = seriesEx.length + 1;
  const isUltimaSerie = serieAtual > ex.series;

  function fmtTime(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${ss.toString().padStart(2,"0")}`;
    return `${m.toString().padStart(2,"0")}:${ss.toString().padStart(2,"0")}`;
  }

  function startRest(secs: number) {
    setRestTotal(secs);
    setRestSecs(secs);
    setView("rest");
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestSecs(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current!);
          setView("ativa");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (restRef.current) clearInterval(restRef.current);
    setView("ativa");
  }

  const salvarSerie = useCallback(() => {
    const nova: SerieRegistradaLocal = {
      id: `${ex.id}-${serieAtual}`,
      serie_num: serieAtual,
      carga_kg: carga,
      reps,
      rir,
    };
    const novasSeries = [...seriesEx, nova];
    setSeriesLog(prev => ({ ...prev, [ex.id]: novasSeries }));

    const isLastSerieOfEx = novasSeries.length >= ex.series;

    if (isLastSerieOfEx) {
      // Última série do exercício — calcular progressão
      const resultado = calcularProgressao(novasSeries, ex.reps_min, ex.reps_max, ex.rir_alvo, carga);
      setProgressaoResult(resultado);
      setView("progressao");
    } else {
      // Inicia timer de descanso
      startRest(ex.tempo_descanso_s);
    }
  }, [ex, serieAtual, seriesEx, carga, reps, rir]);

  function avancarExercicio() {
    const proximo = exIdx + 1;
    if (proximo >= exercicios.length) {
      setView("concluida");
    } else {
      setExIdx(proximo);
      const prox = exercicios[proximo];
      setCarga(prox.carga_sugerida);
      setReps(prox.reps_max);
      setRir(prox.rir_alvo);
      setProgressaoResult(null);
      startRest(ex.tempo_descanso_s);
    }
  }

  // ── Views ────────────────────────────────────────────────────────────────

  if (exercicios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6" style={{ background: "#F7F7F7" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(26,86,160,0.08)" }}>🏋️</div>
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: "#1A1A1A" }}>Plano de exercícios em breve</p>
          <p className="text-sm mt-1" style={{ color: "#666" }}>Os exercícios personalizados para sua sessão estarão disponíveis após a geração do plano.</p>
        </div>
        <button onClick={() => router.push("/treino")}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#1A56A0", border: "none", cursor: "pointer" }}>
          Voltar ao Treino
        </button>
      </div>
    );
  }

  if (view === "concluida") {
    return <SessaoConcluida duracao={fmtTime(sessaoSecs)} exercicios={exercicios} seriesLog={seriesLog} onVoltar={() => router.push("/treino")} />;
  }

  if (view === "rest") {
    return (
      <RestScreen
        secs={restSecs}
        total={restTotal}
        proximaDescricao={isUltimaSerie ? `${exercicios[exIdx + 1]?.nome ?? "Próximo"}` : `Série ${serieAtual} de ${ex.series}`}
        onSkip={skipRest}
      />
    );
  }

  if (view === "progressao" && progressaoResult) {
    const isUltimoEx = exIdx >= exercicios.length - 1;
    return (
      <ProgressaoScreen
        resultado={progressaoResult}
        exercicio={ex}
        series={seriesEx}
        isUltimoEx={isUltimoEx}
        onContinuar={avancarExercicio}
        onConcluir={() => setView("concluida")}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => router.push("/treino")} className="text-white/60 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-white/70 text-xs uppercase tracking-wider">Push A — Peito + Tríceps</p>
            <p className="text-white font-bold text-lg">{fmtTime(sessaoSecs)}</p>
          </div>
          <div className="w-5" />
        </div>

        {/* Exercise progress */}
        <div className="flex gap-1.5 mt-2">
          {exercicios.map((e, i) => (
            <div key={e.id} className={`flex-1 h-1 rounded-full transition-all ${
              i < exIdx ? "bg-green-400" : i === exIdx ? "bg-white" : "bg-white/30"
            }`} />
          ))}
        </div>
      </header>

      <div className="flex flex-col flex-1 px-5 py-5 gap-4 pb-6">

        {/* Current exercise card */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted font-medium uppercase tracking-wide">
                  Exercício {exIdx + 1} de {exercicios.length}
                </p>
                <h2 className="text-lg font-bold text-text mt-0.5 leading-tight">{ex.nome}</h2>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <Badge color="#1A56A0" bg="#EBF2FB">{ex.grupo_muscular}</Badge>
                <Badge color="#6B7280" bg="#F3F4F6">{ex.padrao_movimento}</Badge>
              </div>
            </div>

            {/* Prescrição */}
            <div className="flex gap-2 mt-3">
              <PrescricaoItem label="Séries" value={`${ex.series}×`} />
              <PrescricaoItem label="Reps" value={`${ex.reps_min}–${ex.reps_max}`} />
              <PrescricaoItem label="RIR alvo" value={String(ex.rir_alvo)} />
              <PrescricaoItem label="Descanso" value={`${ex.tempo_descanso_s}s`} />
            </div>
          </div>

          {/* Serie atual indicator */}
          <div className="px-4 py-2 bg-gray-50 border-t border-border flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: ex.series }).map((_, i) => (
                <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i < seriesEx.length ? "bg-green-500 text-white" :
                  i === seriesEx.length ? "text-white" : "bg-gray-200 text-gray-400"
                }`}
                  style={i === seriesEx.length ? { background: "#1A56A0" } : {}}>
                  {i < seriesEx.length ? "✓" : i + 1}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted ml-1">
              {seriesEx.length >= ex.series ? "Todas as séries concluídas" : `Série ${serieAtual} de ${ex.series}`}
            </span>
          </div>
        </div>

        {/* Input area */}
        {seriesEx.length < ex.series && (
          <div className="bg-white rounded-xl border border-border px-4 py-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Registrar série {serieAtual}</p>
            <div className="flex gap-3">
              <NumberInput label="Carga (kg)" value={carga} step={2.5} min={0} max={500} onChange={setCarga} accent />
              <NumberInput label="Reps" value={reps} step={1} min={1} max={50} onChange={setReps} />
              <NumberInput label="RIR" value={rir} step={1} min={0} max={10} onChange={setRir} />
            </div>

            <button onClick={salvarSerie}
              style={{ background: "#1D9E75" }}
              className="w-full text-white font-bold py-3.5 rounded-xl text-sm mt-4 active:opacity-80 transition-opacity flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Salvar Série {serieAtual}
            </button>
          </div>
        )}

        {/* Previous series */}
        {seriesEx.length > 0 && (
          <div className="bg-white rounded-xl border border-border px-4 py-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Séries registradas</p>
            <div className="flex flex-col gap-1.5">
              {seriesEx.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-xs text-muted">Série {s.serie_num}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-text">{s.carga_kg} kg</span>
                    <span className="text-muted">×</span>
                    <span className="font-bold text-text">{s.reps} reps</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-muted">RIR {s.rir}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximos exercícios */}
        {exIdx < exercicios.length - 1 && (
          <div className="bg-white rounded-xl border border-border px-4 py-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Próximos exercícios</p>
            <div className="flex flex-col gap-1.5">
              {exercicios.slice(exIdx + 1).map((e, i) => (
                <div key={e.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-muted">
                    {exIdx + i + 2}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{e.nome}</p>
                    <p className="text-xs text-muted">{e.series}× · {e.reps_min}–{e.reps_max} reps</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Rest Screen ─────────────────────────────────────────────────────────── */
function RestScreen({ secs, total, proximaDescricao, onSkip }: {
  secs: number; total: number; proximaDescricao: string; onSkip: () => void;
}) {
  const pct = (secs / total) * 100;
  const r = 56;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 gap-8" style={{ background: "#1A56A0" }}>
      <p className="text-white/70 text-sm uppercase tracking-widest font-medium">Intervalo</p>

      {/* Circular timer */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <circle cx="64" cy="64" r={r} fill="none" stroke="white" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white text-4xl font-bold tabular-nums">{Math.floor(secs/60).toString().padStart(2,"0")}:{(secs%60).toString().padStart(2,"0")}</span>
          <span className="text-white/60 text-xs">restantes</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-white/60 text-xs mb-1">Próximo</p>
        <p className="text-white font-bold text-lg">{proximaDescricao}</p>
      </div>

      <button onClick={onSkip}
        className="border-2 border-white/40 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">
        Pular intervalo →
      </button>
    </div>
  );
}

/* ─── Progressão Screen ───────────────────────────────────────────────────── */
function ProgressaoScreen({ resultado, exercicio, series, isUltimoEx, onContinuar, onConcluir }: {
  resultado: ReturnType<typeof calcularProgressao>;
  exercicio: ExercicioSessao;
  series: SerieRegistradaLocal[];
  isUltimoEx: boolean;
  onContinuar: () => void;
  onConcluir: () => void;
}) {
  const colorMap: Record<string, string> = {
    aumentar_carga: "#1D9E75",
    aumentar_reps:  "#1A56A0",
    manter:         "#6B7280",
    reduzir_carga:  "#D85A30",
    deload:         "#D85A30",
  };
  const iconMap: Record<string, string> = {
    aumentar_carga: "📈",
    aumentar_reps:  "🎯",
    manter:         "✅",
    reduzir_carga:  "📉",
    deload:         "💤",
  };
  const color = colorMap[resultado.sugestao] ?? "#6B7280";
  const icon  = iconMap[resultado.sugestao] ?? "✅";

  return (
    <div className="flex flex-col min-h-dvh">
      <header style={{ background: "#1A56A0" }} className="px-5 pt-10 pb-5">
        <p className="text-white/70 text-xs uppercase tracking-wider">Exercício concluído</p>
        <h2 className="text-white text-xl font-bold mt-0.5">{exercicio.nome}</h2>
      </header>

      <div className="flex flex-col flex-1 px-5 py-6 gap-4">

        {/* Resumo das séries */}
        <div className="bg-white rounded-xl border border-border px-4 py-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Resumo</p>
          <div className="flex gap-3">
            <SummaryCard label="Séries" value={`${series.length}/${exercicio.series}`} />
            <SummaryCard label="Carga média" value={`${(series.reduce((s,r)=>s+r.carga_kg,0)/series.length).toFixed(1)} kg`} />
            <SummaryCard label="RIR médio" value={(series.reduce((s,r)=>s+r.rir,0)/series.length).toFixed(1)} />
          </div>
        </div>

        {/* Progressão feedback */}
        <div className="rounded-xl border-2 px-4 py-4" style={{ borderColor: color, background: `${color}10` }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>Progressão dupla</p>
              <p className="text-base font-bold text-text">{resultado.mensagem}</p>
            </div>
          </div>
          <p className="text-sm text-muted leading-relaxed">{resultado.detalhe}</p>
        </div>

        {/* Carga próxima sessão */}
        {resultado.delta_carga !== 0 && (
          <div className="bg-white rounded-xl border border-border px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Carga atual</p>
              <p className="text-lg font-bold text-text">{series[0]?.carga_kg} kg</p>
            </div>
            <div className="text-2xl">→</div>
            <div className="text-right">
              <p className="text-xs text-muted">Próxima sessão</p>
              <p className="text-lg font-bold" style={{ color }}>
                {(series[0]?.carga_kg + resultado.delta_carga).toFixed(1)} kg
              </p>
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3">
          {isUltimoEx ? (
            <button onClick={onConcluir}
              style={{ background: "#1D9E75" }}
              className="w-full text-white font-bold py-4 rounded-xl text-base active:opacity-80 transition-opacity">
              Finalizar sessão 🎉
            </button>
          ) : (
            <button onClick={onContinuar}
              style={{ background: "#1A56A0" }}
              className="w-full text-white font-bold py-4 rounded-xl text-base active:opacity-80 transition-opacity">
              Próximo exercício →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sessão Concluída ────────────────────────────────────────────────────── */
function SessaoConcluida({ duracao, exercicios, seriesLog, onVoltar }: {
  duracao: string;
  exercicios: ExercicioSessao[];
  seriesLog: Record<string, SerieRegistradaLocal[]>;
  onVoltar: () => void;
}) {
  const totalSeries = Object.values(seriesLog).reduce((s, arr) => s + arr.length, 0);
  const totalVolume = Object.values(seriesLog).flatMap(arr => arr).reduce((s, r) => s + r.carga_kg * r.reps, 0);

  return (
    <div className="flex flex-col min-h-dvh">
      <header style={{ background: "#1D9E75" }} className="px-5 pt-12 pb-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-white text-2xl font-bold">Sessão concluída!</h1>
        <p className="text-white/70 text-sm mt-1">Push A — Peito + Tríceps</p>
      </header>

      <div className="flex flex-col flex-1 px-5 py-6 gap-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Duração" value={duracao} icon="⏱" />
          <StatCard label="Séries" value={String(totalSeries)} icon="💪" />
          <StatCard label="Volume" value={`${(totalVolume/1000).toFixed(1)}t`} icon="🏋️" />
        </div>

        {/* Per-exercise summary */}
        <div className="bg-white rounded-xl border border-border px-4 py-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Exercícios</p>
          {exercicios.map(ex => {
            const series = seriesLog[ex.id] ?? [];
            const melhorSerie = series.reduce((m, s) => s.reps > m.reps ? s : m, series[0] ?? { carga_kg: 0, reps: 0, rir: 0 });
            return (
              <div key={ex.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-text">{ex.nome}</p>
                  <p className="text-xs text-muted">{series.length} séries realizadas</p>
                </div>
                {melhorSerie.carga_kg > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-text">{melhorSerie.carga_kg} kg × {melhorSerie.reps}</p>
                    <p className="text-xs text-muted">melhor série</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onVoltar}
          style={{ background: "#1A56A0" }}
          className="w-full text-white font-bold py-4 rounded-xl text-base mt-auto active:opacity-80 transition-opacity">
          Voltar ao plano
        </button>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>
      {children}
    </span>
  );
}

function PrescricaoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg px-2 py-2 text-center">
      <p className="text-[10px] text-muted uppercase">{label}</p>
      <p className="text-sm font-bold text-text mt-0.5">{value}</p>
    </div>
  );
}

function NumberInput({ label, value, step, min, max, onChange, accent }: {
  label: string; value: number; step: number; min: number; max: number;
  onChange: (v: number) => void; accent?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col gap-1">
      <p className="text-xs text-muted text-center">{label}</p>
      <div className={`flex flex-col items-center border rounded-xl overflow-hidden ${accent ? "border-blue-300" : "border-border"}`}>
        <button type="button" onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
          className={`w-full py-2 text-lg font-bold transition-colors ${accent ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "bg-gray-50 text-text hover:bg-gray-100"}`}>
          +
        </button>
        <div className={`w-full text-center py-2 text-base font-bold ${accent ? "text-blue-700" : "text-text"}`}>
          {value % 1 === 0 ? value : value.toFixed(1)}
        </div>
        <button type="button" onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
          className={`w-full py-2 text-lg font-bold transition-colors ${accent ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "bg-gray-50 text-text hover:bg-gray-100"}`}>
          −
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg px-2 py-3 text-center">
      <p className="text-[10px] text-muted uppercase">{label}</p>
      <p className="text-base font-bold text-text mt-0.5">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-border px-3 py-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-lg font-bold text-text">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
