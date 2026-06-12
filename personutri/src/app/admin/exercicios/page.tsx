"use client";

import { useState, useMemo } from "react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type GrupoMuscular =
  | "peito" | "costas" | "ombros" | "biceps" | "triceps"
  | "quadriceps" | "posteriores" | "gluteos" | "panturrilhas"
  | "abdomen" | "trapezio" | "antebraco";

type PadraoMovimento =
  | "empurrar_horizontal" | "empurrar_vertical"
  | "puxar_horizontal"   | "puxar_vertical"
  | "agachar" | "empurrar_quadril" | "flexao_joelho"
  | "carregar" | "rotacao" | "isolamento";

type NivelExercicio = "iniciante" | "intermediario" | "avancado";

interface Exercicio {
  id: string;
  nome: string;
  grupo_muscular: GrupoMuscular;
  grupos_secundarios: GrupoMuscular[];
  padrao_movimento: PadraoMovimento;
  nivel: NivelExercicio;
  equipamento: string;
  bilateral: boolean;
  variacao_de?: string;   // id do exercício pai
  descricao?: string;
  instrucoes?: string;
}

/* ─── Seed expandido ──────────────────────────────────────────────────────── */
const SEED: Exercicio[] = [
  // PEITO
  { id:"p1",  nome:"Supino Reto com Barra",           grupo_muscular:"peito",       grupos_secundarios:["triceps","ombros"],   padrao_movimento:"empurrar_horizontal", nivel:"intermediario", equipamento:"barra + rack",             bilateral:true  },
  { id:"p2",  nome:"Supino Reto com Halteres",        grupo_muscular:"peito",       grupos_secundarios:["triceps","ombros"],   padrao_movimento:"empurrar_horizontal", nivel:"intermediario", equipamento:"halteres + banco",          bilateral:true,  variacao_de:"p1" },
  { id:"p3",  nome:"Supino Inclinado com Barra",      grupo_muscular:"peito",       grupos_secundarios:["triceps","ombros"],   padrao_movimento:"empurrar_horizontal", nivel:"intermediario", equipamento:"barra + banco inclinado",   bilateral:true,  variacao_de:"p1" },
  { id:"p4",  nome:"Supino Inclinado com Halteres",   grupo_muscular:"peito",       grupos_secundarios:["triceps","ombros"],   padrao_movimento:"empurrar_horizontal", nivel:"iniciante",     equipamento:"halteres + banco",          bilateral:true,  variacao_de:"p1" },
  { id:"p5",  nome:"Supino Declinado com Barra",      grupo_muscular:"peito",       grupos_secundarios:["triceps"],            padrao_movimento:"empurrar_horizontal", nivel:"intermediario", equipamento:"barra + banco declinado",   bilateral:true,  variacao_de:"p1" },
  { id:"p6",  nome:"Crossover no Cabo",               grupo_muscular:"peito",       grupos_secundarios:[],                    padrao_movimento:"isolamento",          nivel:"iniciante",     equipamento:"cabo",                      bilateral:false },
  { id:"p7",  nome:"Fly com Halteres",                grupo_muscular:"peito",       grupos_secundarios:[],                    padrao_movimento:"isolamento",          nivel:"iniciante",     equipamento:"halteres + banco",           bilateral:true,  variacao_de:"p6" },
  { id:"p8",  nome:"Peck Deck (Fly na Máquina)",      grupo_muscular:"peito",       grupos_secundarios:[],                    padrao_movimento:"isolamento",          nivel:"iniciante",     equipamento:"máquina peck deck",          bilateral:true,  variacao_de:"p6" },
  { id:"p9",  nome:"Flexão de Braços",                grupo_muscular:"peito",       grupos_secundarios:["triceps","ombros"],   padrao_movimento:"empurrar_horizontal", nivel:"iniciante",     equipamento:"nenhum",                    bilateral:true  },
  // COSTAS
  { id:"c1",  nome:"Barra Fixa (Pegada Pronada)",          grupo_muscular:"costas",  grupos_secundarios:["biceps","trapezio"],  padrao_movimento:"puxar_vertical",   nivel:"intermediario", equipamento:"barra fixa",         bilateral:true  },
  { id:"c2",  nome:"Barra Fixa (Pegada Supinada)",         grupo_muscular:"costas",  grupos_secundarios:["biceps"],            padrao_movimento:"puxar_vertical",   nivel:"intermediario", equipamento:"barra fixa",         bilateral:true,  variacao_de:"c1" },
  { id:"c3",  nome:"Puxada Frontal (Polia Alta)",          grupo_muscular:"costas",  grupos_secundarios:["biceps"],            padrao_movimento:"puxar_vertical",   nivel:"iniciante",     equipamento:"polia alta",         bilateral:true  },
  { id:"c4",  nome:"Puxada Fechada (Triângulo)",           grupo_muscular:"costas",  grupos_secundarios:["biceps"],            padrao_movimento:"puxar_vertical",   nivel:"iniciante",     equipamento:"polia alta",         bilateral:true,  variacao_de:"c3" },
  { id:"c5",  nome:"Remada Curvada com Barra",             grupo_muscular:"costas",  grupos_secundarios:["biceps","trapezio"],  padrao_movimento:"puxar_horizontal", nivel:"intermediario", equipamento:"barra",              bilateral:true  },
  { id:"c6",  nome:"Remada Unilateral com Haltere",        grupo_muscular:"costas",  grupos_secundarios:["biceps"],            padrao_movimento:"puxar_horizontal", nivel:"iniciante",     equipamento:"haltere + banco",    bilateral:false, variacao_de:"c5" },
  { id:"c7",  nome:"Remada na Polia Baixa (Triângulo)",    grupo_muscular:"costas",  grupos_secundarios:["biceps"],            padrao_movimento:"puxar_horizontal", nivel:"iniciante",     equipamento:"polia baixa",        bilateral:true,  variacao_de:"c5" },
  { id:"c8",  nome:"Remada Cavalinho (T-Bar)",             grupo_muscular:"costas",  grupos_secundarios:["biceps","trapezio"],  padrao_movimento:"puxar_horizontal", nivel:"intermediario", equipamento:"barra T",            bilateral:true,  variacao_de:"c5" },
  { id:"c9",  nome:"Levantamento Terra Convencional",      grupo_muscular:"costas",  grupos_secundarios:["gluteos","posteriores","quadriceps"], padrao_movimento:"empurrar_quadril", nivel:"avancado", equipamento:"barra", bilateral:true },
  { id:"c10", nome:"Levantamento Terra Romeno",            grupo_muscular:"costas",  grupos_secundarios:["gluteos","posteriores"], padrao_movimento:"empurrar_quadril", nivel:"intermediario", equipamento:"barra",       bilateral:true,  variacao_de:"c9" },
  { id:"c11", nome:"Pullover com Haltere",                 grupo_muscular:"costas",  grupos_secundarios:["peito"],             padrao_movimento:"puxar_vertical",   nivel:"iniciante",     equipamento:"haltere + banco", bilateral:true },
  // OMBROS
  { id:"o1",  nome:"Desenvolvimento com Barra (Militar)", grupo_muscular:"ombros",   grupos_secundarios:["triceps"],  padrao_movimento:"empurrar_vertical", nivel:"intermediario", equipamento:"barra",           bilateral:true  },
  { id:"o2",  nome:"Desenvolvimento com Halteres",        grupo_muscular:"ombros",   grupos_secundarios:["triceps"],  padrao_movimento:"empurrar_vertical", nivel:"iniciante",     equipamento:"halteres",        bilateral:true,  variacao_de:"o1" },
  { id:"o3",  nome:"Desenvolvimento na Máquina (Smith)",  grupo_muscular:"ombros",   grupos_secundarios:["triceps"],  padrao_movimento:"empurrar_vertical", nivel:"iniciante",     equipamento:"smith machine",   bilateral:true,  variacao_de:"o1" },
  { id:"o4",  nome:"Elevação Lateral com Halteres",       grupo_muscular:"ombros",   grupos_secundarios:[],           padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"halteres",        bilateral:true  },
  { id:"o5",  nome:"Elevação Lateral no Cabo",            grupo_muscular:"ombros",   grupos_secundarios:[],           padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"cabo",            bilateral:false, variacao_de:"o4" },
  { id:"o6",  nome:"Elevação Frontal com Halteres",       grupo_muscular:"ombros",   grupos_secundarios:[],           padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"halteres",        bilateral:true  },
  { id:"o7",  nome:"Crucifixo Inverso (Deltoide Post.)",  grupo_muscular:"ombros",   grupos_secundarios:["costas"],   padrao_movimento:"puxar_horizontal",  nivel:"iniciante",     equipamento:"halteres",        bilateral:true  },
  { id:"o8",  nome:"Encolhimento de Ombros (Trapézio)",   grupo_muscular:"trapezio", grupos_secundarios:["ombros"],   padrao_movimento:"carregar",          nivel:"iniciante",     equipamento:"halteres / barra", bilateral:true },
  // BÍCEPS
  { id:"b1",  nome:"Rosca Direta com Barra",        grupo_muscular:"biceps", grupos_secundarios:[],             padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"barra / barra EZ",  bilateral:true  },
  { id:"b2",  nome:"Rosca Alternada com Haltere",   grupo_muscular:"biceps", grupos_secundarios:[],             padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"halteres",          bilateral:false, variacao_de:"b1" },
  { id:"b3",  nome:"Rosca Martelo",                 grupo_muscular:"biceps", grupos_secundarios:["antebraco"],  padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"halteres",          bilateral:false, variacao_de:"b1" },
  { id:"b4",  nome:"Rosca Concentrada",             grupo_muscular:"biceps", grupos_secundarios:[],             padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"haltere",           bilateral:false, variacao_de:"b1" },
  { id:"b5",  nome:"Rosca no Cabo (Polia Baixa)",   grupo_muscular:"biceps", grupos_secundarios:[],             padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"cabo",              bilateral:true,  variacao_de:"b1" },
  { id:"b6",  nome:"Rosca Scott (Preacher Curl)",   grupo_muscular:"biceps", grupos_secundarios:[],             padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"barra EZ + banco",  bilateral:true,  variacao_de:"b1" },
  // TRÍCEPS
  { id:"t1",  nome:"Tríceps Corda no Cabo",          grupo_muscular:"triceps", grupos_secundarios:[], padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"cabo",              bilateral:true  },
  { id:"t2",  nome:"Tríceps Francês com Barra EZ",   grupo_muscular:"triceps", grupos_secundarios:[], padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"barra EZ",          bilateral:true,  variacao_de:"t1" },
  { id:"t3",  nome:"Tríceps Testa (Skull Crusher)",  grupo_muscular:"triceps", grupos_secundarios:[], padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"barra EZ + banco",  bilateral:true,  variacao_de:"t1" },
  { id:"t4",  nome:"Extensão de Tríceps Unilateral", grupo_muscular:"triceps", grupos_secundarios:[], padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"cabo / haltere",    bilateral:false, variacao_de:"t1" },
  { id:"t5",  nome:"Mergulho nas Paralelas (Dips)",  grupo_muscular:"triceps", grupos_secundarios:["peito","ombros"], padrao_movimento:"empurrar_vertical", nivel:"intermediario", equipamento:"paralelas", bilateral:true },
  { id:"t6",  nome:"Tríceps Coice com Haltere",      grupo_muscular:"triceps", grupos_secundarios:[], padrao_movimento:"isolamento",        nivel:"iniciante",     equipamento:"haltere",           bilateral:false, variacao_de:"t1" },
  // QUADRÍCEPS
  { id:"q1",  nome:"Agachamento Livre com Barra",   grupo_muscular:"quadriceps", grupos_secundarios:["gluteos","posteriores"], padrao_movimento:"agachar",    nivel:"intermediario", equipamento:"barra + rack",     bilateral:true  },
  { id:"q2",  nome:"Agachamento Goblet (Haltere)",  grupo_muscular:"quadriceps", grupos_secundarios:["gluteos"],              padrao_movimento:"agachar",    nivel:"iniciante",     equipamento:"haltere",          bilateral:true,  variacao_de:"q1" },
  { id:"q3",  nome:"Agachamento Hack (Máquina)",    grupo_muscular:"quadriceps", grupos_secundarios:["gluteos"],              padrao_movimento:"agachar",    nivel:"iniciante",     equipamento:"hack squat",       bilateral:true,  variacao_de:"q1" },
  { id:"q4",  nome:"Leg Press 45°",                 grupo_muscular:"quadriceps", grupos_secundarios:["gluteos"],              padrao_movimento:"agachar",    nivel:"iniciante",     equipamento:"leg press 45°",    bilateral:true,  variacao_de:"q1" },
  { id:"q5",  nome:"Cadeira Extensora",             grupo_muscular:"quadriceps", grupos_secundarios:[],                       padrao_movimento:"isolamento", nivel:"iniciante",     equipamento:"máquina extensora",bilateral:true  },
  { id:"q6",  nome:"Avanço com Halteres (Lunge)",   grupo_muscular:"quadriceps", grupos_secundarios:["gluteos","posteriores"],padrao_movimento:"agachar",    nivel:"intermediario", equipamento:"halteres",         bilateral:false, variacao_de:"q1" },
  { id:"q7",  nome:"Passada (Step Up) no Banco",   grupo_muscular:"quadriceps", grupos_secundarios:["gluteos"],              padrao_movimento:"agachar",    nivel:"iniciante",     equipamento:"halteres + banco", bilateral:false, variacao_de:"q1" },
  // POSTERIORES
  { id:"po1", nome:"Stiff com Barra",                 grupo_muscular:"posteriores", grupos_secundarios:["gluteos"],          padrao_movimento:"empurrar_quadril", nivel:"intermediario", equipamento:"barra",             bilateral:true  },
  { id:"po2", nome:"Stiff com Halteres",               grupo_muscular:"posteriores", grupos_secundarios:["gluteos"],          padrao_movimento:"empurrar_quadril", nivel:"iniciante",     equipamento:"halteres",          bilateral:true,  variacao_de:"po1" },
  { id:"po3", nome:"Mesa Flexora (Leg Curl)",          grupo_muscular:"posteriores", grupos_secundarios:[],                   padrao_movimento:"flexao_joelho",   nivel:"iniciante",     equipamento:"máquina flexora",   bilateral:true  },
  { id:"po4", nome:"Flexão de Joelho no Cabo",        grupo_muscular:"posteriores", grupos_secundarios:[],                   padrao_movimento:"flexao_joelho",   nivel:"iniciante",     equipamento:"cabo",              bilateral:false, variacao_de:"po3" },
  { id:"po5", nome:"Good Morning com Barra",           grupo_muscular:"posteriores", grupos_secundarios:["gluteos","costas"], padrao_movimento:"empurrar_quadril", nivel:"avancado",      equipamento:"barra",             bilateral:true  },
  // GLÚTEOS
  { id:"g1",  nome:"Hip Thrust com Barra",             grupo_muscular:"gluteos", grupos_secundarios:["posteriores"],padrao_movimento:"empurrar_quadril", nivel:"intermediario", equipamento:"barra + banco",     bilateral:true  },
  { id:"g2",  nome:"Hip Thrust com Haltere",           grupo_muscular:"gluteos", grupos_secundarios:["posteriores"],padrao_movimento:"empurrar_quadril", nivel:"iniciante",     equipamento:"haltere + banco",   bilateral:true,  variacao_de:"g1" },
  { id:"g3",  nome:"Elevação Pélvica no Chão",         grupo_muscular:"gluteos", grupos_secundarios:[],            padrao_movimento:"empurrar_quadril", nivel:"iniciante",     equipamento:"nenhum",            bilateral:true,  variacao_de:"g1" },
  { id:"g4",  nome:"Abdução no Cabo (Glúteo Médio)",   grupo_muscular:"gluteos", grupos_secundarios:[],            padrao_movimento:"isolamento",       nivel:"iniciante",     equipamento:"cabo",              bilateral:false },
  { id:"g5",  nome:"Agachamento Sumô com Haltere",     grupo_muscular:"gluteos", grupos_secundarios:["quadriceps","posteriores"],padrao_movimento:"agachar", nivel:"iniciante", equipamento:"haltere",          bilateral:true  },
  // PANTURRILHAS
  { id:"pa1", nome:"Elevação de Panturrilha em Pé",    grupo_muscular:"panturrilhas", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"máquina / degrau",   bilateral:true  },
  { id:"pa2", nome:"Elevação de Panturrilha Sentado",  grupo_muscular:"panturrilhas", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"máquina sentado",    bilateral:true,  variacao_de:"pa1" },
  { id:"pa3", nome:"Elevação de Panturrilha no Leg",   grupo_muscular:"panturrilhas", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"iniciante", equipamento:"leg press 45°",      bilateral:true,  variacao_de:"pa1" },
  // ABDÔMEN
  { id:"a1",  nome:"Prancha Abdominal (Plank)",         grupo_muscular:"abdomen", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"iniciante",     equipamento:"nenhum",        bilateral:true  },
  { id:"a2",  nome:"Abdominal Crunch",                  grupo_muscular:"abdomen", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"iniciante",     equipamento:"nenhum",        bilateral:true  },
  { id:"a3",  nome:"Abdominal na Polia (Cable Crunch)", grupo_muscular:"abdomen", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"iniciante",     equipamento:"polia alta",    bilateral:true  },
  { id:"a4",  nome:"Elevação de Pernas (Hanging)",      grupo_muscular:"abdomen", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"intermediario", equipamento:"barra fixa",    bilateral:true  },
  { id:"a5",  nome:"Roda Abdominal (Ab Wheel)",         grupo_muscular:"abdomen", grupos_secundarios:[], padrao_movimento:"isolamento", nivel:"intermediario", equipamento:"roda abdominal",bilateral:true  },
];

