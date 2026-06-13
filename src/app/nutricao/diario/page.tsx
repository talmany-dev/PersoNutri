"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/ui";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface ItemDiario {
  id: string;
  nome: string;
  quantidade_g: number;
  calorias: number;
  proteina_g: number;
  carboidrato_g: number;
  gordura_g: number;
}

interface RefeicaoConfig {
  id: string;       // slug único, ex: "cafe_manha" ou "custom_1718000000"
  label: string;
  icon: string;
  horario: string;
  removivel: boolean;
}

interface AlimentoBanco {
  id: string;
  nome: string;
  categoria: string;
  calorias_100g: number;
  proteina_100g: number;
  carboidrato_100g: number;
  gordura_100g: number;
  porcao_padrao_g: number;
}

/* ─── Defaults ────────────────────────────────────────────────────────────── */
const REFEICOES_DEFAULT: RefeicaoConfig[] = [
  { id: "cafe_manha",   label: "Café da manhã", icon: "☀️",  horario: "6h–9h",   removivel: true },
  { id: "lanche_manha", label: "Lanche manhã",  icon: "🍎",  horario: "10h–11h", removivel: true },
  { id: "almoco",       label: "Almoço",        icon: "🍽️",  horario: "12h–14h", removivel: false },
  { id: "lanche_tarde", label: "Lanche tarde",  icon: "🥤",  horario: "15h–17h", removivel: true },
  { id: "jantar",       label: "Jantar",        icon: "🌙",  horario: "19h–21h", removivel: false },
];

const METAS_DEFAULT = { calorias: 2000, proteina_g: 150, carboidrato_g: 200, gordura_g: 67 };

const STORAGE_KEY = "personutri_refeicoes";

const ICONES_OPCOES = ["☀️","🍎","🍽️","🥤","🌙","🥗","🥚","🧃","🍌","🥛","🧁","🫖","🍵","🥜","🫙"];

const CAT_ICONS: Record<string, string> = {
  proteinas: "🥩", suplementos: "🧪", graos: "🌾", tuberculos: "🥔",
  laticinios: "🥛", leguminosas: "🫘", frutas: "🍎", vegetais: "🥦",
  oleaginosas: "🥜", gorduras: "🫒",
};

