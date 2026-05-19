import { GoogleGenAI } from "@google/genai";

export type LlmProvider = "ollama" | "openai" | "anthropic" | "gemini" | "groq";
const DEFAULT_GROQ_TIMEOUT_MS = 30000;

interface ProviderConfig {
  geminiModel: string;
  groqModel: string;
  groqApiKey?: string;
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

function getEnvValue(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
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
  const groqApiKey = getEnvValue(
    "GROQ_API_KEY",
    "GROW_API_KEY",
    "GROQ_KEY",
    "VITE_GROQ_API_KEY",
    "NEXT_PUBLIC_GROQ_API_KEY",
  );
  const hasGroqKey = Boolean(groqApiKey);
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
    groqApiKey,
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
  if (!config.groqApiKey) {
    throw new Error(
      "Groq is not configured. Add GROQ_API_KEY (or GROW_API_KEY/GROQ_KEY/VITE_GROQ_API_KEY) to use this provider.",
    );
  }

  const configuredTimeout = process.env.GROQ_TIMEOUT_MS
    ? Number.parseInt(process.env.GROQ_TIMEOUT_MS, 10)
    : DEFAULT_GROQ_TIMEOUT_MS;
  const timeoutMs =
    Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : DEFAULT_GROQ_TIMEOUT_MS;
  let response: Response;

  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.groqApiKey}`,
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
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Groq request failed before completion: ${errorMessage}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  const text = extractTextFromContent(content);

  if (!text) {
    throw new Error("Groq returned an empty response.");
  }

  return text;
}

function extractTextFromContent(content: string | Array<{ text?: string }> | null | undefined): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
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
  if (!provider) {
    return config.defaultProvider;
  }

  if (provider === "openai") {
    if (!config.hasOpenAiKey) {
      throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to use this provider.");
    }
    return "openai";
  }

  if (provider === "anthropic") {
    if (!config.hasAnthropicKey) {
      throw new Error("Anthropic is not configured. Add ANTHROPIC_API_KEY to use this provider.");
    }
    return "anthropic";
  }

  if (provider === "gemini") {
    if (!config.hasGeminiKey) {
      throw new Error("Gemini is not configured. Add GEMINI_API_KEY to use this provider.");
    }
    return "gemini";
  }

  if (provider === "groq") {
    if (!config.hasGroqKey) {
      throw new Error(
        "Groq is not configured. Add GROQ_API_KEY (or GROW_API_KEY/GROQ_KEY/VITE_GROQ_API_KEY) to use this provider.",
      );
    }
    return "groq";
  }

  if (provider === "ollama") {
    return "ollama";
  }

  throw new Error(`Unsupported LLM provider: ${String(provider)}`);
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
