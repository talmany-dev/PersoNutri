// Algoritmo de Progressão Dupla
// Regra: sobe reps dentro da faixa → ao atingir reps_max com RIR ≤ alvo → sobe carga

export interface SerieRegistrada {
  carga_kg: number;
  reps: number;
  rir: number;
}

export type SugestaoProgressao =
  | "aumentar_reps"
  | "aumentar_carga"
  | "manter"
  | "reduzir_carga"
  | "deload";

export interface ResultadoProgressao {
  sugestao: SugestaoProgressao;
  delta_carga: number;  // positivo = aumentar, negativo = reduzir
  mensagem: string;
  detalhe: string;
}

export function calcularProgressao(
  series: SerieRegistrada[],
  reps_min: number,
  reps_max: number,
  rir_alvo: number,
  carga_atual: number,
  incremento_kg = 2.5
): ResultadoProgressao {
  if (series.length === 0) return { sugestao: "manter", delta_carga: 0, mensagem: "Nenhuma série registrada", detalhe: "" };

  const media_reps = series.reduce((s, r) => s + r.reps, 0) / series.length;
  const media_rir  = series.reduce((s, r) => s + r.rir, 0)  / series.length;
  const todas_acima_max = series.every(s => s.reps >= reps_max);
  const rir_baixo       = media_rir <= rir_alvo;
  const rir_muito_alto  = media_rir > rir_alvo + 2;

  // Progressão dupla: chegou no teto de reps com esforço adequado → aumenta carga
  if (todas_acima_max && rir_baixo) {
    return {
      sugestao: "aumentar_carga",
      delta_carga: incremento_kg,
      mensagem: `Parabéns! Aumente +${incremento_kg} kg na próxima sessão`,
      detalhe: `Você completou ${reps_max}+ reps com RIR ${media_rir.toFixed(1)} — progressão de carga indicada.`,
    };
  }

  // Dentro da faixa com esforço adequado → sobe reps
  if (media_reps < reps_max && rir_baixo) {
    return {
      sugestao: "aumentar_reps",
      delta_carga: 0,
      mensagem: `Continue: tente mais ${Math.ceil(reps_max - media_reps)} rep(s) próxima sessão`,
      detalhe: `Meta: ${reps_max} reps com RIR ${rir_alvo}. Atual: ${media_reps.toFixed(0)} reps / RIR ${media_rir.toFixed(1)}.`,
    };
  }

  // RIR muito alto (muito fácil) → pode subir carga mesmo sem atingir reps_max
  if (rir_muito_alto && media_reps >= reps_min) {
    return {
      sugestao: "aumentar_carga",
      delta_carga: incremento_kg,
      mensagem: `RIR alto — tente +${incremento_kg} kg para aumentar o estímulo`,
      detalhe: `RIR médio ${media_rir.toFixed(1)} está acima do alvo (${rir_alvo}). Exercício abaixo do esforço ideal.`,
    };
  }

  // Não atingiu reps_min → reduzir carga
  if (media_reps < reps_min) {
    return {
      sugestao: "reduzir_carga",
      delta_carga: -incremento_kg,
      mensagem: `Reduza ${incremento_kg} kg — carga acima do ideal`,
      detalhe: `Média de ${media_reps.toFixed(0)} reps abaixo do mínimo (${reps_min}). Reduza para manter a faixa de hipertrofia.`,
    };
  }

  return {
    sugestao: "manter",
    delta_carga: 0,
    mensagem: "Carga ideal — mantenha na próxima sessão",
    detalhe: `${media_reps.toFixed(0)} reps / RIR ${media_rir.toFixed(1)} dentro dos parâmetros prescritos.`,
  };
}