const BANCO_ALIMENTOS: AlimentoBanco[] = [
  { id: "a1",  nome: "Frango grelhado (peito)",      categoria: "proteinas",   calorias_100g: 159, proteina_100g: 32.8, carboidrato_100g: 0.0,  gordura_100g: 3.2,  porcao_padrao_g: 100 },
  { id: "a2",  nome: "Whey protein (pó)",            categoria: "suplementos", calorias_100g: 400, proteina_100g: 80.0, carboidrato_100g: 8.0,  gordura_100g: 5.0,  porcao_padrao_g: 30  },
  { id: "a3",  nome: "Ovos inteiros",                categoria: "proteinas",   calorias_100g: 143, proteina_100g: 13.0, carboidrato_100g: 0.6,  gordura_100g: 9.5,  porcao_padrao_g: 50  },
  { id: "a4",  nome: "Aveia em flocos",              categoria: "graos",       calorias_100g: 394, proteina_100g: 13.9, carboidrato_100g: 66.6, gordura_100g: 8.5,  porcao_padrao_g: 40  },
  { id: "a5",  nome: "Arroz integral cozido",        categoria: "graos",       calorias_100g: 124, proteina_100g: 2.6,  carboidrato_100g: 25.8, gordura_100g: 1.0,  porcao_padrao_g: 150 },
  { id: "a6",  nome: "Batata-doce cozida",           categoria: "tuberculos",  calorias_100g: 86,  proteina_100g: 1.4,  carboidrato_100g: 20.4, gordura_100g: 0.1,  porcao_padrao_g: 150 },
  { id: "a7",  nome: "Iogurte grego integral",       categoria: "laticinios",  calorias_100g: 97,  proteina_100g: 9.1,  carboidrato_100g: 3.6,  gordura_100g: 5.0,  porcao_padrao_g: 170 },
  { id: "a8",  nome: "Feijão carioca cozido",        categoria: "leguminosas", calorias_100g: 76,  proteina_100g: 4.8,  carboidrato_100g: 13.6, gordura_100g: 0.5,  porcao_padrao_g: 100 },
  { id: "a9",  nome: "Salmão grelhado",              categoria: "proteinas",   calorias_100g: 208, proteina_100g: 28.2, carboidrato_100g: 0.0,  gordura_100g: 10.0, porcao_padrao_g: 100 },
  { id: "a10", nome: "Banana prata",                 categoria: "frutas",      calorias_100g: 98,  proteina_100g: 1.3,  carboidrato_100g: 26.0, gordura_100g: 0.1,  porcao_padrao_g: 100 },
  { id: "a11", nome: "Amendoim torrado",             categoria: "oleaginosas", calorias_100g: 567, proteina_100g: 25.8, carboidrato_100g: 16.1, gordura_100g: 49.2, porcao_padrao_g: 30  },
  { id: "a12", nome: "Queijo cottage",               categoria: "laticinios",  calorias_100g: 98,  proteina_100g: 11.1, carboidrato_100g: 3.4,  gordura_100g: 4.3,  porcao_padrao_g: 100 },
  { id: "a13", nome: "Brócolis cozido",              categoria: "vegetais",    calorias_100g: 25,  proteina_100g: 2.4,  carboidrato_100g: 3.6,  gordura_100g: 0.2,  porcao_padrao_g: 100 },
  { id: "a14", nome: "Atum em conserva (escorrido)", categoria: "proteinas",   calorias_100g: 132, proteina_100g: 28.9, carboidrato_100g: 0.0,  gordura_100g: 1.7,  porcao_padrao_g: 100 },
  { id: "a15", nome: "Caseína proteica (pó)",        categoria: "suplementos", calorias_100g: 370, proteina_100g: 75.0, carboidrato_100g: 10.0, gordura_100g: 3.0,  porcao_padrao_g: 30  },
  { id: "a16", nome: "Arroz branco cozido",          categoria: "graos",       calorias_100g: 128, proteina_100g: 2.5,  carboidrato_100g: 28.1, gordura_100g: 0.3,  porcao_padrao_g: 150 },
  { id: "a17", nome: "Abacate",                      categoria: "frutas",      calorias_100g: 160, proteina_100g: 2.0,  carboidrato_100g: 6.0,  gordura_100g: 14.7, porcao_padrao_g: 100 },
];

/* ─── Utils ───────────────────────────────────────────────────────────────── */
function loadRefeicoes(): RefeicaoConfig[] {
  if (typeof window === "undefined") return REFEICOES_DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RefeicaoConfig[];
  } catch {}
  return REFEICOES_DEFAULT;
}

