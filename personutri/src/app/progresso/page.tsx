"use client";

import { useState, useMemo } from "react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Tab = "cargas" | "volume" | "medidas" | "fotos";

interface PontoEvol {
  semana: string;  // "DD/MM"
  carga_kg: number;
  reps: number;
  plato?: boolean;
}

interface PontoVolume {
  semana: string;
  series_totais: number;
  volume_kg: number;
}

interface Medida {
  id: string;
  data: string;
  peso_kg: number;
  gordura_pct?: number;
  peito_cm?: number;
  cintura_cm?: number;
  quadril_cm?: number;
  braco_d_cm?: number;
  coxa_d_cm?: number;
  panturrilha_d_cm?: number;
}

/* ─── Mock data ───────────────────────────────────────────────────────────── */
const EXERCICIOS_OPCOES = [
  "Supino Reto com Barra",
  "Agachamento com Barra",
  "Levantamento Terra",
  "Desenvolvimento com Barra",
  "Remada Curvada com Barra",
  "Rosca Direta com Barra",
  "Tríceps Corda no Cabo",
];

const EVOLUCAO_MOCK: Record<string, PontoEvol[]> = {
  "Supino Reto com Barra": [
    { semana:"01/04", carga_kg:70,  reps:10 },
    { semana:"08/04", carga_kg:72.5,reps:10 },
    { semana:"15/04", carga_kg:75,  reps:10 },
    { semana:"22/04", carga_kg:77.5,reps:9  },
    { semana:"29/04", carga_kg:77.5,reps:9, plato:true },
    { semana:"06/05", carga_kg:77.5,reps:10,plato:true },
    { semana:"13/05", carga_kg:80,  reps:9  },
    { semana:"20/05", carga_kg:82.5,reps:8  },
  ],
  "Agachamento com Barra": [
    { semana:"01/04", carga_kg:100, reps:8  },
    { semana:"08/04", carga_kg:102.5,reps:8 },
    { semana:"15/04", carga_kg:105, reps:8  },
    { semana:"22/04", carga_kg:107.5,reps:7 },
    { semana:"29/04", carga_kg:110, reps:7  },
    { semana:"06/05", carga_kg:110, reps:8  },
    { semana:"13/05", carga_kg:112.5,reps:7 },
    { semana:"20/05", carga_kg:115, reps:7  },
  ],
};

const VOLUME_MOCK: PontoVolume[] = [
  { semana:"Sem 1", series_totais:42, volume_kg:8400  },
  { semana:"Sem 2", series_totais:45, volume_kg:9100  },
  { semana:"Sem 3", series_totais:44, volume_kg:8800  },
  { semana:"Sem 4", series_totais:48, volume_kg:9600  },
  { semana:"Sem 5", series_totais:46, volume_kg:9300  },
  { semana:"Sem 6", series_totais:50, volume_kg:10200 },
  { semana:"Sem 7", series_totais:48, volume_kg:9900  },
  { semana:"Sem 8", series_totais:52, volume_kg:10800 },
];

const MEDIDAS_MOCK: Medida[] = [
  { id:"m1", data:"2026-03-01", peso_kg:82.0, gordura_pct:18.0, peito_cm:102, cintura_cm:84, quadril_cm:98,  braco_d_cm:37, coxa_d_cm:57, panturrilha_d_cm:38 },
  { id:"m2", data:"2026-04-01", peso_kg:82.8, gordura_pct:17.5, peito_cm:103, cintura_cm:83, quadril_cm:98,  braco_d_cm:37.5, coxa_d_cm:58, panturrilha_d_cm:38 },
  { id:"m3", data:"2026-05-01", peso_kg:83.4, gordura_pct:17.0, peito_cm:104, cintura_cm:83, quadril_cm:99,  braco_d_cm:38, coxa_d_cm:58.5, panturrilha_d_cm:38.5 },
  { id:"m4", data:"2026-06-01", peso_kg:84.1, gordura_pct:16.8, peito_cm:105, cintura_cm:82, quadril_cm:99,  braco_d_cm:38.5, coxa_d_cm:59, panturrilha_d_cm:38.5 },
];

