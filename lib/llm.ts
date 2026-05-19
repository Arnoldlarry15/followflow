import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

export type LlmProvider = "ollama" | "openai" | "anthropic" | "gemini" | "groq";

interface ProviderConfig {
  geminiModel: string;
  groqModel: string;
  openAiModel: string;
  anthropicModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  hasGeminiKey: boolean;
  hasGroqKey: boolean;
  hasOpenAiKey: boolean;
  hasAnthropicKey: boolean;
  defaultProvider: LlmProvider;
}

export interface LlmStatusResponse {
  defaultProvider: LlmProvider;
  ollama: {
    baseUrl: string;
    model: string;
    reachable: boolean;
    modelAvailable: boolean;
    installedModels: string[];
  };
  openai: {
    model: string;
    configured: boolean;
  };
  anthropic: {
    model: string;
    configured: boolean;
  };
  gemini: {
    model: string;
    configured: boolean;
  };
  groq: {
    model: string;
    configured: boolean;
  };
}

function getProviderConfig(): ProviderConfig {
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const openAiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:7b";

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const hasGroqKey = Boolean(process.env.GROQ_API_KEY);
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);

  let defaultProvider: LlmProvider = "ollama";

  if (hasOpenAiKey) {
    defaultProvider = "openai";
  } else if (hasAnthropicKey) {
    defaultProvider = "anthropic";
  } else if (hasGeminiKey) {
    defaultProvider = "gemini";
  } else if (hasGroqKey) {
    defaultProvider = "groq";
  }

  return {
    geminiModel,
    groqModel,
    openAiModel,
    anthropicModel,
    ollamaBaseUrl,
    ollamaModel,
    hasGeminiKey,
    hasGroqKey,
    hasOpenAiKey,
    hasAnthropicKey,
    defaultProvider,
  };
}

function buildDraftPrompt(leadContext: unknown): string {
  return `You are FollowFlow, an AI-powered follow-up and lead management assistant.
Write a professional, concise, and friendly follow-up email/message based on the following lead context:
${JSON.stringify(leadContext)}

Make it sound natural and helpful, not overly salesy. Only return the email draft, nothing else.`;
}

async function generateWithOpenAI(prompt: string, config: ProviderConfig): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to use this provider.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.openAiModel,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are FollowFlow, an AI-powered follow-up and lead management assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
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

  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return text;
}

async function generateWithAnthropic(prompt: string, config: ProviderConfig): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Anthropic is not configured. Add ANTHROPIC_API_KEY to use this provider.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      max_tokens: 1024,
      system: "You are FollowFlow, an AI-powered follow-up and lead management assistant.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content
    ?.filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return text;
}

async function generateWithGemini(prompt: string, config: ProviderConfig): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to use this provider.");
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: config.geminiModel,
    contents: prompt,
    config: {
      temperature: 0.7,
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

async function generateWithGroq(prompt: string, config: ProviderConfig): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq is not configured. Add GROQ_API_KEY to use this provider.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.groqModel,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are FollowFlow, an AI-powered follow-up and lead management assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Groq returned an empty response.");
  }

  return text;
}

async function generateWithOllama(prompt: string, config: ProviderConfig): Promise<string> {
  const response = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.ollamaModel,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) {
    throw new Error("Ollama returned an empty response.");
  }

  return data.response.trim();
}

function resolveProvider(provider: LlmProvider | undefined, config: ProviderConfig): LlmProvider {
  if (provider === "openai" && config.hasOpenAiKey) {
    return "openai";
  }

  if (provider === "anthropic" && config.hasAnthropicKey) {
    return "anthropic";
  }

  if (provider === "gemini" && config.hasGeminiKey) {
    return "gemini";
  }

  if (provider === "groq" && config.hasGroqKey) {
    return "groq";
  }

  if (provider === "ollama") {
    return "ollama";
  }

  return config.defaultProvider;
}

function getModelForProvider(provider: LlmProvider, config: ProviderConfig): string {
  switch (provider) {
    case "openai":
      return config.openAiModel;
    case "anthropic":
      return config.anthropicModel;
    case "gemini":
      return config.geminiModel;
    case "groq":
      return config.groqModel;
    case "ollama":
    default:
      return config.ollamaModel;
  }
}

async function checkOllamaStatus(baseUrl: string): Promise<{ reachable: boolean; models: string[] }> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return { reachable: false, models: [] };
    }

    const data = (await response.json()) as {
      models?: Array<{ name?: string }>;
    };

    const models = (data.models || [])
      .map((model) => model.name)
      .filter((name): name is string => Boolean(name));

    return { reachable: true, models };
  } catch {
    return { reachable: false, models: [] };
  }
}

export function isLlmProvider(value: unknown): value is LlmProvider {
  return value === "ollama" || value === "openai" || value === "anthropic" || value === "gemini" || value === "groq";
}

export async function getLlmStatus(): Promise<LlmStatusResponse> {
  const config = getProviderConfig();
  const ollama = await checkOllamaStatus(config.ollamaBaseUrl);

  return {
    defaultProvider: config.defaultProvider,
    ollama: {
      baseUrl: config.ollamaBaseUrl,
      model: config.ollamaModel,
      reachable: ollama.reachable,
      modelAvailable: ollama.models.includes(config.ollamaModel),
      installedModels: ollama.models,
    },
    openai: {
      model: config.openAiModel,
      configured: config.hasOpenAiKey,
    },
    anthropic: {
      model: config.anthropicModel,
      configured: config.hasAnthropicKey,
    },
    gemini: {
      model: config.geminiModel,
      configured: config.hasGeminiKey,
    },
    groq: {
      model: config.groqModel,
      configured: config.hasGroqKey,
    },
  };
}

export async function generateDraft(input: {
  leadContext: unknown;
  provider?: LlmProvider;
}): Promise<{ draft: string; provider: LlmProvider; model: string }> {
  const config = getProviderConfig();
  const normalizedProvider = resolveProvider(input.provider, config);
  const prompt = buildDraftPrompt(input.leadContext);
  let draft: string;

  switch (normalizedProvider) {
    case "openai":
      draft = await generateWithOpenAI(prompt, config);
      break;
    case "anthropic":
      draft = await generateWithAnthropic(prompt, config);
      break;
    case "gemini":
      draft = await generateWithGemini(prompt, config);
      break;
    case "groq":
      draft = await generateWithGroq(prompt, config);
      break;
    case "ollama":
    default:
      draft = await generateWithOllama(prompt, config);
      break;
  }

  return {
    draft,
    provider: normalizedProvider,
    model: getModelForProvider(normalizedProvider, config),
  };
}
