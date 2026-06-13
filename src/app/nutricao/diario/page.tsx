"use client";

import { useState, useMemo, useEffect } from "react";
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

type Refeicao = "cafe_manha" | "lanche_manha" | "almoco" | "lanche_tarde" | "jantar";

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

/* ─── Config ──────────────────────────────────────────────────────────────── */
const REFEICOES: { id: Refeicao; label: string; icon: string; horario: string }[] = [
  { id: "cafe_manha",  label: "Café da manhã", icon: "☀️", horario: "6h–9h"  },
  { id: "lanche_manha",label: "Lanche manhã",  icon: "🍎", horario: "10h–11h"},
  { id: "almoco",      label: "Almoço",        icon: "🍽️", horario: "12h–14h"},
  { id: "lanche_tarde",label: "Lanche tarde",  icon: "🥤", horario: "15h–17h"},
  { id: "jantar",      label: "Jantar",        icon: "🌙", horario: "19h–21h"},
];

// Metas default — sobrescritas pelo perfil em runtime
const METAS_DEFAULT = { calorias: 2000, proteina_g: 150, carboidrato_g: 200, gordura_g: 67 };

const DIARIO_VAZIO: Record<Refeicao, ItemDiario[]> = {
  cafe_manha: [], lanche_manha: [], almoco: [], lanche_tarde: [], jantar: [],
};

// Mock banco de alimentos (subconjunto do seed SQL)
const BANCO_ALIMENTOS: AlimentoBanco[] = [
  { id: "a1",  nome: "Frango grelhado (peito)",       categoria: "proteinas",   calorias_100g: 159, proteina_100g: 32.8, carboidrato_100g: 0.0, gordura_100g: 3.2,  porcao_padrao_g: 100 },
  { id: "a2",  nome: "Whey protein (pó)",             categoria: "suplementos", calorias_100g: 400, proteina_100g: 80.0, carboidrato_100g: 8.0, gordura_100g: 5.0,  porcao_padrao_g: 30  },
  { id: "a3",  nome: "Ovos inteiros",                 categoria: "proteinas",   calorias_100g: 143, proteina_100g: 13.0, carboidrato_100g: 0.6, gordura_100g: 9.5,  porcao_padrao_g: 50  },
  { id: "a4",  nome: "Aveia em flocos",               categoria: "graos",       calorias_100g: 394, proteina_100g: 13.9, carboidrato_100g: 66.6, gordura_100g: 8.5, porcao_padrao_g: 40  },
  { id: "a5",  nome: "Arroz integral cozido",         categoria: "graos",       calorias_100g: 124, proteina_100g: 2.6,  carboidrato_100g: 25.8, gordura_100g: 1.0,  porcao_padrao_g: 150 },
  { id: "a6",  nome: "Batata-doce cozida",            categoria: "tuberculos",  calorias_100g: 86,  proteina_100g: 1.4,  carboidrato_100g: 20.4, gordura_100g: 0.1,  porcao_padrao_g: 150 },
  { id: "a7",  nome: "Iogurte grego integral",        categoria: "laticinios",  calorias_100g: 97,  proteina_100g: 9.1,  carboidrato_100g: 3.6,  gordura_100g: 5.0,  porcao_padrao_g: 170 },
  { id: "a8",  nome: "Feijão carioca cozido",         categoria: "leguminosas", calorias_100g: 76,  proteina_100g: 4.8,  carboidrato_100g: 13.6, gordura_100g: 0.5,  porcao_padrao_g: 100 },
  { id: "a9",  nome: "Salmão grelhado",               categoria: "proteinas",   calorias_100g: 208, proteina_100g: 28.2, carboidrato_100g: 0.0,  gordura_100g: 10.0, porcao_padrao_g: 100 },
  { id: "a10", nome: "Banana prata",                  categoria: "frutas",      calorias_100g: 98,  proteina_100g: 1.3,  carboidrato_100g: 26.0, gordura_100g: 0.1,  porcao_padrao_g: 100 },
  { id: "a11", nome: "Amendoim torrado",              categoria: "oleaginosas", calorias_100g: 567, proteina_100g: 25.8, carboidrato_100g: 16.1, gordura_100g: 49.2, porcao_padrao_g: 30  },
  { id: "a12", nome: "Queijo cottage",                categoria: "laticinios",  calorias_100g: 98,  proteina_100g: 11.1, carboidrato_100g: 3.4,  gordura_100g: 4.3,  porcao_padrao_g: 100 },
  { id: "a13", nome: "Brócolis cozido",               categoria: "vegetais",    calorias_100g: 25,  proteina_100g: 2.4,  carboidrato_100g: 3.6,  gordura_100g: 0.2,  porcao_padrao_g: 100 },
  { id: "a14", nome: "Atum em conserva (escorrido)", categoria: "proteinas",   calorias_100g: 132, proteina_100g: 28.9, carboidrato_100g: 0.0,  gordura_100g: 1.7,  porcao_padrao_g: 100 },
  { id: "a15", nome: "Caseína proteica (pó)",         categoria: "suplementos", calorias_100g: 370, proteina_100g: 75.0, carboidrato_100g: 10.0, gordura_100g: 3.0,  porcao_padrao_g: 30  },
];

