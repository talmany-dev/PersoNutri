"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNav, ScreenHeader, Card, AlertCard } from "@/components/ui";

interface PontoGrafico { date: string; value: number; alert?: boolean }

const TABS = ["Evolução de Cargas", "Volume Semanal", "Medidas", "Fotos"];

export default function ProgressoPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [chartData, setChartData] = useState<PontoGrafico[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPlatô, setHasPlatô] = useState(false);
  const [ultimaProgressao, setUltimaProgressao] = useState<{ delta: number; data: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Busca séries registradas ordenadas por data
      const { data: series } = await supabase
        .from("series_registradas")
        .select("carga_kg,reps,data_sessao,exercicio_id")
        .eq("user_id", user.id)
        .order("data_sessao", { ascending: true })
        .limit(200);

      if (!series?.length) { setLoading(false); return; }

      // Agrupa por semana — pega a carga máxima de cada semana para o exercício mais frequente
      const porExercicio: Record<string, { data: string; carga: number }[]> = {};
      series.forEach(s => {
        if (!porExercicio[s.exercicio_id]) porExercicio[s.exercicio_id] = [];
        porExercicio[s.exercicio_id].push({ data: s.data_sessao, carga: s.carga_kg });
      });

      // Exercício com mais registros
      const exMaisFrequente = Object.entries(porExercicio)
        .sort((a, b) => b[1].length - a[1].length)[0];

      if (!exMaisFrequente) { setLoading(false); return; }

      const pontos = exMaisFrequente[1].slice(-8).map(p => ({
        date: new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        value: p.carga,
      }));

      // Detecta platô: últimas 2+ sessões com mesma carga
      const ultimas = pontos.slice(-3);
      const platô = ultimas.length >= 2 && ultimas.every(p => p.value === ultimas[0].value);
      const pontosComAlerta = pontos.map((p, i) =>
        platô && i >= pontos.length - 3 ? { ...p, alert: true } : p
      );

      // Última progressão
      for (let i = pontos.length - 1; i > 0; i--) {
        if (pontos[i].value !== pontos[i - 1].value) {
          setUltimaProgressao({
            delta: +(pontos[i].value - pontos[i - 1].value).toFixed(1),
            data:  pontos[i].date,
          });
          break;
        }
      }

      setChartData(pontosComAlerta);
      setHasPlatô(platô);
      setLoading(false);
    }
    load();
  }, []);

  const hasData = chartData.length > 0;
  const chartW = 320, chartH = 180;
  const pad = { top: 20, right: 16, bottom: 36, left: 36 };
  const w = chartW - pad.left - pad.right;
  const h = chartH - pad.top - pad.bottom;
  const vals = chartData.map(d => d.value);
  const minV = vals.length ? Math.floor(Math.min(...vals) - 2) : 0;
  const maxV = vals.length ? Math.ceil(Math.max(...vals) + 2)  : 100;
  const xPos = (i: number) => pad.left + (i / Math.max(chartData.length - 1, 1)) * w;
  const yPos = (v: number) => pad.top + (1 - (v - minV) / (maxV - minV)) * h;
  const linePath = chartData.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(d.value)}`).join(" ");
  const areaPath = hasData ? `${linePath} L${xPos(chartData.length - 1)},${pad.top + h} L${xPos(0)},${pad.top + h} Z` : "";

  return (
    <div className="min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      <ScreenHeader title="Progresso" />

      <div className="px-5 flex flex-col gap-3 pb-6 mt-1">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className="whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg border-none cursor-pointer transition-colors"
              style={{ background: i === activeTab ? "#1A56A0" : "#ECECEC", color: i === activeTab ? "#fff" : "#666" }}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === 0 && (
          <>
            {loading ? (
              <Card className="text-center py-10">
                <div className="flex justify-center gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1A56A0", animationDelay: `${i*0.2}s` }} />
                  ))}
                </div>
              </Card>
            ) : !hasData ? (
              <Card className="text-center py-12 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: "rgba(26,86,160,0.08)" }}>📊</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Nenhum treino registrado ainda</p>
                  <p className="text-xs mt-1" style={{ color: "#999" }}>Complete suas primeiras sessões para ver a evolução de cargas.</p>
                </div>
              </Card>
            ) : (
              <>
                {/* Gráfico */}
                <Card className="!p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "#999" }}>
                    Carga (kg) — últimas sessões
                  </p>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" className="block">
                    {[minV, Math.round((minV + maxV) / 2), maxV].map(v => (
                      <g key={v}>
                        <line x1={pad.left} y1={yPos(v)} x2={chartW - pad.right} y2={yPos(v)} stroke="#F0F0F0" strokeWidth="1" />
                        <text x={pad.left - 6} y={yPos(v) + 3} textAnchor="end" fontSize="9" fill="#999">{v}</text>
                      </g>
                    ))}
                    <path d={areaPath} fill="#1A56A0" opacity="0.06" />
                    <path d={linePath} fill="none" stroke="#1A56A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {chartData.map((d, i) => (
                      <g key={i}>
                        <circle cx={xPos(i)} cy={yPos(d.value)} r={d.alert ? 6 : 4}
                          fill={d.alert ? "#D85A30" : "#1A56A0"} />
                        {d.alert && <text x={xPos(i)} y={yPos(d.value) - 10} textAnchor="middle" fontSize="11">⚠️</text>}
                        <text x={xPos(i)} y={chartH - 8} textAnchor="middle" fontSize="8" fill="#999">{d.date}</text>
                      </g>
                    ))}
                  </svg>
                </Card>

                {/* Última progressão */}
                {ultimaProgressao && (
                  <Card className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(29,158,117,0.1)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                        Última progressão: +{ultimaProgressao.delta}kg
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#666" }}>em {ultimaProgressao.data}</p>
                    </div>
                  </Card>
                )}

                {hasPlatô && (
                  <AlertCard
                    title="Platô detectado"
                    description="Carga estagnada nas últimas sessões. Considere deload ou variação de estímulo."
                    action="Ver sugestões"
                    onAction={() => window.location.href = "/ia"}
                  />
                )}
              </>
            )}
          </>
        )}

        {[1, 2, 3].includes(activeTab) && (
          <Card className="text-center py-12">
            <p className="text-sm" style={{ color: "#999" }}>{TABS[activeTab]} disponível em breve</p>
          </Card>
        )}
      </div>

      <BottomNav active="progresso" />
    </div>
  );
}
