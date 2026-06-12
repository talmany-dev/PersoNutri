"use client";

import { BottomNav, Card, MetricCard, AlertCard, PrimaryButton, OutlineButton, ProgressBar, CircularProgress } from "@/components/ui";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      {/* Greeting */}
      <div className="px-5 pt-6 pb-1">
        <h1 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Bom dia, Rafael 👋</h1>
        <p className="text-xs mt-1" style={{ color: "#666" }}>{todayCap}</p>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-6 mt-3">
        {/* Treino de hoje */}
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-4" style={{ background: "rgba(26,86,160,0.05)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1A56A0" }}>Treino de hoje</p>
            <h2 className="text-base font-bold mt-1" style={{ color: "#1A1A1A" }}>Push A · Peito + Tríceps</h2>
            <p className="text-xs mt-1" style={{ color: "#666" }}>6 exercícios · ~55 min estimado</p>
            <PrimaryButton onClick={() => window.location.href = "/treino"} className="w-full mt-3">
              Iniciar Sessão
            </PrimaryButton>
          </div>
        </Card>

        {/* Métricas 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Recuperação">
            <div className="flex items-center gap-2">
              <div className="relative" style={{ width: 48, height: 48 }}>
                <CircularProgress value={7.4} max={10} size={48} strokeW={4} color="#1D9E75" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color: "#1A1A1A" }}>7.4</span>
                </div>
              </div>
              <span className="text-xs" style={{ color: "#666" }}>/10</span>
            </div>
          </MetricCard>

          <MetricCard label="Meta calórica" value="2.840" sub="kcal restantes" />

          <MetricCard label="Proteína">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold" style={{ color: "#1A1A1A" }}>89g</span>
                <span className="text-[10px]" style={{ color: "#666" }}>/ 176g</span>
              </div>
              <ProgressBar value={89} max={176} color="#1D9E75" />
            </div>
          </MetricCard>

          <MetricCard label="Sequência">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">🔥</span>
              <span className="text-xl font-bold" style={{ color: "#1A1A1A" }}>12</span>
              <span className="text-xs" style={{ color: "#666" }}>dias</span>
            </div>
          </MetricCard>
        </div>

        {/* Alerta platô */}
        <AlertCard
          title="Platô detectado em Supino Reto"
          description="Sem progressão de carga há 3 sessões."
          action="Ver detalhes"
          onAction={() => window.location.href = "/progresso"}
        />

        {/* Atalhos */}
        <div className="flex gap-2">
          <OutlineButton onClick={() => window.location.href = "/checkin"} className="flex-1">Check-in</OutlineButton>
          <OutlineButton onClick={() => window.location.href = "/nutricao/diario"} className="flex-1">Registrar refeição</OutlineButton>
          <OutlineButton onClick={() => window.location.href = "/progresso"} className="flex-1">Ver progresso</OutlineButton>
        </div>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
