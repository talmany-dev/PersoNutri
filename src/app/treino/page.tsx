"use client";

import { BottomNav, ScreenHeader, Card, PrimaryButton } from "@/components/ui";

const days = [
  { day: "Seg", name: "Push A",    desc: "Peito + Tríceps",      status: "done"    },
  { day: "Ter", name: "Pull A",    desc: "Costas + Bíceps",      status: "done"    },
  { day: "Qua", name: "Lower A",   desc: "Quadríceps",           status: "pending" },
  { day: "Qui", name: "Push B",    desc: "Ombros + Tríceps",     status: "rest"    },
  { day: "Sex", name: "Pull B",    desc: "Costas + Bíceps",      status: "pending" },
  { day: "Sáb", name: "Lower B",   desc: "Posterior + Glúteos",  status: "pending" },
  { day: "Dom", name: "Descanso",  desc: "",                      status: "rest"    },
] as const;

const statusCfg = {
  done:    { badge: "✓ Concluída",  color: "#1D9E75", bg: "rgba(29,158,117,0.05)" },
  pending: { badge: "Pendente",     color: "#1A56A0", bg: "transparent"           },
  rest:    { badge: "Descanso 💤",  color: "#666666", bg: "rgba(0,0,0,0.02)"      },
};

export default function TreinoPage() {
  return (
    <div className="min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      <ScreenHeader title="Meu Plano" subtitle="Upper/Lower · Semana 8" />

      <div className="px-5 flex flex-col gap-2.5 pb-6 mt-1">
        {days.map((d, i) => {
          const cfg = statusCfg[d.status];
          const dayBg = d.status === "done" ? "rgba(29,158,117,0.1)" : d.status === "rest" ? "#F0F0F0" : "rgba(26,86,160,0.08)";
          const dayColor = d.status === "done" ? "#1D9E75" : d.status === "rest" ? "#999" : "#1A56A0";
          return (
            <Card key={i} className="flex items-center gap-3 !py-3" style={{ background: cfg.bg }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: dayBg, color: dayColor }}>
                {d.day}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{d.name}</p>
                {d.desc && <p className="text-xs mt-0.5" style={{ color: "#666" }}>{d.desc}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.badge}</span>
                {d.status === "pending" && i === 2 && (
                  <PrimaryButton small onClick={() => window.location.href = "/treino/sessao/atual"}>
                    Iniciar
                  </PrimaryButton>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <BottomNav active="treino" />
    </div>
  );
}
