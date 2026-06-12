"use client";

import { useState } from "react";
import { BottomNav, ScreenHeader, Card, AlertCard, Badge } from "@/components/ui";

const CHART_DATA = [
  { date: "28/04", value: 70 },
  { date: "05/05", value: 72.5 },
  { date: "12/05", value: 75 },
  { date: "19/05", value: 77.5 },
  { date: "26/05", value: 77.5, alert: true },
  { date: "02/06", value: 77.5, alert: true },
  { date: "09/06", value: 80 },
  { date: "11/06", value: 80 },
];

const TABS = ["Evolução de Cargas", "Volume Semanal", "Medidas", "Fotos"];

export default function ProgressoPage() {
  const [activeTab, setActiveTab] = useState(0);

  const chartW = 320, chartH = 180;
  const pad = { top: 20, right: 16, bottom: 36, left: 36 };
  const w = chartW - pad.left - pad.right;
  const h = chartH - pad.top - pad.bottom;
  const minV = 65, maxV = 85;

  const xPos = (i: number) => pad.left + (i / (CHART_DATA.length - 1)) * w;
  const yPos = (v: number) => pad.top + (1 - (v - minV) / (maxV - minV)) * h;

  const linePath = CHART_DATA.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(d.value)}`).join(" ");
  const areaPath = `${linePath} L${xPos(CHART_DATA.length - 1)},${pad.top + h} L${xPos(0)},${pad.top + h} Z`;

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
            {/* Seletor de exercício */}
            <div className="relative">
              <select className="w-full appearance-none rounded-lg text-sm font-semibold py-2.5 px-3 pr-10 outline-none cursor-pointer"
                style={{ border: "0.5px solid #E5E5E5", background: "#fff", color: "#1A1A1A" }}>
                <option>Supino Reto com Barra</option>
                <option>Supino Inclinado com Halteres</option>
                <option>Agachamento Livre</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {/* Gráfico de linha */}
            <Card className="!p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "#999" }}>
                Carga (kg) — últimas 8 semanas
              </p>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" className="block">
                {[65, 70, 75, 80, 85].map(v => (
                  <g key={v}>
                    <line x1={pad.left} y1={yPos(v)} x2={chartW - pad.right} y2={yPos(v)} stroke="#F0F0F0" strokeWidth="1" />
                    <text x={pad.left - 6} y={yPos(v) + 3} textAnchor="end" fontSize="9" fill="#999">{v}</text>
                  </g>
                ))}
                <path d={areaPath} fill="#1A56A0" opacity="0.06" />
                <path d={linePath} fill="none" stroke="#1A56A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {CHART_DATA.map((d, i) => (
                  <g key={i}>
                    <circle cx={xPos(i)} cy={yPos(d.value)} r={d.alert ? 6 : 4}
                      fill={d.alert ? "#D85A30" : "#1A56A0"} />
                    {d.alert && (
                      <text x={xPos(i)} y={yPos(d.value) - 10} textAnchor="middle" fontSize="11">⚠️</text>
                    )}
                    <text x={xPos(i)} y={chartH - 8} textAnchor="middle" fontSize="8" fill="#999">{d.date}</text>
                  </g>
                ))}
              </svg>
            </Card>

            {/* Última progressão */}
            <Card className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(29,158,117,0.1)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Última progressão: +2,5kg</p>
                <p className="text-xs mt-0.5" style={{ color: "#666" }}>em 15/05/2026</p>
              </div>
            </Card>

            <AlertCard
              title="Platô detectado"
              description="Carga estagnada em 77.5kg por 2 sessões. Considere deload ou variação de estímulo."
              action="Ver sugestões"
              onAction={() => window.location.href = "/ia"}
            />
          </>
        )}

        {activeTab === 1 && (
          <Card className="text-center py-12">
            <p className="text-sm" style={{ color: "#999" }}>Volume semanal disponível em breve</p>
          </Card>
        )}

        {activeTab === 2 && (
          <Card className="text-center py-12">
            <p className="text-sm" style={{ color: "#999" }}>Registro de medidas disponível em breve</p>
          </Card>
        )}

        {activeTab === 3 && (
          <Card className="text-center py-12">
            <p className="text-sm" style={{ color: "#999" }}>Galeria de fotos disponível em breve</p>
          </Card>
        )}
      </div>

      <BottomNav active="progresso" />
    </div>
  );
}