const BLANK_MEDIDA = (): Omit<Medida,"id"> => ({
  data: new Date().toISOString().split("T")[0],
  peso_kg:0, gordura_pct:undefined,
  peito_cm:undefined, cintura_cm:undefined, quadril_cm:undefined,
  braco_d_cm:undefined, coxa_d_cm:undefined, panturrilha_d_cm:undefined,
});

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ProgressoPage() {
  const [tab, setTab] = useState<Tab>("cargas");

  return (
    <div className="flex flex-col min-h-dvh bg-surface pb-20">
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-10 pb-4">
        <h1 className="text-white text-xl font-bold">Progresso</h1>
        <p className="text-white/60 text-xs mt-0.5">Acompanhe sua evolução</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border bg-white sticky top-0 z-10">
        {([
          { id:"cargas",  label:"Cargas"  },
          { id:"volume",  label:"Volume"  },
          { id:"medidas", label:"Medidas" },
          { id:"fotos",   label:"Fotos"   },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
              tab === t.id
                ? "border-[#1A56A0] text-[#1A56A0]"
                : "border-transparent text-muted"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {tab === "cargas"  && <TabCargas />}
        {tab === "volume"  && <TabVolume />}
        {tab === "medidas" && <TabMedidas />}
        {tab === "fotos"   && <TabFotos />}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-border flex z-40">
        {[
          { href:"/dashboard",      label:"Dashboard", icon:"⊞" },
          { href:"/treino",         label:"Treino",    icon:"🏋️" },
          { href:"/nutricao/diario",label:"Nutrição",  icon:"🥗" },
          { href:"/progresso",      label:"Progresso", icon:"📈", active:true },
          { href:"/ia",             label:"IA",        icon:"🤖" },
        ].map(item => (
          <a key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium"
            style={{ color: item.active ? "#1A56A0" : "#9CA3AF" }}>
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

/* ─── Tab Cargas ──────────────────────────────────────────────────────────── */
function TabCargas() {
  const [exercicio, setExercicio] = useState(EXERCICIOS_OPCOES[0]);
  const dados = EVOLUCAO_MOCK[exercicio] ?? EVOLUCAO_MOCK["Supino Reto com Barra"];

  const cargas = dados.map(d => d.carga_kg);
  const min = Math.min(...cargas) - 5;
  const max = Math.max(...cargas) + 5;
  const range = max - min;

  const W = 320; const H = 160;
  const padL = 40; const padR = 12; const padT = 12; const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const pts = dados.map((d, i) => ({
    x: padL + (i / (dados.length - 1)) * chartW,
    y: padT + (1 - (d.carga_kg - min) / range) * chartH,
    ...d,
  }));

  const linha = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area  = `${linha} L ${pts[pts.length-1].x} ${padT+chartH} L ${pts[0].x} ${padT+chartH} Z`;

  const ultimo = dados[dados.length - 1];
  const penultimo = dados[dados.length - 2];
  const deltaCarga = ultimo.carga_kg - penultimo.carga_kg;
  const inicioKg = dados[0].carga_kg;
  const ganhoTotal = ultimo.carga_kg - inicioKg;
  const temPlato = dados.some(d => d.plato);

  // Linhas de grade Y
  const gradeY = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y: padT + pct * chartH,
    label: (max - pct * range).toFixed(0),
  }));

  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      {/* Dropdown */}
      <select value={exercicio} onChange={e => setExercicio(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm font-semibold text-text outline-none focus:border-blue-400 transition-all">
        {EXERCICIOS_OPCOES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
      </select>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Última carga" value={`${ultimo.carga_kg}kg`} />
        <StatCard label="Evolução" value={`+${ganhoTotal}kg`} color="#1D9E75" />
        <StatCard label={deltaCarga >= 0 ? "↑ Semana" : "↓ Semana"}
          value={`${deltaCarga >= 0 ? "+" : ""}${deltaCarga}kg`}
          color={deltaCarga >= 0 ? "#1D9E75" : "#D85A30"} />
      </div>

      {/* Alerta platô */}
      {temPlato && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
          style={{ background:"#FEF9EC", borderColor:"#F59E0B" }}>
          <span className="text-base flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold" style={{color:"#92400E"}}>Platô detectado</p>
            <p className="text-xs mt-0.5" style={{color:"#92400E"}}>
              Carga estabilizou por 2+ semanas. Considere ajustar volume, intensidade ou técnica.
            </p>
          </div>
        </div>
      )}

      {/* Gráfico SVG */}
      <div className="bg-white rounded-xl border border-border px-3 pt-4 pb-2">
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 px-1">Evolução de carga — últimas 8 semanas</p>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          {/* Grade */}
          {gradeY.map((g, i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={padL+chartW} y2={g.y} stroke="#F3F4F6" strokeWidth="1"/>
              <text x={padL-4} y={g.y+4} fontSize="9" fill="#9CA3AF" textAnchor="end">{g.label}</text>
            </g>
          ))}

          {/* Área */}
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1A56A0" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#1A56A0" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill="url(#grad)"/>

          {/* Linha */}
          <path d={linha} fill="none" stroke="#1A56A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Pontos */}
          {pts.map((p, i) => (
            <g key={i}>
              {p.plato && (
                <circle cx={p.x} cy={p.y} r="8" fill="#FEF9EC" stroke="#F59E0B" strokeWidth="1.5"/>
              )}
              <circle cx={p.x} cy={p.y} r={p.plato ? 4 : 4} fill={p.plato ? "#F59E0B" : "#1A56A0"} stroke="white" strokeWidth="2"/>
              {/* Label carga */}
              <text x={p.x} y={p.y - 10} fontSize="9" fill="#1A56A0" textAnchor="middle" fontWeight="bold">
                {p.carga_kg}
              </text>
            </g>
          ))}

          {/* Eixo X */}
          {pts.map((p, i) => (
            <text key={i} x={p.x} y={H - 4} fontSize="8" fill="#9CA3AF" textAnchor="middle">
              {p.semana.slice(0,5)}
            </text>
          ))}
        </svg>

        {/* Legenda platô */}
        {temPlato && (
          <div className="flex items-center gap-1.5 mt-1 px-1 pb-1">
            <div className="w-3 h-3 rounded-full border-2 flex items-center justify-center" style={{borderColor:"#F59E0B"}}>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
            </div>
            <span className="text-[10px] text-muted">Platô detectado nesta semana</span>
          </div>
        )}
      </div>

      {/* Histórico de sessões */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-text">Histórico de sessões</p>
        </div>
        {dados.map((d, i) => (
          <div key={i} className="flex items-center px-4 py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-muted w-14">{d.semana}</span>
            <span className="text-sm font-bold text-text flex-1">{d.carga_kg} kg</span>
            <span className="text-xs text-muted">{d.reps} reps</span>
            {d.plato && <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{background:"#FEF3C7",color:"#92400E"}}>Platô</span>}
            {i > 0 && !d.plato && d.carga_kg > dados[i-1].carga_kg && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{background:"#D1FAE5",color:"#065F46"}}>+{(d.carga_kg-dados[i-1].carga_kg).toFixed(1)}kg</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab Volume ──────────────────────────────────────────────────────────── */
function TabVolume() {
  const maxSeries = Math.max(...VOLUME_MOCK.map(v => v.series_totais));
  const W = 320; const H = 160;
  const barW = 28; const gap = (W - VOLUME_MOCK.length * barW) / (VOLUME_MOCK.length + 1);
  const padB = 30; const padT = 10; const chartH = H - padT - padB;

  const totalSeries = VOLUME_MOCK.reduce((s, v) => s + v.series_totais, 0);
  const totalVol = VOLUME_MOCK.reduce((s, v) => s + v.volume_kg, 0);
  const mediaVol = Math.round(totalVol / VOLUME_MOCK.length);

  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total séries" value={String(totalSeries)} />
        <StatCard label="Volume total" value={`${(totalVol/1000).toFixed(1)}t`} color="#1A56A0" />
        <StatCard label="Média/semana" value={`${(mediaVol/1000).toFixed(1)}t`} />
      </div>

      <div className="bg-white rounded-xl border border-border px-3 pt-4 pb-2">
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 px-1">Séries por semana</p>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          {/* Grade */}
          {[0, 0.5, 1].map((pct, i) => (
            <g key={i}>
              <line x1={0} y1={padT + pct * chartH} x2={W} y2={padT + pct * chartH} stroke="#F3F4F6" strokeWidth="1"/>
              <text x={4} y={padT + pct * chartH - 3} fontSize="8" fill="#9CA3AF">
                {Math.round(maxSeries * (1 - pct))}
              </text>
            </g>
          ))}

          {VOLUME_MOCK.map((v, i) => {
            const x = gap + i * (barW + gap);
            const barH = (v.series_totais / maxSeries) * chartH;
            const y = padT + chartH - barH;
            const isMax = v.series_totais === maxSeries;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} rx="4"
                  fill={isMax ? "#1D9E75" : "#1A56A0"} opacity={isMax ? 1 : 0.7}/>
                <text x={x + barW/2} y={y - 4} fontSize="9" fill={isMax ? "#1D9E75" : "#1A56A0"}
                  textAnchor="middle" fontWeight="bold">{v.series_totais}</text>
                <text x={x + barW/2} y={H - 4} fontSize="8" fill="#9CA3AF" textAnchor="middle">{v.semana}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Volume em tonelagem */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-text">Volume semanal (tonelagem)</p>
        </div>
        {VOLUME_MOCK.map((v, i) => {
          const pct = (v.volume_kg / Math.max(...VOLUME_MOCK.map(x => x.volume_kg))) * 100;
          return (
            <div key={i} className="px-4 py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">{v.semana}</span>
                <span className="text-xs text-muted">{v.series_totais} séries · {(v.volume_kg/1000).toFixed(2)}t</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:"#1A56A0"}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tab Medidas ─────────────────────────────────────────────────────────── */
function TabMedidas() {
  const [medidas, setMedidas] = useState<Medida[]>(MEDIDAS_MOCK);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK_MEDIDA());
  const [toast, setToast] = useState<string|null>(null);

  function salvar() {
    if (!form.peso_kg) return;
    setMedidas(prev => [{ ...form, id: `m${Date.now()}` }, ...prev]);
    setModal(false);
    setToast("Medida registrada.");
    setTimeout(() => setToast(null), 2500);
  }

  const ultima = medidas[0];
  const anterior = medidas[1];

  function delta(key: keyof Medida): string | null {
    const u = ultima[key] as number | undefined;
    const a = anterior?.[key] as number | undefined;
    if (!u || !a) return null;
    const d = u - a;
    return `${d >= 0 ? "+" : ""}${d.toFixed(1)}`;
  }

  const CAMPOS = [
    { key:"peso_kg",          label:"Peso",         unit:"kg"  },
    { key:"gordura_pct",      label:"% Gordura",    unit:"%"   },
    { key:"peito_cm",         label:"Peito",        unit:"cm"  },
    { key:"cintura_cm",       label:"Cintura",      unit:"cm"  },
    { key:"quadril_cm",       label:"Quadril",      unit:"cm"  },
    { key:"braco_d_cm",       label:"Braço D.",     unit:"cm"  },
    { key:"coxa_d_cm",        label:"Coxa D.",      unit:"cm"  },
    { key:"panturrilha_d_cm", label:"Panturrilha",  unit:"cm"  },
  ] as const;

  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      <button onClick={() => { setForm(BLANK_MEDIDA()); setModal(true); }}
        style={{background:"#1A56A0"}}
        className="w-full text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
        </svg>
        Registrar medidas
      </button>

      {/* Card última medida */}
      {ultima && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-bold text-text">Última medição</p>
            <p className="text-xs text-muted">{new Date(ultima.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
            {CAMPOS.map(c => {
              const val = ultima[c.key as keyof Medida] as number | undefined;
              const d = delta(c.key as keyof Medida);
              if (!val) return null;
              const isPos = d && !d.startsWith("-");
              const isBad = c.key === "gordura_pct" || c.key === "cintura_cm";
              const dColor = !d ? "#9CA3AF" : isPos ? (isBad ? "#D85A30" : "#1D9E75") : (isBad ? "#1D9E75" : "#D85A30");
              return (
                <div key={c.key} className="px-4 py-3">
                  <p className="text-xs text-muted">{c.label}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base font-bold text-text">{val}{c.unit}</span>
                    {d && <span className="text-xs font-medium" style={{color:dColor}}>{d}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-text">Histórico de medições</p>
        </div>
        {medidas.map((m, i) => (
          <div key={m.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold text-text">
                {new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR", { day:"numeric", month:"long", year:"numeric" })}
              </p>
              {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:"#DBEAFE",color:"#1E40AF"}}>Mais recente</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {m.peso_kg && <Pill label="Peso" value={`${m.peso_kg}kg`} />}
              {m.gordura_pct && <Pill label="Gordura" value={`${m.gordura_pct}%`} />}
              {m.peito_cm && <Pill label="Peito" value={`${m.peito_cm}cm`} />}
              {m.cintura_cm && <Pill label="Cintura" value={`${m.cintura_cm}cm`} />}
              {m.braco_d_cm && <Pill label="Braço" value={`${m.braco_d_cm}cm`} />}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{maxWidth:390,margin:"0 auto",left:"50%",transform:"translateX(-50%)"}}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)}/>
          <div className="relative w-full bg-white rounded-t-2xl flex flex-col max-h-[90dvh]">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text">Registrar medidas</h3>
              <button onClick={() => setModal(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-text block mb-1.5">Data</label>
                <input type="date" value={form.data} onChange={e => setForm(p=>({...p,data:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CAMPOS.map(c => (
                  <div key={c.key}>
                    <label className="text-xs font-semibold text-text block mb-1">{c.label} ({c.unit})</label>
                    <input type="number" step="0.1" min={0}
                      value={(form[c.key as keyof typeof form] as number | undefined) ?? ""}
                      onChange={e => setForm(p => ({...p,[c.key]:parseFloat(e.target.value)||undefined}))}
                      placeholder="—"
                      className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/>
                  </div>
                ))}
              </div>
              <button onClick={salvar} disabled={!form.peso_kg}
                style={{background:"#1A56A0"}}
                className="w-full text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40">
                Salvar medidas
              </button>
              <div className="pb-2"/>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{background:"#1D9E75"}}>✓ {toast}</div>
      )}
    </div>
  );
}

/* ─── Tab Fotos ───────────────────────────────────────────────────────────── */
const FOTOS_MOCK = [
  { id:"f1", data:"2026-03-01", label:"Mar · Início",  peso:"82.0kg", color:"#E8F4FD" },
  { id:"f2", data:"2026-04-01", label:"Abr · 4 sem",   peso:"82.8kg", color:"#E8F4F4" },
  { id:"f3", data:"2026-05-01", label:"Mai · 8 sem",   peso:"83.4kg", color:"#F4EBF8" },
  { id:"f4", data:"2026-06-01", label:"Jun · 12 sem",  peso:"84.1kg", color:"#EBF8EF" },
];

function TabFotos() {
  const [modalAdd, setModalAdd] = useState(false);

  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      <button onClick={() => setModalAdd(true)}
        style={{background:"#1A56A0"}}
        className="w-full text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Adicionar foto
      </button>

      {/* Comparação frente/costas */}
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Comparação temporal</p>
        <div className="grid grid-cols-2 gap-3">
          {[FOTOS_MOCK[0], FOTOS_MOCK[FOTOS_MOCK.length-1]].map(f => (
            <div key={f.id} className="flex flex-col gap-1.5">
              <div className="aspect-[3/4] rounded-xl flex flex-col items-center justify-center gap-2"
                style={{background:f.color}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <p className="text-xs text-muted text-center px-2">Foto não disponível</p>
              </div>
              <p className="text-xs font-bold text-text text-center">{f.label}</p>
              <p className="text-xs text-muted text-center">{f.peso}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-text">Timeline de progresso</p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {FOTOS_MOCK.map(f => (
            <div key={f.id} className="flex flex-col gap-1.5">
              <div className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5"
                style={{background:f.color}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <p className="text-xs font-bold text-text">{f.label}</p>
              <p className="text-[10px] text-muted">{f.peso}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dica */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex gap-3">
        <span className="text-blue-400 mt-0.5 flex-shrink-0">💡</span>
        <p className="text-xs text-blue-600 leading-relaxed">
          Tire fotos sempre no mesmo horário, iluminação e posição para comparações precisas.
          Recomendamos: manhã em jejum, mesma roupa, mesmo local.
        </p>
      </div>

      {/* Modal adicionar */}
      {modalAdd && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{maxWidth:390,margin:"0 auto",left:"50%",transform:"translateX(-50%)"}}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalAdd(false)}/>
          <div className="relative w-full bg-white rounded-t-2xl p-5 flex flex-col gap-4">
            <div className="flex justify-center pt-1 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
            <h3 className="text-base font-bold text-text">Adicionar foto de progresso</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-3 bg-gray-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <p className="text-sm text-muted text-center">Toque para selecionar<br/>uma foto da galeria</p>
              <button className="px-4 py-2 rounded-xl border border-border bg-white text-sm font-medium text-text">
                Selecionar foto
              </button>
            </div>
            <p className="text-xs text-muted text-center">Upload de fotos disponível quando conectado ao Supabase</p>
            <button onClick={() => setModalAdd(false)}
              className="w-full py-3 rounded-xl border border-border text-sm font-bold text-muted">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-border px-3 py-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-base font-bold mt-0.5" style={{color: color ?? "#1A1A1A"}}>{value}</p>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-muted">
      <span className="font-medium text-text">{value}</span> {label}
    </span>
  );
}
