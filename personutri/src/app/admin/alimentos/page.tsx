"use client";

import { useState, useMemo } from "react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Alimento {
  id: string;
  nome: string;
  categoria: string;
  marca?: string;
  calorias_100g: number;
  proteina_100g: number;
  carboidrato_100g: number;
  gordura_100g: number;
  fibra_100g?: number;
  sodio_mg_100g?: number;
  porcao_padrao_g: number;
  unidade_medida: string;
  fonte: string;
}

/* ─── Seed ────────────────────────────────────────────────────────────────── */
const SEED: Alimento[] = [
  { id:"a1",  nome:"Frango grelhado (peito)",       categoria:"proteinas",   calorias_100g:159, proteina_100g:32.8, carboidrato_100g:0.0,  gordura_100g:3.2,  fibra_100g:0,   porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a2",  nome:"Carne bovina (patinho cozido)", categoria:"proteinas",   calorias_100g:219, proteina_100g:32.5, carboidrato_100g:0.0,  gordura_100g:9.3,  fibra_100g:0,   porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a3",  nome:"Atum em conserva (escorrido)",  categoria:"proteinas",   calorias_100g:132, proteina_100g:28.9, carboidrato_100g:0.0,  gordura_100g:1.7,  fibra_100g:0,   porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a4",  nome:"Ovos inteiros",                 categoria:"proteinas",   calorias_100g:143, proteina_100g:13.0, carboidrato_100g:0.6,  gordura_100g:9.5,  fibra_100g:0,   porcao_padrao_g:50,  unidade_medida:"unidade", fonte:"TACO" },
  { id:"a5",  nome:"Claras de ovo",                 categoria:"proteinas",   calorias_100g:52,  proteina_100g:11.0, carboidrato_100g:0.7,  gordura_100g:0.2,  fibra_100g:0,   porcao_padrao_g:30,  unidade_medida:"unidade", fonte:"TACO" },
  { id:"a6",  nome:"Salmão grelhado",               categoria:"proteinas",   calorias_100g:208, proteina_100g:28.2, carboidrato_100g:0.0,  gordura_100g:10.0, fibra_100g:0,   porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a7",  nome:"Tilápia assada",                categoria:"proteinas",   calorias_100g:128, proteina_100g:26.2, carboidrato_100g:0.0,  gordura_100g:2.6,  fibra_100g:0,   porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a8",  nome:"Whey protein (pó)",             categoria:"suplementos", calorias_100g:400, proteina_100g:80.0, carboidrato_100g:8.0,  gordura_100g:5.0,  fibra_100g:0,   porcao_padrao_g:30,  unidade_medida:"g",       fonte:"TACO" },
  { id:"a9",  nome:"Caseína proteica (pó)",         categoria:"suplementos", calorias_100g:370, proteina_100g:75.0, carboidrato_100g:10.0, gordura_100g:3.0,  fibra_100g:0,   porcao_padrao_g:30,  unidade_medida:"g",       fonte:"TACO" },
  { id:"a10", nome:"Feijão carioca cozido",         categoria:"leguminosas", calorias_100g:76,  proteina_100g:4.8,  carboidrato_100g:13.6, gordura_100g:0.5,  fibra_100g:8.5, porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a11", nome:"Lentilha cozida",               categoria:"leguminosas", calorias_100g:93,  proteina_100g:6.3,  carboidrato_100g:16.3, gordura_100g:0.4,  fibra_100g:7.9, porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a12", nome:"Arroz branco cozido",           categoria:"graos",       calorias_100g:128, proteina_100g:2.5,  carboidrato_100g:28.1, gordura_100g:0.2,  fibra_100g:0.2, porcao_padrao_g:150, unidade_medida:"g",       fonte:"TACO" },
  { id:"a13", nome:"Arroz integral cozido",         categoria:"graos",       calorias_100g:124, proteina_100g:2.6,  carboidrato_100g:25.8, gordura_100g:1.0,  fibra_100g:1.8, porcao_padrao_g:150, unidade_medida:"g",       fonte:"TACO" },
  { id:"a14", nome:"Aveia em flocos",               categoria:"graos",       calorias_100g:394, proteina_100g:13.9, carboidrato_100g:66.6, gordura_100g:8.5,  fibra_100g:9.1, porcao_padrao_g:40,  unidade_medida:"g",       fonte:"TACO" },
  { id:"a15", nome:"Batata-doce cozida",            categoria:"tuberculos",  calorias_100g:86,  proteina_100g:1.4,  carboidrato_100g:20.4, gordura_100g:0.1,  fibra_100g:2.2, porcao_padrao_g:150, unidade_medida:"g",       fonte:"TACO" },
  { id:"a16", nome:"Macarrão integral cozido",      categoria:"graos",       calorias_100g:124, proteina_100g:5.3,  carboidrato_100g:23.2, gordura_100g:1.1,  fibra_100g:3.5, porcao_padrao_g:120, unidade_medida:"g",       fonte:"TACO" },
  { id:"a17", nome:"Pão integral (fatia)",          categoria:"graos",       calorias_100g:253, proteina_100g:8.0,  carboidrato_100g:42.0, gordura_100g:3.0,  fibra_100g:6.0, porcao_padrao_g:30,  unidade_medida:"fatia",   fonte:"TACO" },
  { id:"a18", nome:"Iogurte grego integral",        categoria:"laticinios",  calorias_100g:97,  proteina_100g:9.1,  carboidrato_100g:3.6,  gordura_100g:5.0,  fibra_100g:0,   porcao_padrao_g:170, unidade_medida:"g",       fonte:"TACO" },
  { id:"a19", nome:"Queijo cottage",                categoria:"laticinios",  calorias_100g:98,  proteina_100g:11.1, carboidrato_100g:3.4,  gordura_100g:4.3,  fibra_100g:0,   porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a20", nome:"Leite integral",                categoria:"laticinios",  calorias_100g:61,  proteina_100g:3.2,  carboidrato_100g:4.8,  gordura_100g:3.3,  fibra_100g:0,   porcao_padrao_g:200, unidade_medida:"ml",      fonte:"TACO" },
  { id:"a21", nome:"Azeite de oliva",               categoria:"gorduras",    calorias_100g:884, proteina_100g:0.0,  carboidrato_100g:0.0,  gordura_100g:100,  fibra_100g:0,   porcao_padrao_g:10,  unidade_medida:"ml",      fonte:"TACO" },
  { id:"a22", nome:"Abacate",                       categoria:"frutas",      calorias_100g:160, proteina_100g:2.0,  carboidrato_100g:6.0,  gordura_100g:14.7, fibra_100g:6.7, porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a23", nome:"Amendoim torrado",              categoria:"oleaginosas", calorias_100g:567, proteina_100g:25.8, carboidrato_100g:16.1, gordura_100g:49.2, fibra_100g:8.5, porcao_padrao_g:30,  unidade_medida:"g",       fonte:"TACO" },
  { id:"a24", nome:"Banana prata",                  categoria:"frutas",      calorias_100g:98,  proteina_100g:1.3,  carboidrato_100g:26.0, gordura_100g:0.1,  fibra_100g:2.0, porcao_padrao_g:100, unidade_medida:"unidade", fonte:"TACO" },
  { id:"a25", nome:"Maçã",                          categoria:"frutas",      calorias_100g:56,  proteina_100g:0.3,  carboidrato_100g:15.2, gordura_100g:0.1,  fibra_100g:2.4, porcao_padrao_g:150, unidade_medida:"unidade", fonte:"TACO" },
  { id:"a26", nome:"Brócolis cozido",               categoria:"vegetais",    calorias_100g:25,  proteina_100g:2.4,  carboidrato_100g:3.6,  gordura_100g:0.2,  fibra_100g:2.4, porcao_padrao_g:100, unidade_medida:"g",       fonte:"TACO" },
  { id:"a27", nome:"Espinafre cru",                 categoria:"vegetais",    calorias_100g:22,  proteina_100g:2.9,  carboidrato_100g:3.6,  gordura_100g:0.4,  fibra_100g:2.2, porcao_padrao_g:50,  unidade_medida:"g",       fonte:"TACO" },
];

/* ─── Config ──────────────────────────────────────────────────────────────── */
const CATEGORIAS = [
  { value:"proteinas",   label:"Proteínas",    icon:"🥩" },
  { value:"suplementos", label:"Suplementos",  icon:"🧪" },
  { value:"graos",       label:"Grãos",        icon:"🌾" },
  { value:"tuberculos",  label:"Tubérculos",   icon:"🥔" },
  { value:"laticinios",  label:"Laticínios",   icon:"🥛" },
  { value:"leguminosas", label:"Leguminosas",  icon:"🫘" },
  { value:"frutas",      label:"Frutas",       icon:"🍎" },
  { value:"vegetais",    label:"Vegetais",     icon:"🥦" },
  { value:"oleaginosas", label:"Oleaginosas",  icon:"🥜" },
  { value:"gorduras",    label:"Gorduras",     icon:"🫒" },
];

const CAT_MAP = Object.fromEntries(CATEGORIAS.map(c => [c.value, c]));
const UNIDADES = ["g","ml","unidade","fatia","colher","xícara"];
const FONTES = ["TACO","IBGE","USDA","usuario"];

const BLANK = (): Omit<Alimento,"id"> => ({
  nome:"", categoria:"proteinas", marca:"",
  calorias_100g:0, proteina_100g:0, carboidrato_100g:0, gordura_100g:0,
  fibra_100g:0, sodio_mg_100g:0,
  porcao_padrao_g:100, unidade_medida:"g", fonte:"TACO",
});

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AdminAlimentosPage() {
  const [alimentos, setAlimentos] = useState<Alimento[]>(SEED);
  const [busca, setBusca] = useState("");
  const [filtroCateg, setFiltroCateg] = useState("");
  const [modal, setModal] = useState<"criar"|"editar"|null>(null);
  const [editando, setEditando] = useState<Alimento|null>(null);
  const [form, setForm] = useState(BLANK());
  const [confirmarDelete, setConfirmarDelete] = useState<string|null>(null);
  const [toast, setToast] = useState<string|null>(null);
  const [detalhes, setDetalhes] = useState<string|null>(null);

  const filtrados = useMemo(() =>
    alimentos.filter(a => {
      const m = !busca || a.nome.toLowerCase().includes(busca.toLowerCase());
      const c = !filtroCateg || a.categoria === filtroCateg;
      return m && c;
    }),
    [alimentos, busca, filtroCateg]
  );

  // Agrupado por categoria para exibição
  const agrupado = useMemo(() => {
    const grupos: Record<string, Alimento[]> = {};
    filtrados.forEach(a => {
      if (!grupos[a.categoria]) grupos[a.categoria] = [];
      grupos[a.categoria].push(a);
    });
    return grupos;
  }, [filtrados]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function abrirCriar() { setForm(BLANK()); setEditando(null); setModal("criar"); }
  function abrirEditar(a: Alimento) { setForm({...a}); setEditando(a); setModal("editar"); }

  function salvar() {
    if (!form.nome.trim()) return;
    if (modal === "criar") {
      setAlimentos(prev => [{ ...form, id: `a${Date.now()}` }, ...prev]);
      showToast("Alimento criado.");
    } else if (editando) {
      setAlimentos(prev => prev.map(a => a.id === editando.id ? { ...form, id: editando.id } : a));
      showToast("Alimento atualizado.");
    }
    setModal(null);
  }

  function deletar(id: string) {
    setAlimentos(prev => prev.filter(a => a.id !== id));
    setConfirmarDelete(null);
    showToast("Alimento removido.");
  }

  function num(key: keyof Alimento, val: string) {
    setForm(p => ({ ...p, [key]: parseFloat(val) || 0 }));
  }

  const totalCategs = Object.keys(agrupado).length;

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header style={{ background: "#1D9E75" }} className="px-5 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Admin</p>
            <h1 className="text-white text-xl font-bold mt-0.5">Banco de Alimentos</h1>
          </div>
          <button onClick={abrirCriar}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Novo
          </button>
        </div>
        <p className="text-white/50 text-xs mt-2">{alimentos.length} alimentos · fonte TACO</p>
      </header>

      {/* Filtros */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-border">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Buscar alimento…" value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-text placeholder:text-muted"/>
          {busca && <button onClick={() => setBusca("")} className="text-muted text-xs">✕</button>}
        </div>

        {/* Chips de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => setFiltroCateg("")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              !filtroCateg ? "border-teal-500 bg-teal-50 text-teal-700" : "border-border bg-white text-muted"
            }`}>
            Todos
          </button>
          {CATEGORIAS.map(c => (
            <button key={c.value} onClick={() => setFiltroCateg(filtroCateg === c.value ? "" : c.value)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filtroCateg === c.value ? "border-teal-500 bg-teal-50 text-teal-700" : "border-border bg-white text-muted"
              }`}>
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        {(busca || filtroCateg) && (
          <p className="text-xs text-muted">{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}{totalCategs > 1 ? ` em ${totalCategs} categorias` : ""}</p>
        )}
      </div>

      {/* Lista agrupada por categoria */}
      <div className="flex-1 px-5 pb-8 flex flex-col gap-5">
        {filtrados.length === 0 && (
          <div className="text-center py-16 text-muted text-sm">
            <p className="text-3xl mb-3">🥗</p>
            Nenhum alimento encontrado.
          </div>
        )}
        {Object.entries(agrupado).map(([cat, itens]) => {
          const catInfo = CAT_MAP[cat];
          return (
            <div key={cat}>
              {/* Cabeçalho da categoria */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{catInfo?.icon ?? "🍽️"}</span>
                <span className="text-sm font-bold text-text">{catInfo?.label ?? cat}</span>
                <span className="text-xs text-muted ml-auto">{itens.length} item{itens.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="bg-white rounded-xl border border-border overflow-hidden divide-y divide-gray-50">
                {itens.map(a => (
                  <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{a.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted flex-wrap">
                        <span className="font-medium text-text">{a.calorias_100g} kcal</span>
                        <span className="font-medium" style={{color:"#1A56A0"}}>{a.proteina_100g}g P</span>
                        <span style={{color:"#1D9E75"}}>{a.carboidrato_100g}g C</span>
                        <span style={{color:"#D85A30"}}>{a.gordura_100g}g G</span>
                        <span>· por 100{a.unidade_medida === "ml" ? "ml" : "g"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setDetalhes(detalhes === a.id ? null : a.id)}
                        className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className={`transition-transform ${detalhes === a.id ? "rotate-180" : ""}`}>
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </button>
                      <button onClick={() => abrirEditar(a)}
                        className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => setConfirmarDelete(a.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {/* Expandido com nutrição completa */}
                {itens.filter(a => detalhes === a.id).map(a => (
                  <div key={`d-${a.id}`} className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">Composição por 100{a.unidade_medida === "ml" ? "ml" : "g"}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { l:"Calorias",     v:`${a.calorias_100g} kcal`,  c:"#1A1A1A" },
                        { l:"Proteína",     v:`${a.proteina_100g}g`,       c:"#1A56A0" },
                        { l:"Carboidratos", v:`${a.carboidrato_100g}g`,    c:"#1D9E75" },
                        { l:"Gorduras",     v:`${a.gordura_100g}g`,        c:"#D85A30" },
                        { l:"Fibras",       v:`${a.fibra_100g ?? "—"}g`,   c:"#6B7280" },
                        { l:"Sódio",        v:a.sodio_mg_100g ? `${a.sodio_mg_100g}mg` : "—", c:"#6B7280" },
                      ].map(x => (
                        <div key={x.l} className="bg-white rounded-lg px-2 py-2 text-center border border-gray-100">
                          <p className="text-[10px] text-muted">{x.l}</p>
                          <p className="text-xs font-bold mt-0.5" style={{color:x.c}}>{x.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      <span>Porção: {a.porcao_padrao_g}{a.unidade_medida === "ml" ? "ml" : a.unidade_medida === "g" ? "g" : ` ${a.unidade_medida}`}</span>
                      <span>·</span>
                      <span>Fonte: {a.fonte}</span>
                      {a.marca && <><span>·</span><span>Marca: {a.marca}</span></>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{maxWidth:390,margin:"0 auto",left:"50%",transform:"translateX(-50%)"}}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)}/>
          <div className="relative w-full bg-white rounded-t-2xl flex flex-col max-h-[92dvh]">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200"/>
            </div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text">{modal === "criar" ? "Novo Alimento" : "Editar Alimento"}</h3>
              <button onClick={() => setModal(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {/* Identificação */}
              <SectionTitle>Identificação</SectionTitle>

              <Field label="Nome *">
                <input type="text" value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))}
                  placeholder="Ex: Frango grelhado (peito)"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"/>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria *">
                  <select value={form.categoria} onChange={e => setForm(p => ({...p, categoria: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-teal-400 transition-all">
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </Field>
                <Field label="Fonte">
                  <select value={form.fonte} onChange={e => setForm(p => ({...p, fonte: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-teal-400 transition-all">
                    {FONTES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Marca (opcional)">
                <input type="text" value={form.marca ?? ""} onChange={e => setForm(p => ({...p, marca: e.target.value}))}
                  placeholder="Deixar vazio para genérico"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"/>
              </Field>

              {/* Valores por 100g */}
              <SectionTitle>Valores por 100g / 100ml</SectionTitle>

              <div className="grid grid-cols-2 gap-3">
                <NumField label="Calorias (kcal)" value={form.calorias_100g} onChange={v => num("calorias_100g", v)}/>
                <NumField label="Proteína (g)"    value={form.proteina_100g} onChange={v => num("proteina_100g", v)}/>
                <NumField label="Carboidratos (g)" value={form.carboidrato_100g} onChange={v => num("carboidrato_100g", v)}/>
                <NumField label="Gorduras (g)"    value={form.gordura_100g} onChange={v => num("gordura_100g", v)}/>
                <NumField label="Fibras (g)"      value={form.fibra_100g ?? 0} onChange={v => num("fibra_100g", v)}/>
                <NumField label="Sódio (mg)"      value={form.sodio_mg_100g ?? 0} onChange={v => num("sodio_mg_100g", v)}/>
              </div>

              {/* Porção padrão */}
              <SectionTitle>Porção padrão</SectionTitle>

              <div className="grid grid-cols-2 gap-3">
                <NumField label="Quantidade" value={form.porcao_padrao_g} onChange={v => num("porcao_padrao_g", v)}/>
                <Field label="Unidade">
                  <select value={form.unidade_medida} onChange={e => setForm(p => ({...p, unidade_medida: e.target.value}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-teal-400 transition-all">
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
              </div>

              {/* Preview calórico */}
              {form.calorias_100g > 0 && (
                <div className="bg-gray-50 rounded-xl border border-border px-4 py-3">
                  <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
                    Preview por porção ({form.porcao_padrao_g}{form.unidade_medida === "ml" ? "ml" : "g"})
                  </p>
                  <div className="flex gap-3 text-center">
                    {[
                      { l:"Cal",    v:`${Math.round(form.calorias_100g*form.porcao_padrao_g/100)}`, unit:"kcal", c:"#1A1A1A" },
                      { l:"Prot",   v:`${(form.proteina_100g*form.porcao_padrao_g/100).toFixed(1)}`, unit:"g",   c:"#1A56A0" },
                      { l:"Carbs",  v:`${(form.carboidrato_100g*form.porcao_padrao_g/100).toFixed(1)}`, unit:"g", c:"#1D9E75" },
                      { l:"Gord",   v:`${(form.gordura_100g*form.porcao_padrao_g/100).toFixed(1)}`, unit:"g",   c:"#D85A30" },
                    ].map(x => (
                      <div key={x.l} className="flex-1">
                        <p className="text-[10px] text-muted">{x.l}</p>
                        <p className="text-sm font-bold" style={{color:x.c}}>{x.v}<span className="text-[10px] font-normal ml-0.5">{x.unit}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={salvar} disabled={!form.nome.trim()}
                style={{background:"#1D9E75"}}
                className="w-full text-white font-bold py-3.5 rounded-xl text-sm active:opacity-80 disabled:opacity-40 mt-2">
                {modal === "criar" ? "Criar alimento" : "Salvar alterações"}
              </button>
              <div className="pb-2"/>
            </div>
          </div>
        </div>
      )}

      {/* Dialog deleção */}
      {confirmarDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{maxWidth:390,margin:"0 auto",left:"50%",transform:"translateX(-50%)"}}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmarDelete(null)}/>
          <div className="relative bg-white rounded-2xl p-6 w-full flex flex-col gap-4 shadow-xl">
            <div className="text-center">
              <p className="text-2xl mb-2">🗑️</p>
              <h3 className="text-base font-bold text-text">Remover alimento?</h3>
              <p className="text-sm text-muted mt-1">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarDelete(null)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-text">
                Cancelar
              </button>
              <button onClick={() => deletar(confirmarDelete)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{background:"#D85A30"}}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{background:"#1D9E75"}}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted font-bold uppercase tracking-widest pt-1">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-text">{label}</label>
      {children}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input type="number" value={value || ""} onChange={e => onChange(e.target.value)}
        placeholder="0" min={0} step={0.1}
        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all text-right"/>
    </Field>
  );
}
