import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada." }, { status: 500 });
  }

  try {
    const perfil = await req.json();

    const prompt = `Você é um especialista em fisiologia do exercício e nutrição esportiva baseada em evidências.

Com base no perfil abaixo, gere recomendações personalizadas de treino e nutrição para HIPERTROFIA MUSCULAR.

PERFIL DO USUÁRIO:
${JSON.stringify(perfil, null, 2)}

Retorne EXATAMENTE o JSON abaixo, sem markdown, sem texto extra — apenas o JSON:

{
  "treino": {
    "divisao": "<nome da divisão recomendada>",
    "justificativa": "<2-3 frases explicando por que essa divisão é ideal para o perfil>",
    "estrutura_semanal": ["<Dia 1: Descrição>", "<Dia 2: Descrição>", ...],
    "volume_recomendado": "<ex: 16-20 séries semanais por grupo prioritário>",
    "progressao": "<estratégia de progressão de carga para o nível do usuário>",
    "dicas": ["<dica baseada em evidências 1>", "<dica 2>", "<dica 3>"]
  },
  "nutricao": {
    "distribuicao_macros": "<comentário sobre a distribuição calculada: proteína/carb/gordura>",
    "timing_pre_treino": "<o que comer e quando antes do treino, considerando o horário informado>",
    "timing_pos_treino": "<janela pós-treino e recomendações>",
    "alimentos_prioritarios": ["<alimento 1 - motivo>", "<alimento 2 - motivo>", "<alimento 3 - motivo>", "<alimento 4 - motivo>"],
    "estrategia_proteina": "<como atingir a meta proteica distribuída nas refeições>",
    "dicas": ["<dica nutricional 1>", "<dica 2>", "<dica 3>"]
  },
  "resumo": "<1-2 frases resumindo o plano integrado treino + nutrição>",
  "referencias": ["<referência científica 1>", "<referência 2>"]
}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    // Extrai JSON mesmo se vier com markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Resposta não contém JSON válido");

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
