"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNav, Card, MetricCard, AlertCard, PrimaryButton, OutlineButton, ProgressBar, CircularProgress } from "@/components/ui";

interface DashData {
  nome: string | null;
  meta_calorica: number | null;
  proteina_g: number | null;
  // check-in de hoje
  score_recuperacao: number | null;
  // nutrição de hoje
  cal_consumidas: number;
  prot_consumidas: number;
  // streak (dias consecutivos com check-in)
  streak: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData>({
    nome: null, meta_calorica: null, proteina_g: null,
    score_recuperacao: null, cal_consumidas: 0, prot_consumidas: 0, streak: 0,
  });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const todayCap = (() => {
    const s = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [perfilRes, checkinRes, diarioRes] = await Promise.all([
        supabase.from("users").select("nome,meta_calorica,proteina_g").eq("id", user.id).single(),
        supabase.from("checkins").select("score_recuperacao,data").eq("user_id", user.id).order("data", { ascending: false }).limit(30),
        supabase.from("diario_alimentar").select("calorias,proteina_g").eq("user_id", user.id).eq("data", today).is("deleted_at", null),
      ]);

      const perfil  = perfilRes.data;
      const checkins = checkinRes.data ?? [];
      const diario  = diarioRes.data ?? [];

      // Score de recuperação de hoje
      const checkinHoje = checkins.find(c => c.data === today);

      // Totais nutricionais do dia
      const cal_consumidas  = Math.round(diario.reduce((s, i) => s + (i.calorias ?? 0), 0));
      const prot_consumidas = Math.round(diario.reduce((s, i) => s + (i.proteina_g ?? 0), 0) * 10) / 10;

      // Streak: dias consecutivos com check-in até hoje
      let streak = 0;
      const sorted = [...checkins].sort((a, b) => b.data.localeCompare(a.data));
      const expected = new Date(today);
      for (const c of sorted) {
        const d = expected.toISOString().split("T")[0];
        if (c.data === d) { streak++; expected.setDate(expected.getDate() - 1); }
        else break;
      }

      setData({
        nome:              perfil?.nome?.split(" ")[0] ?? null,
        meta_calorica:     perfil?.meta_calorica ?? null,
        proteina_g:        perfil?.proteina_g ?? null,
        score_recuperacao: checkinHoje?.score_recuperacao ?? null,
        cal_consumidas,
        prot_consumidas,
        streak,
      });
      setLoading(false);
    }
    load();
  }, [today]);

  const scoreColor = !data.score_recuperacao ? "#999"
    : data.score_recuperacao >= 8 ? "#1D9E75"
    : data.score_recuperacao >= 6 ? "#1A56A0"
    : data.score_recuperacao >= 4 ? "#E8A817" : "#D85A30";

  const calRestantes = data.meta_calorica ? Math.max(data.meta_calorica - data.cal_consumidas, 0) : null;
  const protMeta     = data.proteina_g ?? 0;

  return (
    <div className="min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      {/* Greeting */}
      <div className="px-5 pt-6 pb-1">
        <h1 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>
          {saudacao}{data.nome ? `, ${data.nome}` : ""} 👋
        </h1>
        <p className="text-xs mt-1" style={{ color: "#666" }}>{todayCap}</p>
      </div>

      <div className="px-5 flex flex-col gap-3 pb-6 mt-3">
        {/* Treino de hoje */}
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-4" style={{ background: "rgba(26,86,160,0.05)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1A56A0" }}>Treino de hoje</p>
            <h2 className="text-base font-bold mt-1" style={{ color: "#1A1A1A" }}>
              {loading ? "Carregando…" : "Ver meu plano"}
            </h2>
            <PrimaryButton onClick={() => window.location.href = "/treino"} className="w-full mt-3">
              Ir para Treino
            </PrimaryButton>
          </div>
        </Card>

        {/* Métricas 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Recuperação */}
          <MetricCard label="Recuperação">
            {loading ? (
              <div className="h-8 w-16 rounded animate-pulse" style={{ background: "#E5E5E5" }} />
            ) : data.score_recuperacao !== null ? (
              <div className="flex items-center gap-2">
                <div className="relative" style={{ width: 48, height: 48 }}>
                  <CircularProgress value={data.score_recuperacao} max={10} size={48} strokeW={4} color={scoreColor} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: "#1A1A1A" }}>{data.score_recuperacao.toFixed(1)}</span>
                  </div>
                </div>
                <span className="text-xs" style={{ color: "#666" }}>/10</span>
              </div>
            ) : (
              <div>
                <p className="text-xs" style={{ color: "#999" }}>Sem check-in hoje</p>
                <button onClick={() => window.location.href = "/checkin"}
                  className="text-xs font-semibold mt-1" style={{ color: "#1A56A0", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Registrar →
                </button>
              </div>
            )}
          </MetricCard>

          {/* Meta calórica */}
          <MetricCard label="Meta calórica">
            {loading ? (
              <div className="h-8 w-20 rounded animate-pulse" style={{ background: "#E5E5E5" }} />
            ) : calRestantes !== null ? (
              <div>
                <span className="text-xl font-bold" style={{ color: "#1A1A1A" }}>
                  {calRestantes.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs ml-1" style={{ color: "#666" }}>kcal rest.</span>
                <p className="text-[10px] mt-0.5" style={{ color: "#999" }}>
                  {data.cal_consumidas} / {data.meta_calorica} consumidas
                </p>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "#999" }}>Complete o perfil</p>
            )}
          </MetricCard>

          {/* Proteína */}
          <MetricCard label="Proteína">
            {loading ? (
              <div className="h-8 w-full rounded animate-pulse" style={{ background: "#E5E5E5" }} />
            ) : protMeta > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold" style={{ color: "#1A1A1A" }}>{data.prot_consumidas}g</span>
                  <span className="text-[10px]" style={{ color: "#666" }}>/ {protMeta}g</span>
                </div>
                <ProgressBar value={data.prot_consumidas} max={protMeta} color="#1D9E75" />
              </div>
            ) : (
              <p className="text-xs" style={{ color: "#999" }}>Complete o perfil</p>
            )}
          </MetricCard>

          {/* Sequência */}
          <MetricCard label="Sequência">
            {loading ? (
              <div className="h-8 w-12 rounded animate-pulse" style={{ background: "#E5E5E5" }} />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-2xl">{data.streak > 0 ? "🔥" : "💤"}</span>
                <span className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{data.streak}</span>
                <span className="text-xs" style={{ color: "#666" }}>dias</span>
              </div>
            )}
          </MetricCard>
        </div>

        {/* Alerta proteína — só mostra se logou comida mas ainda está abaixo */}
        {!loading && protMeta > 0 && data.prot_consumidas > 0 && data.prot_consumidas < protMeta * 0.6 && (
          <AlertCard
            type="warning"
            title={`Faltam ${Math.round(protMeta - data.prot_consumidas)}g de proteína hoje`}
            description="Adicione frango, atum, ovos ou whey nas próximas refeições."
            action="Registrar refeição"
            onAction={() => window.location.href = "/nutricao/diario"}
          />
        )}

        {/* CTA check-in se não fez hoje */}
        {!loading && data.score_recuperacao === null && (
          <AlertCard
            type="warning"
            title="Faça seu check-in diário"
            description="Registre sono, energia e dor muscular para acompanhar sua recuperação."
            action="Check-in"
            onAction={() => window.location.href = "/checkin"}
          />
        )}

        {/* Atalhos */}
        <div className="flex gap-2">
          <OutlineButton onClick={() => window.location.href = "/checkin"} className="flex-1">Check-in</OutlineButton>
          <OutlineButton onClick={() => window.location.href = "/nutricao/diario"} className="flex-1">Refeição</OutlineButton>
          <OutlineButton onClick={() => window.location.href = "/progresso"} className="flex-1">Progresso</OutlineButton>
        </div>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
