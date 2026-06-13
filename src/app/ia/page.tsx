"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNav, ScreenHeader, Badge } from "@/components/ui";

interface Message {
  id?: string;
  role: "user" | "ai";
  text: string;
  sources?: string[];
}

// Quantas mensagens recentes enviar como contexto para a IA
const CONTEXT_WINDOW = 6;

const GREETING: Message = {
  role: "ai",
  text: "Olá! Sou o consultor IA do PersoNutri, baseado em evidências científicas. Posso te ajudar com dúvidas sobre treino, nutrição, recuperação e periodização. O que você quer saber?",
};

export default function IAPage() {
  const [messages, setMessages]   = useState<Message[]>([GREETING]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [perfil, setPerfil]       = useState<Record<string, unknown> | null>(null);
  const [userId, setUserId]       = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Carrega perfil e histórico do usuário
  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setHistLoading(false); return; }
    setUserId(user.id);

    // Perfil para contexto da IA
    const { data: perfilData } = await supabase
      .from("users")
      .select("nome,idade,peso_kg,altura_cm,objetivo,nivel_atividade,proteina_g,meta_calorica,divisao_preferida,estilo_alimentar,restricoes_alimentares")
      .eq("id", user.id)
      .single();
    if (perfilData) setPerfil(perfilData);

    // Histórico de mensagens (últimas 60, ordem cronológica)
    const { data: hist } = await supabase
      .from("chat_mensagens")
      .select("id,role,content,sources")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(60);

    if (hist?.length) {
      const histMsgs: Message[] = hist.map(m => ({
        id:      m.id,
        role:    m.role as "user" | "ai",
        text:    m.content,
        sources: m.sources ?? [],
      }));
      setMessages([GREETING, ...histMsgs]);
    }

    setHistLoading(false);
  }, []);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function saveMessage(msg: Omit<Message, "id">, uid: string): Promise<string | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_mensagens")
      .insert({
        user_id: uid,
        role:    msg.role,
        content: msg.text,
        sources: msg.sources ?? [],
      })
      .select("id")
      .single();
    return data?.id ?? null;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    // Salva mensagem do usuário no Supabase (sem bloquear o fluxo)
    let userMsgId: string | null = null;
    if (userId) {
      userMsgId = await saveMessage(userMsg, userId);
      if (userMsgId) {
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, id: userMsgId! } : m
        ));
      }
    }

    // Contexto para a IA: apenas as últimas CONTEXT_WINDOW mensagens reais (sem greeting)
    const histReal = updatedMessages.filter(m => m !== GREETING);
    const contextMessages = histReal.slice(-CONTEXT_WINDOW);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: contextMessages, perfil }),
      });

      const data = await res.json();

      const aiMsg: Message = data.error
        ? { role: "ai", text: "Desculpe, houve um erro ao processar sua pergunta. Tente novamente." }
        : { role: "ai", text: data.text, sources: data.sources?.length ? data.sources : undefined };

      setMessages(prev => [...prev, aiMsg]);

      // Salva resposta da IA no Supabase
      if (userId && !data.error) {
        const aiMsgId = await saveMessage(aiMsg, userId);
        if (aiMsgId) {
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, id: aiMsgId } : m
          ));
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
      }]);
    }

    setLoading(false);
  }

  async function clearHistory() {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("chat_mensagens").delete().eq("user_id", userId);
    setMessages([GREETING]);
  }

  return (
    <div className="flex flex-col min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      {/* Header com botão limpar */}
      <div className="flex items-center justify-between px-5 pt-safe" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <ScreenHeader title="Consultor IA" subtitle="Baseado em evidências" />
        {messages.length > 1 && (
          <button
            onClick={clearHistory}
            className="text-xs px-3 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: "#F3F4F6", color: "#999", marginTop: 8 }}>
            Limpar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-3 overflow-y-auto" style={{ paddingBottom: 80 }}>

        {histLoading && (
          <div className="flex justify-center py-4">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#CCC", animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id ?? i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" ? (
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-3.5 flex flex-col gap-2"
                style={{ background: "#fff", border: "0.5px solid #E5E5E5" }}>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.sources.map(s => <Badge key={s} text={s} color="#1D9E75" />)}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3" style={{ background: "#1A56A0" }}>
                <p className="text-sm leading-relaxed text-white">{msg.text}</p>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "#fff", border: "0.5px solid #E5E5E5" }}>
              <div className="flex gap-1 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#999", animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Indicador sutil de janela de contexto */}
        {messages.filter(m => m !== GREETING).length > CONTEXT_WINDOW && (
          <div className="flex justify-center">
            <span className="text-[11px] px-3 py-1 rounded-full" style={{ background: "#F0F0F0", color: "#BBB" }}>
              IA usa as últimas {CONTEXT_WINDOW} mensagens como contexto
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full px-4 py-2"
        style={{ maxWidth: 390, bottom: "calc(56px + env(safe-area-inset-bottom, 0px))", background: "#F7F7F7", borderTop: "0.5px solid #E5E5E5" }}>
        <div className="flex gap-2 items-center">
          <input
            type="text" placeholder="Digite sua dúvida…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-xl text-sm px-4 py-3 outline-none"
            style={{ background: "#fff", border: "0.5px solid #E5E5E5", color: "#1A1A1A" }}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
            style={{ background: "#1A56A0" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <BottomNav active="ia" />
    </div>
  );
}
