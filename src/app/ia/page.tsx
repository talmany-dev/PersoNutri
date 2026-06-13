"use client";

import { useState, useRef, useEffect } from "react";
import { BottomNav, ScreenHeader, Badge } from "@/components/ui";

interface Message {
  role: "user" | "ai";
  text: string;
  sources?: string[];
}

const GREETING: Message = {
  role: "ai",
  text: "Olá! Sou o consultor IA do PersoNutri, baseado em evidências científicas. Posso te ajudar com dúvidas sobre treino, nutrição, recuperação e periodização. O que você quer saber?",
};

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    // Placeholder até integração com API real
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          text: "Boa pergunta! Com base no seu histórico e perfil, a recomendação é garantir consistência no volume semanal e progressão de carga. Para uma resposta personalizada, a integração com IA em tempo real estará disponível em breve.",
          sources: ["Schoenfeld et al., 2017"],
        },
      ]);
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="flex flex-col min-h-dvh pb-20" style={{ background: "#F7F7F7", maxWidth: 390, margin: "0 auto" }}>
      <ScreenHeader title="Consultor IA" subtitle="Baseado em evidências" />

      {/* Messages */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-3 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "ai" ? (
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-3.5 flex flex-col gap-2"
                style={{ background: "#fff", border: "0.5px solid #E5E5E5" }}>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1A1A" }}>{msg.text}</p>
                {msg.sources && (
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
        <div ref={bottomRef} />
      </div>

      {/* Input fixo acima do BottomNav */}
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
