import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é o Consultor IA do PersoNutri — um especialista em nutrição esportiva e treinamento para hipertrofia muscular, baseado exclusivamente em evidências científicas peer-reviewed.

SUAS DIRETRIZES:
- Responda sempre em português brasileiro, de forma clara e direta
- Baseie todas as recomendações em estudos científicos (cite autor + ano quando relevante)
- Seja específico e prático — evite respostas genéricas
- Adapte as respostas ao contexto de hipertrofia muscular
- Quando mencionar estudos, use formato: "Schoenfeld et al. (2017)"
- Não substitua consultas médicas — sinalize quando necessário
- Mantenha respostas concisas (máx. 3-4 parágrafos)
- Ao final de respostas longas, destaque 1-2 referências principais

ÁREAS DE EXPERTISE:
- Periodização e programação de treino
- Nutrição para hipertrofia (proteína, carbs, timing)
- Recuperação e sono
- Suplementação baseada em evidências
- Progressão de carga e volume
- Deload e prevenção de overtraining`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada." }, { status: 500 });
  }

  try {
    const { messages, perfil } = await req.json();

    // Injeta contexto do perfil do usuário no system prompt se disponível
    const systemFinal = perfil
      ? `${SYSTEM_PROMPT}\n\nCONTEXTO DO USUÁRIO:\n${JSON.stringify(perfil, null, 2)}`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemFinal,
      messages: messages.map((m: { role: string; text: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extrai referências do formato "Autor et al. (YYYY)"
    const sources = [...text.matchAll(/[\w\s]+et al\.\s*\(?\d{4}\)?/g)].map(m => m[0].trim()).slice(0, 3);

    return NextResponse.json({ text, sources });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