const CAT_ICONS: Record<string, string> = {
  proteinas: "🥩", suplementos: "🧪", graos: "🌾", tuberculos: "🥔",
  laticinios: "🥛", leguminosas: "🫘", frutas: "🍎", vegetais: "🥦",
  oleaginosas: "🥜", gorduras: "🫒",
};

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function DiarioPage() {
  const hoje = new Date().toISOString().split("T")[0];

  const [diario, setDiario] = useState<Record<Refeicao, ItemDiario[]>>(DIARIO_VAZIO);
  const [expanded, setExpanded] = useState<Set<Refeicao>>(new Set(["cafe_manha", "almoco"]));
  const [modal, setModal] = useState<Refeicao | null>(null);
  const [bancoAlimentos, setBancoAlimentos] = useState<AlimentoBanco[]>(BANCO_ALIMENTOS);
  const [metas, setMetas] = useState(METAS_DEFAULT);
  const [userId, setUserId] = useState<string | null>(null);

  // Carregar dados do Supabase ao montar
  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // 1. Obter usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 2. Carregar metas do perfil
      const { data: perfil } = await supabase
        .from("users")
        .select("meta_calorica,proteina_g,carboidrato_g,gordura_g")
        .eq("id", user.id)
        .single();
      if (perfil) {
        setMetas({
          calorias:     perfil.meta_calorica,
          proteina_g:   perfil.proteina_g,
          carboidrato_g:perfil.carboidrato_g,
          gordura_g:    perfil.gordura_g,
        });
      }

      // 3. Carregar banco de alimentos do Supabase
      const { data: alimentos } = await supabase
        .from("alimentos")
        .select("id,nome,categoria,calorias_100g,proteina_100g,carboidrato_100g,gordura_100g,porcao_padrao_g")
        .is("deleted_at", null)
        .order("nome");
      if (alimentos?.length) setBancoAlimentos(alimentos as AlimentoBanco[]);

      // 4. Carregar entradas de hoje
      const { data: entradas } = await supabase
        .from("diario_alimentar")
        .select("id,refeicao,quantidade_g,calorias,proteina_g,carboidrato_g,gordura_g,alimentos(nome)")
        .eq("user_id", user.id)
        .eq("data", hoje)
        .is("deleted_at", null);

      // Sempre reseta para o que está no banco (vazio se não houver entradas)
      const novosDiario: Record<Refeicao, ItemDiario[]> = {
        cafe_manha: [], lanche_manha: [], almoco: [], lanche_tarde: [], jantar: [],
      };
      (entradas ?? []).forEach((e: {
        id: string; refeicao: string; quantidade_g: number;
        calorias: number; proteina_g: number; carboidrato_g: number; gordura_g: number;
        alimentos: { nome: string } | { nome: string }[] | null;
      }) => {
        const ref = e.refeicao as Refeicao;
        const alimNome = Array.isArray(e.alimentos)
          ? e.alimentos[0]?.nome ?? "—"
          : e.alimentos?.nome ?? "—";
        if (novosDiario[ref] !== undefined) {
          novosDiario[ref].push({
            id: e.id, nome: alimNome,
            quantidade_g: e.quantidade_g, calorias: e.calorias,
            proteina_g: e.proteina_g, carboidrato_g: e.carboidrato_g, gordura_g: e.gordura_g,
          });
        }
      });
      setDiario(novosDiario);
    }
    init();
  }, [hoje]);

  // Totais do dia
  const totais = useMemo(() => {
    const flat = Object.values(diario).flat();
    return {
      calorias:     Math.round(flat.reduce((s, i) => s + i.calorias,     0)),
      proteina_g:   Math.round(flat.reduce((s, i) => s + i.proteina_g,   0) * 10) / 10,
      carboidrato_g:Math.round(flat.reduce((s, i) => s + i.carboidrato_g,0) * 10) / 10,
      gordura_g:    Math.round(flat.reduce((s, i) => s + i.gordura_g,    0) * 10) / 10,
    };
  }, [diario]);

  function toggleRefeicao(id: Refeicao) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function removeItem(refeicao: Refeicao, id: string) {
    // Atualização optimista
    setDiario(prev => ({ ...prev, [refeicao]: prev[refeicao].filter(i => i.id !== id) }));
    // Soft delete no Supabase
    if (userId) {
      const supabase = createClient();
      await supabase.from("diario_alimentar")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
    }
  }

  async function addItem(refeicao: Refeicao, alimento: AlimentoBanco, quantidade_g: number) {
    const fator = quantidade_g / 100;
    const calorias      = Math.round(alimento.calorias_100g    * fator);
    const proteina_g    = Math.round(alimento.proteina_100g    * fator * 10) / 10;
    const carboidrato_g = Math.round(alimento.carboidrato_100g * fator * 10) / 10;
    const gordura_g     = Math.round(alimento.gordura_100g     * fator * 10) / 10;

    let itemId = `local-${Date.now()}`;

    if (userId) {
      const supabase = createClient();
      const { data } = await supabase.from("diario_alimentar").insert({
        user_id:       userId,
        alimento_id:   alimento.id,
        data:          hoje,
        refeicao,
        quantidade_g,
        calorias,
        proteina_g,
        carboidrato_g,
        gordura_g,
      }).select("id").single();
      if (data?.id) itemId = data.id;
    }

    const item: ItemDiario = {
      id: itemId, nome: alimento.nome, quantidade_g,
      calorias, proteina_g, carboidrato_g, gordura_g,
    };
    setDiario(prev => ({ ...prev, [refeicao]: [...prev[refeicao], item] }));
    setModal(null);
    setExpanded(prev => new Set([...prev, refeicao]));
  }

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  const proteina_deficit = metas.proteina_g - totais.proteina_g;

  return (
    <div className="flex flex-col min-h-dvh bg-surface pb-20">
      {/* Header */}
      <header style={{ background: "#1A56A0" }} className="px-5 pt-10 pb-5">
        <div className="flex items-center justify-between mb-1">
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-white font-bold capitalize">{today}</p>
            <p className="text-white/60 text-xs">Hoje</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">

        {/* Macro summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <MacroCard
            label="Calorias"
            atual={totais.calorias}
            meta={metas.calorias}
            unit="kcal"
            color="#1A56A0"
            big
          />
          <div className="flex flex-col gap-3">
            <MacroMiniCard label="Proteína"     atual={totais.proteina_g}    meta={metas.proteina_g}    unit="g" color="#1A56A0" />
            <MacroMiniCard label="Carboidratos" atual={totais.carboidrato_g} meta={metas.carboidrato_g} unit="g" color="#1D9E75" />
            <MacroMiniCard label="Gorduras"     atual={totais.gordura_g}     meta={metas.gordura_g}     unit="g" color="#D85A30" />
          </div>
        </div>

        {/* Alerta de proteína */}
        {proteina_deficit > 10 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{ background: "#FEF9EC", borderColor: "#F59E0B" }}>
            <span className="text-lg flex-shrink-0">⚠️</span>
            <p className="text-sm" style={{ color: "#92400E" }}>
              Você ainda precisa de <strong>{proteina_deficit.toFixed(0)}g de proteína</strong> hoje.
              Adicione uma refeição com frango, atum ou whey.
            </p>
          </div>
        )}

        {/* Refeições accordion */}
        {REFEICOES.map(ref => {
          const itens = diario[ref.id];
          const isOpen = expanded.has(ref.id);
          const totalRef = itens.reduce((s, i) => ({ cal: s.cal + i.calorias, prot: s.prot + i.proteina_g }), { cal: 0, prot: 0 });

          return (
            <div key={ref.id} className="bg-white rounded-xl border border-border overflow-hidden">
              {/* Header da refeição */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                onClick={() => toggleRefeicao(ref.id)}>
                <span className="text-lg">{ref.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text">{ref.label}</span>
                    <span className="text-xs text-muted">{ref.horario}</span>
                  </div>
                  {itens.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">
                      {itens.length} item{itens.length > 1 ? "s" : ""} · {Math.round(totalRef.cal)} kcal · {totalRef.prot.toFixed(0)}g prot
                    </p>
                  )}
                  {itens.length === 0 && <p className="text-xs text-muted mt-0.5">Vazio</p>}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                  className={`transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Conteúdo expandido */}
              {isOpen && (
                <div className="border-t border-border">
                  {itens.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{item.nome}</p>
                        <p className="text-xs text-muted">{item.quantidade_g}g · {Math.round(item.calorias)} kcal</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted flex-shrink-0">
                        <span className="font-medium" style={{ color: "#1A56A0" }}>{item.proteina_g.toFixed(0)}g P</span>
                        <span>{item.carboidrato_g.toFixed(0)}g C</span>
                        <span>{item.gordura_g.toFixed(0)}g G</span>
                      </div>
                      <button onClick={() => removeItem(ref.id, item.id)}
                        className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-muted hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 2l8 8M10 2L2 10" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setModal(ref.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
                    style={{ color: "#1A56A0" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Adicionar item
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav active="nutricao" />

      {/* Modal busca de alimento */}
      {modal && (
        <BuscaAlimentoModal
          refeicao={modal}
          banco={bancoAlimentos}
          onAdd={(alimento, qtd) => addItem(modal, alimento, qtd)}
          onClose={() => setModal(null)}
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
    <div className="bg-white rounded-xl border border-border px-4 py-4 flex flex-col gap-2">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">{label}</p>
      <div>
        <span className={`font-bold ${big ? "text-3xl" : "text-xl"}`} style={{ color }}>
          {atual.toLocaleString("pt-BR")}
        </span>
        <span className="text-xs text-muted ml-1">{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[11px] text-muted">{restante > 0 ? `${restante.toLocaleString("pt-BR")} restantes` : "Meta atingida ✓"}</p>
    </div>
  );
}

function MacroMiniCard({ label, atual, meta, unit, color }: {
  label: string; atual: number; meta: number; unit: string; color: string;
}) {
  const pct = Math.min((atual / meta) * 100, 100);
  return (
    <div className="bg-white rounded-xl border border-border px-3 py-2.5">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{atual.toFixed(0)}<span className="text-xs font-normal text-muted">/{meta}{unit}</span></span>
      </div>
      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ─── Modal busca alimento ────────────────────────────────────────────────── */
function BuscaAlimentoModal({ refeicao, banco, onAdd, onClose }: {
  refeicao: Refeicao;
  banco: AlimentoBanco[];
  onAdd: (alimento: AlimentoBanco, quantidade_g: number) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AlimentoBanco | null>(null);
  const [quantidade, setQuantidade] = useState<string>("");

  const refLabel = REFEICOES.find(r => r.id === refeicao)?.label ?? "";

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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-2xl flex flex-col max-h-[93dvh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text">Adicionar a {refLabel}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-muted">
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-border">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Buscar alimento…"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              className="flex-1 bg-transparent text-base outline-none text-text placeholder:text-muted"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelected(null); }}
                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-muted text-xs">✕</button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selected && (
            <div className="flex flex-col">
              {filtrado.map((alimento, idx) => (
                <button key={alimento.id}
                  onClick={() => { setSelected(alimento); setQuantidade(String(alimento.porcao_padrao_g)); }}
                  className={`flex items-center gap-4 px-5 py-4 text-left active:bg-gray-50 transition-colors ${idx < filtrado.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: "#F3F4F6" }}>
                    {CAT_ICONS[alimento.categoria] ?? "🍽️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text leading-snug">{alimento.nome}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1A56A0" }}>
                        {alimento.calorias_100g} kcal
                      </span>
                      <span className="text-xs text-muted">{alimento.proteina_100g}g P</span>
                      <span className="text-xs text-muted">{alimento.carboidrato_100g}g C</span>
                      <span className="text-xs text-muted">por 100g</span>
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
                  <p className="text-sm text-muted">Nenhum alimento encontrado</p>
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Selected food info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-2xl">{CAT_ICONS[selected.categoria] ?? "🍽️"}</span>
                <div>
                  <p className="text-sm font-bold text-text">{selected.nome}</p>
                  <p className="text-xs text-muted">{selected.calorias_100g} kcal/100g · {selected.proteina_100g}g P</p>
                </div>
                <button onClick={() => setSelected(null)} className="ml-auto text-xs text-blue-600 font-medium">
                  Trocar
                </button>
              </div>

              {/* Quantidade */}
              <div>
                <label className="text-sm font-semibold text-text block mb-2">Quantidade (g)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantidade(q => String(Math.max(1, parseFloat(q || "0") - 10)))}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-text font-bold text-lg hover:bg-gray-200 transition-colors">−</button>
                  <input
                    type="number"
                    value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    className="flex-1 text-center px-3 py-2.5 rounded-xl border border-border text-base font-bold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white transition-all"
                  />
                  <button onClick={() => setQuantidade(q => String(parseFloat(q || "0") + 10))}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-text font-bold text-lg hover:bg-gray-200 transition-colors">+</button>
                </div>
                {/* Porções rápidas */}
                <div className="flex gap-2 mt-2">
                  {[50, 100, 150, 200].map(q => (
                    <button key={q} onClick={() => setQuantidade(String(q))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        parseFloat(quantidade) === q
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-border bg-white text-muted hover:border-gray-300"
                      }`}>
                      {q}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview nutricional */}
              {preview && (
                <div className="bg-gray-50 rounded-xl border border-border px-4 py-3">
                  <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">Valores para {quantidade}g</p>
                  <div className="flex gap-3">
                    {[
                      { l: "Calorias", v: `${preview.cal} kcal`, c: "#1A56A0" },
                      { l: "Proteína", v: `${preview.prot}g`, c: "#1A56A0" },
                      { l: "Carbs",    v: `${(selected.carboidrato_100g * qtdNum / 100).toFixed(1)}g`, c: "#1D9E75" },
                      { l: "Gordura",  v: `${(selected.gordura_100g * qtdNum / 100).toFixed(1)}g`, c: "#D85A30" },
                    ].map(x => (
                      <div key={x.l} className="flex-1 text-center">
                        <p className="text-xs text-muted">{x.l}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: x.c }}>{x.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { if (!isNaN(qtdNum) && qtdNum > 0) onAdd(selected, qtdNum); }}
                disabled={isNaN(qtdNum) || qtdNum <= 0}
                style={{ background: "#1A56A0" }}
                className="w-full text-white font-bold py-3.5 rounded-xl text-sm active:opacity-80 transition-opacity disabled:opacity-40">
                Adicionar à refeição
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
