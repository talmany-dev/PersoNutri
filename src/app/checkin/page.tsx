"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ScreenHeader, Card, PrimaryButton, CircularProgress } from "@/components/ui";

const sliders = [
  { id: "horas_sono",     label: "Horas de sono",     min: 3,  max: 12, step: 0.5, format: (v: number) => `${v}h`   },
  { id: "qualidade_sono", label: "Qualidade do sono", min: 1,  max: 10, step: 1,   format: (v: number) => `${v}/10` },
  { id: "energia",        label: "Nível de energia",  min: 1,  max: 10, step: 1,   format: (v: number) => `${v}/10` },
  { id: "dor_muscular",   label: "Dor muscular",      min: 0,  max: 10, step: 1,   format: (v: number) => `${v}/10` },
] as const;

type SliderKey = typeof sliders[number]["id"];

function calcScore(v: Record<SliderKey, number>) {
  return Math.round((v.qualidade_sono * 0.4 + v.energia * 0.3 + (10 - v.dor_muscular) * 0.2 + Math.min(v.horas_sono / 8, 1) * 10 * 0.1) * 10) / 10;
}

export default function CheckinPage() {
  const router = useRouter();
  const [vals, setVals] = useState<Record<SliderKey, number>>({ horas_sono: 7.5, qualidade_sono: 8, energia: 7, dor_muscular: 4 });
  const [peso, setPeso] = useState("");
  const [saved, setSaved] = useState(false);
  const score = useMemo(() => calcScore(vals), [vals]);
  const scoreColor = score >= 8 ? "#1D9E75" : score >= 6 ? "#1A56A0" : score >= 4 ? "#E8A817" : "#D85A30";
  const scoreLabel = score >= 8 ? "Recuperação excelente" : score >= 6 ? "Recuperação boa" : score >= 4 ? "Recuperação regular" : "Recuperação baixa";

  async function handleSave() {
    const hoje = new Date().toISOString().split("T")[0];
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("checkins").upsert({
        user_id: user.id, data: hoje,
        qualidade_sono: vals.qualidade_sono, energia: vals.energia,
        dor_muscular: vals.dor_muscular, horas_sono: vals.horas_sono,
        peso_kg: peso ? parseFloat(peso) : null,
        score_recuperacao: score,
      }, { onConflict: "user_id,data" });
    }
    const existing = JSON.parse(localStorage.getItem("personutri_checkins") || "[]");
    const filtrado = existing.filter((c: { data: string }) => c.data !== hoje);
    localStorage.setItem("personutri_checkins", JSON.stringify([{ ...vals, peso_kg: peso, score_recuperacao: score, data: hoje }, ...filtrado]));
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6" style={{ background: "#F7F7F7" }}>
        <div className="relative" style={{ width: 100, height: 100 }}>
          <CircularProgress value={score} max={10} size={100} strokeW={7} color={scoreColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score.toFixed(1)}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold" style={{ color: scoreColor }}>{scoreLabel}!</p>
          <p className="text-sm mt-1" style={{ color: "#666" }}>Check-in registrado com sucesso</p>
        </div>
        <PrimaryButton onClick={() => router.push("/dashboard")} className="w-full">Voltar ao Dashboard</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-8" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      <ScreenHeader title="Check-in de Hoje" showBack onBack={() => router.push("/dashboard")} />
      <div className="px-5 flex flex-col gap-4 mt-2">
        {sliders.map(s => (
          <Card key={s.id}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{s.label}</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: "#1A56A0" }}>{s.format(vals[s.id])}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={vals[s.id]}
              onChange={e => setVals(p => ({ ...p, [s.id]: parseFloat(e.target.value) }))} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: "#999" }}>{s.min}{s.id === "horas_sono" ? "h" : ""}</span>
              <span className="text-[10px]" style={{ color: "#999" }}>{s.max}{s.id === "horas_sono" ? "h" : ""}</span>
            </div>
          </Card>
        ))}

        <Card>
          <label className="text-sm font-medium block mb-2" style={{ color: "#1A1A1A" }}>
            Peso hoje (kg) <span style={{ color: "#999", fontWeight: 400 }}>— opcional</span>
          </label>
          <input type="number" inputMode="decimal" placeholder="ex: 78.5" value={peso}
            onChange={e => setPeso(e.target.value)}
            className="w-full rounded-lg text-sm py-2.5 px-3 outline-none"
            style={{ border: "0.5px solid #E5E5E5", background: "#F7F7F7", color: "#1A1A1A" }} />
        </Card>

        <Card className="text-center !py-6">
          <p className="text-xs font-medium mb-3" style={{ color: "#666" }}>Score de recuperação</p>
          <div className="flex justify-center mb-3">
            <div className="relative" style={{ width: 80, height: 80 }}>
              <CircularProgress value={score} max={10} size={80} strokeW={6} color={scoreColor} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>{score.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</p>
          <p className="text-xs mt-1" style={{ color: "#666" }}>
            {score >= 6 ? "Você está apto para treinar hoje." : "Considere reduzir o volume de treino."}
          </p>
        </Card>

        <PrimaryButton onClick={handleSave} className="w-full">Registrar Check-in</PrimaryButton>
      </div>
    </div>
  );
}