function saveRefeicoes(refeicoes: RefeicaoConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(refeicoes));
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function DiarioPage() {
  const hoje = new Date().toISOString().split("T")[0];

  const [refeicoes, setRefeicoes]         = useState<RefeicaoConfig[]>(REFEICOES_DEFAULT);
  const [diario, setDiario]               = useState<Record<string, ItemDiario[]>>({});
  const [expanded, setExpanded]           = useState<Set<string>>(new Set(["cafe_manha", "almoco"]));
  const [modal, setModal]                 = useState<string | null>(null);
  const [bancoAlimentos, setBancoAlimentos] = useState<AlimentoBanco[]>(BANCO_ALIMENTOS);
  const [metas, setMetas]                 = useState(METAS_DEFAULT);
  const [userId, setUserId]               = useState<string | null>(null);
  const [showNovaRefeicao, setShowNovaRefeicao] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // Inicializa diário vazio sempre que refeições mudam
  const initDiario = useCallback((refs: RefeicaoConfig[]) => {
    setDiario(prev => {
      const next: Record<string, ItemDiario[]> = {};
      refs.forEach(r => { next[r.id] = prev[r.id] ?? []; });
      return next;
    });
  }, []);

  // Carrega refeições do localStorage na montagem
  useEffect(() => {
    const saved = loadRefeicoes();
    setRefeicoes(saved);
    initDiario(saved);
  }, [initDiario]);

  // Carrega dados do Supabase
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: perfil } = await supabase
        .from("users")
        .select("meta_calorica,proteina_g,carboidrato_g,gordura_g")
        .eq("id", user.id)
        .single();
      if (perfil) {
        setMetas({
          calorias:      perfil.meta_calorica,
          proteina_g:    perfil.proteina_g,
          carboidrato_g: perfil.carboidrato_g,
          gordura_g:     perfil.gordura_g,
        });
      }

      const { data: alimentos } = await supabase
        .from("alimentos")
        .select("id,nome,categoria,calorias_100g,proteina_100g,carboidrato_100g,gordura_100g,porcao_padrao_g")
        .is("deleted_at", null)
        .order("nome");
      if (alimentos?.length) setBancoAlimentos(alimentos as AlimentoBanco[]);

      const { data: entradas } = await supabase
        .from("diario_alimentar")
        .select("id,refeicao,quantidade_g,calorias,proteina_g,carboidrato_g,gordura_g,alimentos(nome)")
        .eq("user_id", user.id)
        .eq("data", hoje)
        .is("deleted_at", null);

      if (entradas?.length) {
        setDiario(prev => {
          const next = { ...prev };
          // Limpa as listas para repopular do banco
          Object.keys(next).forEach(k => { next[k] = []; });
          (entradas as {
            id: string; refeicao: string; quantidade_g: number;
            calorias: number; proteina_g: number; carboidrato_g: number; gordura_g: number;
            alimentos: { nome: string } | { nome: string }[] | null;
          }[]).forEach(e => {
            const alimNome = Array.isArray(e.alimentos)
              ? e.alimentos[0]?.nome ?? "—"
              : e.alimentos?.nome ?? "—";
            if (next[e.refeicao] !== undefined) {
              next[e.refeicao].push({
                id: e.id, nome: alimNome,
                quantidade_g: e.quantidade_g, calorias: e.calorias,
                proteina_g: e.proteina_g, carboidrato_g: e.carboidrato_g, gordura_g: e.gordura_g,
              });
            }
          });
          return next;
        });
      }
    }
    init();
  }, [hoje]);

  const totais = useMemo(() => {
    const flat = Object.values(diario).flat();
    return {
      calorias:      Math.round(flat.reduce((s, i) => s + i.calorias,      0)),
      proteina_g:    Math.round(flat.reduce((s, i) => s + i.proteina_g,    0) * 10) / 10,
      carboidrato_g: Math.round(flat.reduce((s, i) => s + i.carboidrato_g, 0) * 10) / 10,
      gordura_g:     Math.round(flat.reduce((s, i) => s + i.gordura_g,     0) * 10) / 10,
    };
  }, [diario]);

  function toggleRefeicao(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addRefeicao(config: Omit<RefeicaoConfig, "id" | "removivel">) {
    const id = `custom_${Date.now()}`;
    const nova: RefeicaoConfig = { ...config, id, removivel: true };
    const updated = [...refeicoes, nova];
    setRefeicoes(updated);
    saveRefeicoes(updated);
    setDiario(prev => ({ ...prev, [id]: [] }));
    setExpanded(prev => new Set([...prev, id]));
    setShowNovaRefeicao(false);
  }

  function removeRefeicao(id: string) {
    const updated = refeicoes.filter(r => r.id !== id);
    setRefeicoes(updated);
    saveRefeicoes(updated);
    setDiario(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setConfirmRemove(null);
  }

  async function removeItem(refeicaoId: string, itemId: string) {
    setDiario(prev => ({ ...prev, [refeicaoId]: prev[refeicaoId].filter(i => i.id !== itemId) }));
    if (userId) {
      const supabase = createClient();
      await supabase.from("diario_alimentar")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", itemId);
    }
  }

  async function addItem(refeicaoId: string, alimento: AlimentoBanco, quantidade_g: number) {
    const fator = quantidade_g / 100;
    const calorias      = Math.round(alimento.calorias_100g    * fator);
    const proteina_g    = Math.round(alimento.proteina_100g    * fator * 10) / 10;
    const carboidrato_g = Math.round(alimento.carboidrato_100g * fator * 10) / 10;
    const gordura_g     = Math.round(alimento.gordura_100g     * fator * 10) / 10;

    let itemId = `local-${Date.now()}`;

    if (userId) {
      const supabase = createClient();
      const { data } = await supabase.from("diario_alimentar").insert({
        user_id: userId, alimento_id: alimento.id,
        data: hoje, refeicao: refeicaoId,
        quantidade_g, calorias, proteina_g, carboidrato_g, gordura_g,
      }).select("id").single();
      if (data?.id) itemId = data.id;
    }

    const item: ItemDiario = { id: itemId, nome: alimento.nome, quantidade_g, calorias, proteina_g, carboidrato_g, gordura_g };
    setDiario(prev => ({ ...prev, [refeicaoId]: [...(prev[refeicaoId] ?? []), item] }));
    setModal(null);
    setExpanded(prev => new Set([...prev, refeicaoId]));
  }

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  const proteina_deficit = metas.proteina_g - totais.proteina_g;

  return (
    <div className="flex flex-col min-h-dvh pb-20" style={{ background: "#F7F7F7" }}>
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-10 pb-5">
        <div className="flex items-center justify-between mb-1">
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="text-center">
            <p className="text-white font-bold capitalize">{today}</p>
            <p className="text-white/60 text-xs">Hoje</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 px-4 py-4 max-w-[390px] mx-auto w-full">

        {/* Macro cards */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calorias" atual={totais.calorias} meta={metas.calorias} unit="kcal" color="#1A56A0" big />
          <div className="flex flex-col gap-2">
            <MacroMiniCard label="Proteína"     atual={totais.proteina_g}    meta={metas.proteina_g}    unit="g" color="#1A56A0" />
            <MacroMiniCard label="Carboidratos" atual={totais.carboidrato_g} meta={metas.carboidrato_g} unit="g" color="#1D9E75" />
            <MacroMiniCard label="Gorduras"     atual={totais.gordura_g}     meta={metas.gordura_g}     unit="g" color="#D85A30" />
          </div>
        </div>

        {/* Alerta proteína */}
        {proteina_deficit > 10 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border" style={{ background: "#FEF9EC", borderColor: "#F59E0B" }}>
            <span className="text-lg flex-shrink-0">⚠️</span>
            <p className="text-sm" style={{ color: "#92400E" }}>
              Você ainda precisa de <strong>{proteina_deficit.toFixed(0)}g de proteína</strong> hoje.
              Adicione uma refeição com frango, atum ou whey.
            </p>
          </div>
        )}

        {/* Refeições */}
        {refeicoes.map(ref => {
          const itens = diario[ref.id] ?? [];
          const isOpen = expanded.has(ref.id);
          const totalRef = itens.reduce((s, i) => ({ cal: s.cal + i.calorias, prot: s.prot + i.proteina_g }), { cal: 0, prot: 0 });

          return (
            <div key={ref.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: "0.5px solid #E5E5E5" }}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Toggle */}
                <button className="flex items-center gap-3 flex-1 text-left min-w-0" onClick={() => toggleRefeicao(ref.id)}>
                  <span className="text-xl flex-shrink-0">{ref.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "#1A1A1A" }}>{ref.label}</span>
                      <span className="text-xs" style={{ color: "#999" }}>{ref.horario}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                      {itens.length === 0
                        ? "Vazio"
                        : `${itens.length} item${itens.length > 1 ? "s" : ""} · ${Math.round(totalRef.cal)} kcal · ${totalRef.prot.toFixed(0)}g prot`}
                    </p>
                  </div>
                </button>

                {/* Ações da refeição */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {ref.removivel && (
                    <button
                      onClick={() => setConfirmRemove(ref.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: "#FEF2F2" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                  <button onClick={() => toggleRefeicao(ref.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F3F4F6" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"
                      className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: "0.5px solid #F0F0F0" }}>
                  {itens.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "0.5px solid #F9F9F9" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{item.nome}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#999" }}>{item.quantidade_g}g · {Math.round(item.calorias)} kcal</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ color: "#999" }}>
                        <span className="font-medium" style={{ color: "#1A56A0" }}>{item.proteina_g.toFixed(0)}g P</span>
                        <span>{item.carboidrato_g.toFixed(0)}g C</span>
                        <span>{item.gordura_g.toFixed(0)}g G</span>
                      </div>
                      <button onClick={() => removeItem(ref.id, item.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ background: "#F3F4F6" }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#999" strokeWidth="1.5">
                          <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setModal(ref.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors"
                    style={{ color: "#1A56A0" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Adicionar item
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Botão nova refeição */}
        <button
          onClick={() => setShowNovaRefeicao(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all"
          style={{ border: "1.5px dashed #C7D9F5", color: "#1A56A0", background: "rgba(26,86,160,0.03)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Adicionar refeição
        </button>

      </div>

      <BottomNav active="nutricao" />

      {/* Modal busca alimento */}
      {modal && (
        <BuscaAlimentoModal
          refeicao={refeicoes.find(r => r.id === modal)!}
          banco={bancoAlimentos}
          onAdd={(alimento, qtd) => addItem(modal, alimento, qtd)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Modal nova refeição */}
      {showNovaRefeicao && (
        <NovaRefeicaoModal
          onAdd={addRefeicao}
          onClose={() => setShowNovaRefeicao(false)}
        />
      )}

      {/* Confirm remove */}
      {confirmRemove && (
        <ConfirmRemoveModal
          label={refeicoes.find(r => r.id === confirmRemove)?.label ?? ""}
          temItens={(diario[confirmRemove]?.length ?? 0) > 0}
          onConfirm={() => removeRefeicao(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  );
}

/* ─── Macro Cards ─────────────────────────────────────────────────────────── */
function MacroCard({ label, atual, meta, unit, color, big }: {
  label: string; atual: number; meta: number; unit: string; color: string; big?: boolean;
}) {
  const pct = Math.min((atual / meta) * 100, 100);
  const restante = Math.max(meta - atual, 0);
  return (
    <div className="bg-white rounded-2xl px-4 py-4 flex flex-col gap-2" style={{ border: "0.5px solid #E5E5E5" }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#999" }}>{label}</p>
      <div>
        <span className={`font-bold ${big ? "text-3xl" : "text-xl"}`} style={{ color }}>{atual.toLocaleString("pt-BR")}</span>
        <span className="text-xs ml-1" style={{ color: "#999" }}>{unit}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[11px]" style={{ color: "#999" }}>{restante > 0 ? `${restante.toLocaleString("pt-BR")} restantes` : "Meta atingida ✓"}</p>
    </div>
  );
}

function MacroMiniCard({ label, atual, meta, unit, color }: {
  label: string; atual: number; meta: number; unit: string; color: string;
}) {
  const pct = Math.min((atual / meta) * 100, 100);
  return (
    <div className="bg-white rounded-xl px-3 py-2.5" style={{ border: "0.5px solid #E5E5E5" }}>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs" style={{ color: "#999" }}>{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {atual.toFixed(0)}<span className="text-xs font-normal" style={{ color: "#999" }}>/{meta}{unit}</span>
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ─── Modal busca alimento ────────────────────────────────────────────────── */
function BuscaAlimentoModal({ refeicao, banco, onAdd, onClose }: {
  refeicao: RefeicaoConfig;
  banco: AlimentoBanco[];
  onAdd: (alimento: AlimentoBanco, quantidade_g: number) => void;
  onClose: () => void;
}) {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState<AlimentoBanco | null>(null);
  const [quantidade, setQuantidade] = useState<string>("");

  const filtrado = useMemo(() =>
    banco.filter(a => a.nome.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [query, banco]
  );

  const qtdNum = parseFloat(quantidade);
  const preview = selected && !isNaN(qtdNum) && qtdNum > 0
    ? { cal: Math.round(selected.calorias_100g * qtdNum / 100), prot: (selected.proteina_100g * qtdNum / 100).toFixed(1) }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ maxWidth: 390, margin: "0 auto", left: "50%", transform: "translateX(-50%)" }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl flex flex-col max-h-[93dvh]">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-4" style={{ borderBottom: "0.5px solid #E5E5E5" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Adicionar a {refeicao.label}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "#F7F7F7", border: "0.5px solid #E5E5E5" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              autoFocus type="text" placeholder="Buscar alimento…"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              className="flex-1 bg-transparent text-base outline-none"
              style={{ color: "#1A1A1A" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelected(null); }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "#E5E5E5", color: "#666" }}>✕</button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selected && (
            <div className="flex flex-col">
              {filtrado.map((alimento, idx) => (
                <button key={alimento.id}
                  onClick={() => { setSelected(alimento); setQuantidade(String(alimento.porcao_padrao_g)); }}
                  className={`flex items-center gap-4 px-5 py-4 text-left active:bg-gray-50 transition-colors ${idx < filtrado.length - 1 ? "border-b" : ""}`}
                  style={{ borderColor: "#F0F0F0" }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: "#F3F4F6" }}>
                    {CAT_ICONS[alimento.categoria] ?? "🍽️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug" style={{ color: "#1A1A1A" }}>{alimento.nome}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1A56A0" }}>
                        {alimento.calorias_100g} kcal
                      </span>
                      <span className="text-xs" style={{ color: "#999" }}>{alimento.proteina_100g}g P</span>
                      <span className="text-xs" style={{ color: "#999" }}>{alimento.carboidrato_100g}g C</span>
                      <span className="text-xs" style={{ color: "#CCC" }}>por 100g</span>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" className="flex-shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
              {filtrado.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12">
                  <span className="text-3xl">🔍</span>
                  <p className="text-sm" style={{ color: "#999" }}>Nenhum alimento encontrado</p>
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="px-5 py-5 flex flex-col gap-5">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "#EFF6FF", border: "0.5px solid #BFDBFE" }}>
                <span className="text-2xl">{CAT_ICONS[selected.categoria] ?? "🍽️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>{selected.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#666" }}>{selected.calorias_100g} kcal/100g · {selected.proteina_100g}g P</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs font-semibold" style={{ color: "#1A56A0" }}>Trocar</button>
              </div>

              <div>
                <label className="text-sm font-bold block mb-3" style={{ color: "#1A1A1A" }}>Quantidade (g)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantidade(q => String(Math.max(1, parseFloat(q || "0") - 10)))}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors"
                    style={{ background: "#F3F4F6", color: "#1A1A1A" }}>−</button>
                  <input
                    type="number" value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    className="flex-1 text-center px-3 py-3 rounded-2xl text-lg font-bold outline-none transition-all"
                    style={{ border: "1.5px solid #E5E5E5", background: "#F7F7F7", color: "#1A1A1A" }}
                  />
                  <button onClick={() => setQuantidade(q => String(parseFloat(q || "0") + 10))}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors"
                    style={{ background: "#F3F4F6", color: "#1A1A1A" }}>+</button>
                </div>
                <div className="flex gap-2 mt-3">
                  {[30, 50, 100, 150, 200].map(q => (
                    <button key={q} onClick={() => setQuantidade(String(q))}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        border: `1.5px solid ${parseFloat(quantidade) === q ? "#1A56A0" : "#E5E5E5"}`,
                        background: parseFloat(quantidade) === q ? "#EFF6FF" : "#fff",
                        color: parseFloat(quantidade) === q ? "#1A56A0" : "#999",
                      }}>
                      {q}g
                    </button>
                  ))}
                </div>
              </div>

              {preview && (
                <div className="rounded-2xl px-4 py-3.5" style={{ background: "#F7F7F7", border: "0.5px solid #E5E5E5" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#999" }}>Valores para {quantidade}g</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: "Calorias", v: `${preview.cal}`, u: "kcal", c: "#1A56A0" },
                      { l: "Proteína", v: preview.prot,    u: "g",    c: "#1A56A0" },
                      { l: "Carbs",    v: (selected.carboidrato_100g * qtdNum / 100).toFixed(1), u: "g", c: "#1D9E75" },
                      { l: "Gordura",  v: (selected.gordura_100g * qtdNum / 100).toFixed(1),     u: "g", c: "#D85A30" },
                    ].map(x => (
                      <div key={x.l} className="text-center">
                        <p className="text-[11px]" style={{ color: "#999" }}>{x.l}</p>
                        <p className="text-base font-bold mt-0.5" style={{ color: x.c }}>{x.v}</p>
                        <p className="text-[10px]" style={{ color: "#CCC" }}>{x.u}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { if (!isNaN(qtdNum) && qtdNum > 0) onAdd(selected, qtdNum); }}
                disabled={isNaN(qtdNum) || qtdNum <= 0}
                className="w-full text-white font-bold py-4 rounded-2xl text-sm transition-opacity disabled:opacity-40"
                style={{ background: "#1A56A0" }}>
                Adicionar à refeição
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Modal nova refeição ─────────────────────────────────────────────────── */
function NovaRefeicaoModal({ onAdd, onClose }: {
  onAdd: (config: Omit<RefeicaoConfig, "id" | "removivel">) => void;
  onClose: () => void;
}) {
  const [label, setLabel]     = useState("");
  const [horario, setHorario] = useState("");
  const [icon, setIcon]       = useState("🍽️");

  function handleAdd() {
    if (!label.trim()) return;
    onAdd({ label: label.trim(), horario: horario.trim() || "–", icon });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ maxWidth: 390, margin: "0 auto", left: "50%", transform: "translateX(-50%)" }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl px-5 pt-4 pb-8 flex flex-col gap-5">
        <div className="flex justify-center">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Nova refeição</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="1.5">
              <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Ícone */}
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>Ícone</p>
          <div className="flex flex-wrap gap-2">
            {ICONES_OPCOES.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)}
                className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                style={{
                  background: icon === ic ? "#EFF6FF" : "#F3F4F6",
                  border: `1.5px solid ${icon === ic ? "#1A56A0" : "transparent"}`,
                }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="text-sm font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Nome</label>
          <input
            autoFocus type="text" placeholder="Ex: Pré-treino, Ceia…"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid #E5E5E5", background: "#F7F7F7", color: "#1A1A1A" }}
          />
        </div>

        {/* Horário */}
        <div>
          <label className="text-sm font-semibold block mb-2" style={{ color: "#1A1A1A" }}>Horário <span style={{ color: "#999", fontWeight: 400 }}>(opcional)</span></label>
          <input
            type="text" placeholder="Ex: 16h–17h"
            value={horario}
            onChange={e => setHorario(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid #E5E5E5", background: "#F7F7F7", color: "#1A1A1A" }}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!label.trim()}
          className="w-full text-white font-bold py-4 rounded-2xl text-sm transition-opacity disabled:opacity-40"
          style={{ background: "#1A56A0" }}>
          Criar refeição
        </button>
      </div>
    </div>
  );
}

/* ─── Modal confirmar remoção ─────────────────────────────────────────────── */
function ConfirmRemoveModal({ label, temItens, onConfirm, onCancel }: {
  label: string; temItens: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ maxWidth: 390, margin: "0 auto", left: "50%", transform: "translateX(-50%)" }}>
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full bg-white rounded-2xl px-5 py-6 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "#FEF2F2" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-bold text-base" style={{ color: "#1A1A1A" }}>Remover "{label}"?</p>
          {temItens && (
            <p className="text-sm mt-1" style={{ color: "#999" }}>
              Os itens registrados nesta refeição permanecerão no diário do dia, mas a refeição será removida da lista.
            </p>
          )}
          {!temItens && (
            <p className="text-sm mt-1" style={{ color: "#999" }}>Esta refeição será removida da sua lista.</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors"
            style={{ background: "#F3F4F6", color: "#666" }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#EF4444" }}>
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}
