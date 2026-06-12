export type Objetivo = "bulk" | "recomp" | "cut";
export type NivelAtividade = "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";
export type SexoBiologico = "M" | "F";

const ATIVIDADE_FATORES: Record<NivelAtividade, number> = {
  sedentario:   1.2,
  leve:         1.375,
  moderado:     1.55,
  ativo:        1.725,
  muito_ativo:  1.9,
};

export function calcTMB(params: {
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: SexoBiologico;
  percentual_gordura?: number;
}): number {
  const { peso_kg, altura_cm, idade, sexo, percentual_gordura } = params;

  // Katch-McArdle se % gordura fornecido
  if (percentual_gordura != null && percentual_gordura > 0) {
    const mlg = peso_kg * (1 - percentual_gordura / 100);
    return Math.round(370 + 21.6 * mlg);
  }

  // Mifflin-St Jeor
  const base = 10 * peso_kg + 6.25 * altura_cm - 5 * idade;
  return Math.round(sexo === "M" ? base + 5 : base - 161);
}

export function calcTDEE(tmb: number, nivel: NivelAtividade): number {
  return Math.round(tmb * ATIVIDADE_FATORES[nivel]);
}

export function calcMetaCalorica(tdee: number, objetivo: Objetivo): number {
  if (objetivo === "bulk")   return tdee + 250;
  if (objetivo === "cut")    return tdee - 400;
  return tdee; // recomp
}

export function calcMacros(peso_kg: number, objetivo: Objetivo, meta_calorica: number) {
  const fator_prot: Record<Objetivo, number> = { bulk: 2.8, recomp: 2.5, cut: 2.0 };
  const proteina_g = Math.round(peso_kg * fator_prot[objetivo]);
  const gordura_g  = Math.round(peso_kg * 1.0);
  const carboidrato_g = Math.round((meta_calorica - proteina_g * 4 - gordura_g * 9) / 4);

  return { proteina_g, gordura_g, carboidrato_g };
}
