"use client";

import { useEffect, useState } from "react";
import { BottomNav, ScreenHeader, Card, PrimaryButton } from "@/components/ui";

const PLANO = [
  { day: "Seg", jsDay: 1, name: "Push A",   desc: "Peito + Tríceps",     isRest: false },
  { day: "Ter", jsDay: 2, name: "Pull A",   desc: "Costas + Bíceps",     isRest: false },
  { day: "Qua", jsDay: 3, name: "Lower A",  desc: "Quadríceps",          isRest: false },
  { day: "Qui", jsDay: 4, name: "Descanso", desc: "",                    isRest: true  },
  { day: "Sex", jsDay: 5, name: "Pull B",   desc: "Costas + Bíceps",     isRest: false },
  { day: "Sáb", jsDay: 6, name: "Lower B",  desc: "Posterior + Glúteos", isRest: false },
  { day: "Dom", jsDay: 0, name: "Descanso", desc: "",                    isRest: true  },
];

export default function TreinoPage() {
  const [sessoesFeitas, setSessoesFeitas] = useState<Set<string>>(new Set());
  const todayJs = new Date().getDay(); // 0=Dom … 6=Sáb

  useEffect(() => {
    // Carrega sessões concluídas do localStorage (chave: "personutri_sessoes")
    const raw = localStorage.getItem("personutri_sessoes");
    if (raw) {
      const arr: { jsDay: number }[] = JSON.parse(raw);
      const semana = new Date();
      semana.setDate(semana.getDate() - semana.getDay()); // início da semana (Dom)
      // Simplificado: usa o jsDay salvo na sessão para marcar como feito
      const feitos = new Set(arr.map(s => String(s.jsDay)));
      setSessoesFeitas(feitos);
    }
  }, []);

  return (
    <div className="min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      <ScreenHeader title="Meu Plano" subtitle="Upper/Lower · Semana atual" />

      <div className="px-5 flex flex-col gap-2.5 pb-6 mt-1">
        {PLANO.map((d) => {
          const isToday   = d.jsDay === todayJs;
          const isDone    = sessoesFeitas.has(String(d.jsDay));
          const status    = d.isRest ? "rest" : isDone ? "done" : "pending";

          const bgCard    = isDone ? "rgba(29,158,117,0.04)" : "transparent";
          const dayBg     = isDone ? "rgba(29,158,117,0.1)" : d.isRest ? "#F0F0F0" : isToday ? "rgba(26,86,160,0.12)" : "rgba(26,86,160,0.06)";
          const dayColor  = isDone ? "#1D9E75" : d.isRest ? "#999" : isToday ? "#1A56A0" : "#1A56A0";

          return (
            <Card key={d.jsDay} className="flex items-center gap-3 !py-3" style={{ background: bgCard, position: "relative" }}>
              {isToday && !d.isRest && !isDone && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: "#1A56A0" }} />
              )}
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: dayBg, color: dayColor }}>
                {d.day}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{d.name}</p>
                  {isToday && !d.isRest && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#1A56A0", color: "#fff" }}>HOJE</span>
                  )}
                </div>
                {d.desc && <p className="text-xs mt-0.5" style={{ color: "#666" }}>{d.desc}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {status === "done" && (
                  <span className="text-[11px] font-medium" style={{ color: "#1D9E75" }}>✓ Concluída</span>
                )}
                {status === "rest" && (
                  <span className="text-[11px] font-medium" style={{ color: "#999" }}>Descanso 💤</span>
                )}
                {status === "pending" && !isToday && (
                  <span className="text-[11px] font-medium" style={{ color: "#999" }}>Pendente</span>
                )}
                {status === "pending" && isToday && (
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