/* ─── Config ──────────────────────────────────────────────────────────────── */
const GRUPOS: { value: GrupoMuscular; label: string; icon: string }[] = [
  { value:"peito",        label:"Peito",        icon:"💪" },
  { value:"costas",       label:"Costas",       icon:"🔙" },
  { value:"ombros",       label:"Ombros",       icon:"🏔️" },
  { value:"biceps",       label:"Bíceps",       icon:"💪" },
  { value:"triceps",      label:"Tríceps",      icon:"💪" },
  { value:"quadriceps",   label:"Quadríceps",   icon:"🦵" },
  { value:"posteriores",  label:"Posteriores",  icon:"🦵" },
  { value:"gluteos",      label:"Glúteos",      icon:"🍑" },
  { value:"panturrilhas", label:"Panturrilhas", icon:"🦵" },
  { value:"abdomen",      label:"Abdômen",      icon:"🎯" },
  { value:"trapezio",     label:"Trapézio",     icon:"🔝" },
  { value:"antebraco",    label:"Antebraço",    icon:"💪" },
];

const PADROES: { value: PadraoMovimento; label: string }[] = [
  { value:"empurrar_horizontal", label:"Empurrar Horizontal" },
  { value:"empurrar_vertical",   label:"Empurrar Vertical"   },
  { value:"puxar_horizontal",    label:"Puxar Horizontal"    },
  { value:"puxar_vertical",      label:"Puxar Vertical"      },
  { value:"agachar",             label:"Agachar"             },
  { value:"empurrar_quadril",    label:"Empurrar Quadril"    },
  { value:"flexao_joelho",       label:"Flexão de Joelho"    },
  { value:"carregar",            label:"Carregar"            },
  { value:"rotacao",             label:"Rotação"             },
  { value:"isolamento",          label:"Isolamento"          },
];

