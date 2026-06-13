"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNav, ScreenHeader, Card, PrimaryButton } from "@/components/ui";

/* ─── Planos por divisão ──────────────────────────────────────────────────── */
type DivisaoTreino = "fullbody" | "upper_lower" | "push_pull_legs" | "bro_split";

const PLANOS: Record<DivisaoTreino, { day: string; jsDay: number; name: string; desc: string; isRest: boolean }[]> = {
  fullbody: [
    { day: "Seg", jsDay: 1, name: "Full Body A", desc: "Corpo inteiro",  isRest: false },
    { day: "Ter", jsDay: 2, name: "Descanso",    desc: "",               isRest: true  },
    { day: "Qua", jsDay: 3, name: "Full Body B", desc: "Corpo inteiro",  isRest: false },
    { day: "Qui", jsDay: 4, name: "Descanso",    desc: "",               isRest: true  },
    { day: "Sex", jsDay: 5, name: "Full Body C", desc: "Corpo inteiro",  isRest: false },
    { day: "Sáb", jsDay: 6, name: "Descanso",    desc: "",               isRest: true  },
    { day: "Dom", jsDay: 0, name: "Descanso",    desc: "",               isRest: true  },
  ],
  upper_lower: [
    { day: "Seg", jsDay: 1, name: "Upper A",  desc: "Peito + Costas + Ombros", isRest: false },
    { day: "Ter", jsDay: 2, name: "Lower A",  desc: "Quadríceps + Posterior",  isRest: false },
    { day: "Qua", jsDay: 3, name: "Descanso", desc: "",                         isRest: true  },
    { day: "Qui", jsDay: 4, name: "Upper B",  desc: "Peito + Costas + Braços", isRest: false },
    { day: "Sex", jsDay: 5, name: "Lower B",  desc: "Posterior + Glúteos",     isRest: false },
    { day: "Sáb", jsDay: 6, name: "Descanso", desc: "",                         isRest: true  },
    { day: "Dom", jsDay: 0, name: "Descanso", desc: "",                         isRest: true  },
  ],
  push_pull_legs: [
    { day: "Seg", jsDay: 1, name: "Push A",    desc: "Peito + Ombros + Tríceps", isRest: false },
    { day: "Ter", jsDay: 2, name: "Pull A",    desc: "Costas + Bíceps",           isRest: false },
    { day: "Qua", jsDay: 3, name: "Legs A",   desc: "Quadríceps + Posterior",    isRest: false },
    { day: "Qui", jsDay: 4, name: "Descanso",  desc: "",                           isRest: true  },
    { day: "Sex", jsDay: 5, name: "Push B",    desc: "Peito + Ombros + Tríceps", isRest: false },
    { day: "Sáb", jsDay: 6, name: "Pull B",    desc: "Costas + Bíceps",           isRest: false },
    { day: "Dom", jsDay: 0, name: "Descanso",  desc: "",                           isRest: true  },
  ],
  bro_split: [
    { day: "Seg", jsDay: 1, name: "Peito",    desc: "Peito + Tríceps",  isRest: false },
    { day: "Ter", jsDay: 2, name: "Costas",   desc: "Costas + Bíceps",  isRest: false },
    { day: "Qua", jsDay: 3, name: "Ombros",   desc: "Deltoides + Trapézio", isRest: false },
    { day: "Qui", jsDay: 4, name: "Pernas",   desc: "Quadríceps + Posterior + Panturrilha", isRest: false },
    { day: "Sex", jsDay: 5, name: "Braços",   desc: "Bíceps + Tríceps + Antebraço", isRest: false },
    { day: "Sáb", jsDay: 6, name: "Descanso", desc: "",                  isRest: true  },
    { day: "Dom", jsDay: 0, name: "Descanso", desc: "",                  isRest: true  },
  ],
};

const DIVISAO_LABELS: Record<DivisaoTreino, string> = {
  fullbody:       "Full Body",
  upper_lower:    "Upper / Lower",
  push_pull_legs: "Push / Pull / Legs",
  bro_split:      "Bro Split",
};

export default function TreinoPage() {
  const [divisao, setDivisao] = useState<DivisaoTreino | null>(null);
  const [sessoesFeitas, setSessoesFeitas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const todayJs = new Date().getDay();

  useEffect(() => {
    async function load() {
      // 1. Divisão do perfil
      const cache = JSON.parse(localStorage.getItem("personutri_anamnese") || "{}");
      let div: DivisaoTreino | null = cache.divisao_preferida ?? null;

      if (!div) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("users").select("divisao_preferida").eq("id", user.id).single();
          div = (data?.divisao_preferida as DivisaoTreino) ?? "upper_lower";
        }
      }
      setDivisao(div ?? "upper_lower");

      // 2. Sessões concluídas esta semana (localStorage)
      const raw = localStorage.getItem("personutri_sessoes");
      if (raw) {
        const arr: { jsDay: number }[] = JSON.parse(raw);
        setSessoesFeitas(new Set(arr.map(s => s.jsDay)));
      }
      setLoading(false);
    }
    load();
  }, []);

  const plano = divisao ? PLANOS[divisao] : [];

  if (loading) {
    return (
      <div className="min-h-dvh pb-20 flex items-center justify-center" style={{ background: "#F7F7F7" }}>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1A56A0", animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      <ScreenHeader
        title="Meu Plano"
        subtitle={divisao ? `${DIVISAO_LABELS[divisao]} · Semana atual` : ""}
      />

      <div className="px-5 flex flex-col gap-2.5 pb-6 mt-1">
        {plano.map((d) => {
          const isToday  = d.jsDay === todayJs;
          const isDone   = sessoesFeitas.has(d.jsDay);
          const status   = d.isRest ? "rest" : isDone ? "done" : "pending";
          const bgCard   = isDone ? "rgba(29,158,117,0.04)" : "transparent";
          const dayBg    = isDone ? "rgba(29,158,117,0.1)" : d.isRest ? "#F0F0F0" : isToday ? "rgba(26,86,160,0.12)" : "rgba(26,86,160,0.06)";
          const dayColor = isDone ? "#1D9E75" : d.isRest ? "#999" : "#1A56A0";

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
                {status === "done"    && <span className="text-[11px] font-medium" style={{ color: "#1D9E75" }}>✓ Concluída</span>}
                {status === "rest"    && <span className="text-[11px] font-medium" style={{ color: "#999" }}>Descanso 💤</span>}
                {status === "pending" && !isToday && <span className="text-[11px] font-medium" style={{ color: "#999" }}>Pendente</span>}
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
