import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

export type LlmProvider = "ollama" | "openai" | "anthropic" | "gemini" | "groq";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
export const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";

export const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
export const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
export const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
export const hasGroqKey = Boolean(process.env.GROQ_API_KEY);

// Fallback order: OpenAI → Anthropic → Gemini → Groq (free) → Ollama
export const defaultProvider: LlmProvider = hasOpenAiKey
  ? "openai"
  : hasAnthropicKey
    ? "anthropic"
    : hasGeminiKey
      ? "gemini"
      : hasGroqKey
        ? "groq"
        : "ollama";

export function buildDraftPrompt(leadContext: unknown): string {
  return `You are FollowFlow, an AI-powered follow-up and lead management assistant.
Write a professional, concise, and friendly follow-up email/message based on the following lead context:
${JSON.stringify(leadContext)}

Make it sound natural and helpful, not overly salesy. Only return the email draft, nothing else.`;
}

export async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI is not configured. Add OPENAI_API_KEY to use this provider."
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are FollowFlow, an AI-powered follow-up and lead management assistant.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty response.");
  return text;
}

export async function generateWithAnthropic(prompt: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Anthropic is not configured. Add ANTHROPIC_API_KEY to use this provider."
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system:
        "You are FollowFlow, an AI-powered follow-up and lead management assistant.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Anthropic request failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content
    ?.filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) throw new Error("Anthropic returned an empty response.");
  return text;
}

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Gemini is not configured. Add GEMINI_API_KEY to use this provider."
    );
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { temperature: 0.7 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

export async function generateWithGroq(prompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "Groq is not configured. Add GROQ_API_KEY to use this provider. " +
        "Get a free key at https://console.groq.com"
    );
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are FollowFlow, an AI-powered follow-up and lead management assistant.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned an empty response.");
  return text;
}

export async function generateWithOllama(prompt: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    });
  } catch (err) {
    throw new Error(
      `Cannot reach Ollama at ${OLLAMA_BASE_URL}. ` +
        `On Vercel, Ollama must be accessible via a public URL — ` +
        `expose your local Ollama with a tool like ngrok and set OLLAMA_BASE_URL in Vercel environment variables.`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) throw new Error("Ollama returned an empty response.");
  return data.response.trim();
}

export function resolveProvider(provider?: LlmProvider): LlmProvider {
  if (provider === "openai" && hasOpenAiKey) return "openai";
  if (provider === "anthropic" && hasAnthropicKey) return "anthropic";
  if (provider === "gemini" && hasGeminiKey) return "gemini";
  if (provider === "groq" && hasGroqKey) return "groq";
  if (provider === "ollama") return "ollama";
  return defaultProvider;
}

export async function generate(
  provider: LlmProvider,
  prompt: string
): Promise<string> {
  switch (provider) {
    case "openai":
      return generateWithOpenAI(prompt);
    case "anthropic":
      return generateWithAnthropic(prompt);
    case "gemini":
      return generateWithGemini(prompt);
    case "groq":
      return generateWithGroq(prompt);
    default:
      return generateWithOllama(prompt);
  }
}

export function modelForProvider(provider: LlmProvider): string {
  switch (provider) {
    case "openai":
      return OPENAI_MODEL;
    case "anthropic":
      return ANTHROPIC_MODEL;
    case "gemini":
      return GEMINI_MODEL;
    case "groq":
      return GROQ_MODEL;
    default:
      return OLLAMA_MODEL;
  }
}

export async function checkOllamaStatus(): Promise<{
  reachable: boolean;
  models: string[];
}> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return { reachable: false, models: [] };

    const data = (await response.json()) as {
      models?: Array<{ name?: string }>;
    };
    const models = (data.models || [])
      .map((m) => m.name)
      .filter((name): name is string => Boolean(name));

    return { reachable: true, models };
  } catch {
    return { reachable: false, models: [] };
  }
}