const NIVEIS: { value: NivelExercicio; label: string; color: string }[] = [
  { value:"iniciante",     label:"Iniciante",     color:"#1D9E75" },
  { value:"intermediario", label:"Intermediário", color:"#1A56A0" },
  { value:"avancado",      label:"Avançado",      color:"#D85A30" },
];

const GRUPO_MAP = Object.fromEntries(GRUPOS.map(g => [g.value, g])) as Record<GrupoMuscular, typeof GRUPOS[0]>;
const NIVEL_COLORS = Object.fromEntries(NIVEIS.map(n => [n.value, n.color])) as Record<NivelExercicio, string>;

const BLANK = (): Omit<Exercicio,"id"> => ({
  nome:"", grupo_muscular:"peito", grupos_secundarios:[], padrao_movimento:"empurrar_horizontal",
  nivel:"iniciante", equipamento:"", bilateral:true, variacao_de:undefined, descricao:"", instrucoes:"",
});

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AdminExerciciosPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>(SEED);
  const [busca, setBusca] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState<GrupoMuscular | "">("");
  const [filtroNivel, setFiltroNivel] = useState<NivelExercicio | "">("");
  const [apenasVariacoes, setApenasVariacoes] = useState(false);
  const [modal, setModal] = useState<"criar"|"editar"|null>(null);
  const [editando, setEditando] = useState<Exercicio|null>(null);
  const [form, setForm] = useState(BLANK());
  const [confirmarDelete, setConfirmarDelete] = useState<string|null>(null);
  const [toast, setToast] = useState<string|null>(null);
  const [agruparPorGrupo, setAgruparPorGrupo] = useState(true);

  const filtrados = useMemo(() =>
    exercicios.filter(e => {
      const mBusca  = !busca       || e.nome.toLowerCase().includes(busca.toLowerCase());
      const mGrupo  = !filtroGrupo || e.grupo_muscular === filtroGrupo;
      const mNivel  = !filtroNivel || e.nivel === filtroNivel;
      const mVariac = !apenasVariacoes || !!e.variacao_de;
      return mBusca && mGrupo && mNivel && mVariac;
    }),
    [exercicios, busca, filtroGrupo, filtroNivel, apenasVariacoes]
  );

  // Agrupar por grupo muscular
  const agrupado = useMemo(() => {
    if (!agruparPorGrupo) return null;
    const g: Record<string, Exercicio[]> = {};
    filtrados.forEach(e => {
      if (!g[e.grupo_muscular]) g[e.grupo_muscular] = [];
      g[e.grupo_muscular].push(e);
    });
    return g;
  }, [filtrados, agruparPorGrupo]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500); }
  function abrirCriar() { setForm(BLANK()); setEditando(null); setModal("criar"); }
  function abrirEditar(ex: Exercicio) { setForm({...ex}); setEditando(ex); setModal("editar"); }

  function salvar() {
    if (!form.nome.trim()) return;
    if (modal === "criar") {
      setExercicios(prev => [{ ...form, id: `new-${Date.now()}` }, ...prev]);
      showToast("Exercício criado.");
    } else if (editando) {
      setExercicios(prev => prev.map(e => e.id === editando.id ? { ...form, id: editando.id } : e));
      showToast("Exercício atualizado.");
    }
    setModal(null);
  }

  function deletar(id: string) {
    setExercicios(prev => prev.filter(e => e.id !== id));
    setConfirmarDelete(null);
    showToast("Exercício removido.");
  }

  function toggleSec(g: GrupoMuscular) {
    setForm(p => ({
      ...p,
      grupos_secundarios: p.grupos_secundarios.includes(g)
        ? p.grupos_secundarios.filter(x => x !== g)
        : [...p.grupos_secundarios, g],
    }));
  }

  // Exercícios "pai" disponíveis para vincular como variação
  const paiOptions = useMemo(() =>
    exercicios.filter(e => !e.variacao_de && e.id !== editando?.id),
    [exercicios, editando]
  );

  const nomeById = (id: string) => exercicios.find(e => e.id === id)?.nome ?? id;
  const variacoes = (id: string) => exercicios.filter(e => e.variacao_de === id);

  return (
    <div className="flex flex-col min-h-dvh bg-surface">
      {/* Header */}
      <header style={{ background:"#1A56A0" }} className="px-5 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-medium">Admin</p>
            <h1 className="text-white text-xl font-bold mt-0.5">Banco de Exercícios</h1>
          </div>
          <button onClick={abrirCriar}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Novo
          </button>
        </div>
        <p className="text-white/50 text-xs mt-2">{exercicios.length} exercícios · {exercicios.filter(e=>e.variacao_de).length} com variação</p>
      </header>

      {/* Filtros */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-border">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Buscar exercício…" value={busca}
            onChange={e => setBusca(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-text placeholder:text-muted"/>
          {busca && <button onClick={() => setBusca("")} className="text-muted text-xs">✕</button>}
        </div>

        <div className="flex gap-2">
          <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value as GrupoMuscular | "")}
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-white text-sm text-text outline-none">
            <option value="">Todos os grupos</option>
            {GRUPOS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value as NivelExercicio | "")}
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-white text-sm text-text outline-none">
            <option value="">Todos os níveis</option>
            {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>

        {/* Toggles de visualização */}
        <div className="flex gap-2">
          <button onClick={() => setAgruparPorGrupo(p => !p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              agruparPorGrupo ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border bg-white text-muted"
            }`}>
            Agrupar por músculo
          </button>
          <button onClick={() => setApenasVariacoes(p => !p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              apenasVariacoes ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border bg-white text-muted"
            }`}>
            Só variações
          </button>
        </div>

        {(busca || filtroGrupo || filtroNivel || apenasVariacoes) && (
          <p className="text-xs text-muted">{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
        {filtrados.length === 0 && (
          <div className="text-center py-16 text-muted text-sm">
            <p className="text-3xl mb-3">🏋️</p>
            Nenhum exercício encontrado.
          </div>
        )}

        {agruparPorGrupo && agrupado
          ? Object.entries(agrupado).map(([grupo, itens]) => {
              const gInfo = GRUPO_MAP[grupo as GrupoMuscular];
              return (
                <div key={grupo}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{gInfo?.icon}</span>
                    <span className="text-sm font-bold text-text">{gInfo?.label ?? grupo}</span>
                    <span className="ml-auto text-xs text-muted">{itens.length} exercício{itens.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {itens.map(ex => (
                      <ExCard key={ex.id} ex={ex} exercicios={exercicios}
                        onEditar={() => abrirEditar(ex)} onDeletar={() => setConfirmarDelete(ex.id)}
                        nomeById={nomeById} variacoes={variacoes}/>
                    ))}
                  </div>
                </div>
              );
            })
          : filtrados.map(ex => (
              <ExCard key={ex.id} ex={ex} exercicios={exercicios}
                onEditar={() => abrirEditar(ex)} onDeletar={() => setConfirmarDelete(ex.id)}
                nomeById={nomeById} variacoes={variacoes}/>
            ))
        }
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{maxWidth:390,margin:"0 auto",left:"50%",transform:"translateX(-50%)"}}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)}/>
          <div className="relative w-full bg-white rounded-t-2xl flex flex-col max-h-[92dvh]">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text">{modal === "criar" ? "Novo Exercício" : "Editar Exercício"}</h3>
              <button onClick={() => setModal(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              <Field label="Nome *">
                <input type="text" value={form.nome} onChange={e => setForm(p=>({...p,nome:e.target.value}))}
                  placeholder="Ex: Supino Reto com Barra"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Grupo principal *">
                  <select value={form.grupo_muscular} onChange={e => setForm(p=>({...p,grupo_muscular:e.target.value as GrupoMuscular}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 transition-all">
                    {GRUPOS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </Field>
                <Field label="Nível *">
                  <select value={form.nivel} onChange={e => setForm(p=>({...p,nivel:e.target.value as NivelExercicio}))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 transition-all">
                    {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Grupos secundários">
                <div className="flex flex-wrap gap-2">
                  {GRUPOS.filter(g => g.value !== form.grupo_muscular).map(g => {
                    const sel = form.grupos_secundarios.includes(g.value);
                    return (
                      <button key={g.value} onClick={() => toggleSec(g.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          sel ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border bg-white text-muted"
                        }`}>{g.label}</button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Padrão de movimento *">
                <select value={form.padrao_movimento} onChange={e => setForm(p=>({...p,padrao_movimento:e.target.value as PadraoMovimento}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 transition-all">
                  {PADROES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>

              <Field label="Equipamento *">
                <input type="text" value={form.equipamento} onChange={e => setForm(p=>({...p,equipamento:e.target.value}))}
                  placeholder="Ex: barra + rack, halteres, cabo"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"/>
              </Field>

              <Field label="Execução">
                <div className="flex gap-2">
                  {[{v:true,l:"Bilateral"},{v:false,l:"Unilateral"}].map(o => (
                    <button key={String(o.v)} onClick={() => setForm(p=>({...p,bilateral:o.v}))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        form.bilateral === o.v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-border bg-white text-muted"
                      }`}>{o.l}</button>
                  ))}
                </div>
              </Field>

              {/* Variação de */}
              <Field label="É variação de (opcional)">
                <select value={form.variacao_de ?? ""} onChange={e => setForm(p=>({...p,variacao_de:e.target.value||undefined}))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 transition-all">
                  <option value="">— Exercício independente —</option>
                  {paiOptions.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
                {form.variacao_de && (
                  <p className="text-xs text-blue-600 mt-1">
                    Este exercício aparecerá como variação de <strong>{nomeById(form.variacao_de)}</strong>.
                  </p>
                )}
              </Field>

              <Field label="Descrição">
                <textarea value={form.descricao ?? ""} onChange={e => setForm(p=>({...p,descricao:e.target.value}))}
                  placeholder="Breve descrição…" rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"/>
              </Field>

              <Field label="Instruções">
                <textarea value={form.instrucoes ?? ""} onChange={e => setForm(p=>({...p,instrucoes:e.target.value}))}
                  placeholder="Passo a passo…" rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm outline-none bg-gray-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"/>
              </Field>

              <button onClick={salvar} disabled={!form.nome.trim()}
                style={{background:"#1A56A0"}}
                className="w-full text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 mt-2">
                {modal === "criar" ? "Criar exercício" : "Salvar alterações"}
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
              <h3 className="text-base font-bold text-text">Remover exercício?</h3>
              <p className="text-sm text-muted mt-1">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmarDelete(null)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-text">Cancelar</button>
              <button onClick={() => deletar(confirmarDelete)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{background:"#D85A30"}}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{background:"#1D9E75"}}>✓ {toast}</div>
      )}
    </div>
  );
}

/* ─── ExCard ──────────────────────────────────────────────────────────────── */
function ExCard({ ex, exercicios, onEditar, onDeletar, nomeById, variacoes }: {
  ex: Exercicio;
  exercicios: Exercicio[];
  onEditar: () => void;
  onDeletar: () => void;
  nomeById: (id: string) => string;
  variacoes: (id: string) => Exercicio[];
}) {
  const [aberto, setAberto] = useState(false);
  const nivelColor = NIVEL_COLORS[ex.nivel];
  const vars = variacoes(ex.id);

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${ex.variacao_de ? "border-blue-100" : "border-border"}`}>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {ex.variacao_de && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{background:"#DBEAFE",color:"#1E40AF"}}>
                  VAR
                </span>
              )}
              <p className="text-sm font-bold text-text truncate">{ex.nome}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="px-2 py-0.5 rounded-md text-xs font-medium text-white" style={{background:nivelColor}}>
                {ex.nivel === "intermediario" ? "Interm." : ex.nivel.charAt(0).toUpperCase() + ex.nivel.slice(1)}
              </span>
              <span className="text-xs text-muted">{ex.bilateral ? "Bilateral" : "Unilateral"}</span>
              {vars.length > 0 && (
                <span className="text-xs text-muted">· {vars.length} variação{vars.length > 1 ? "ões" : ""}</span>
              )}
            </div>
            {ex.variacao_de && (
              <p className="text-[11px] text-blue-500 mt-1">↩ {nomeById(ex.variacao_de)}</p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onEditar}
              className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onClick={onDeletar}
              className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
            </button>
            <button onClick={() => setAberto(p => !p)}
              className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${aberto ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {aberto && (
        <div className="border-t border-gray-50 px-4 py-3 flex flex-col gap-2">
          <Row label="Padrão">{PADROES.find(p => p.value === ex.padrao_movimento)?.label ?? ex.padrao_movimento}</Row>
          <Row label="Equipamento">{ex.equipamento}</Row>
          {ex.grupos_secundarios.length > 0 && (
            <Row label="Secundários">{ex.grupos_secundarios.map(g => GRUPO_MAP[g]?.label ?? g).join(", ")}</Row>
          )}
          {vars.length > 0 && (
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wide mb-1.5">Variações</p>
              <div className="flex flex-col gap-1">
                {vars.map(v => (
                  <div key={v.id} className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-lg">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{background:"#DBEAFE",color:"#1E40AF"}}>VAR</span>
                    <span className="text-xs text-text">{v.nome}</span>
                    <span className="ml-auto text-[10px] text-muted">{v.nivel === "intermediario" ? "Interm." : v.nivel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ex.descricao && (
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wide mb-1">Descrição</p>
              <p className="text-sm text-text leading-relaxed">{ex.descricao}</p>
            </div>
          )}
          {ex.instrucoes && (
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wide mb-1">Instruções</p>
              <p className="text-sm text-text leading-relaxed">{ex.instrucoes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-text">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted font-medium w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-text flex-1">{children}</span>
    </div>
  );
}
