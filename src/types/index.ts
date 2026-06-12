export type Objetivo = "bulk" | "recomp" | "cut";
export type NivelAtividade = "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo";
export type SexoBiologico = "M" | "F";

export interface UserProfile {
  id?: string;
  nome: string;
  email: string;
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo_biologico: SexoBiologico;
  percentual_gordura?: number;
  objetivo: Objetivo;
  nivel_atividade: NivelAtividade;
  tmb?: number;
  tdee?: number;
  meta_calorica?: number;
  proteina_g?: number;
  gordura_g?: number;
  carboidrato_g?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}
