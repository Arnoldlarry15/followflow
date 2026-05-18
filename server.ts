import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

type LlmProvider = "ollama" | "openai" | "anthropic" | "gemini";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";

const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
const defaultProvider: LlmProvider = hasOpenAiKey
  ? "openai"
  : hasAnthropicKey
    ? "anthropic"
    : hasGeminiKey
      ? "gemini"
    : "ollama";

function buildDraftPrompt(leadContext: unknown): string {
  return `You are FollowFlow, an AI-powered follow-up and lead management assistant.
Write a professional, concise, and friendly follow-up email/message based on the following lead context:
${JSON.stringify(leadContext)}

Make it sound natural and helpful, not overly salesy. Only return the email draft, nothing else.`;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
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
      model: OPENAI_MODEL,
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

async function generateWithAnthropic(prompt: string): Promise<string> {
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
      model: ANTHROPIC_MODEL,
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

async function generateWithGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to use this provider.");
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
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

async function generateWithOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
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

function resolveProvider(provider?: LlmProvider): LlmProvider {
  if (provider === "openai" && hasOpenAiKey) {
    return "openai";
  }

  if (provider === "anthropic" && hasAnthropicKey) {
    return "anthropic";
  }

  if (provider === "gemini" && hasGeminiKey) {
    return "gemini";
  }

  if (provider === "ollama") {
    return "ollama";
  }

  return defaultProvider;
}

async function checkOllamaStatus(): Promise<{ reachable: boolean; models: string[] }> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  app.get("/api/llm-status", async (_req, res) => {
    const ollama = await checkOllamaStatus();
    res.json({
      defaultProvider,
      ollama: {
        baseUrl: OLLAMA_BASE_URL,
        model: OLLAMA_MODEL,
        reachable: ollama.reachable,
        modelAvailable: ollama.models.includes(OLLAMA_MODEL),
        installedModels: ollama.models,
      },
      openai: {
        model: OPENAI_MODEL,
        configured: hasOpenAiKey,
      },
      anthropic: {
        model: ANTHROPIC_MODEL,
        configured: hasAnthropicKey,
      },
      gemini: {
        model: GEMINI_MODEL,
        configured: hasGeminiKey,
      },
    });
  });

  app.post("/api/draft", async (req, res) => {
    try {
      const { leadContext, provider } = req.body as {
        leadContext?: unknown;
        provider?: LlmProvider;
      };

      if (!leadContext) {
        res.status(400).json({ error: "leadContext is required." });
        return;
      }

      const normalizedProvider = resolveProvider(provider);
      const prompt = buildDraftPrompt(leadContext);

      const draft =
        normalizedProvider === "openai"
          ? await generateWithOpenAI(prompt)
          : normalizedProvider === "anthropic"
            ? await generateWithAnthropic(prompt)
            : normalizedProvider === "gemini"
              ? await generateWithGemini(prompt)
            : await generateWithOllama(prompt);

      res.json({
        draft,
        provider: normalizedProvider,
        model:
          normalizedProvider === "openai"
            ? OPENAI_MODEL
            : normalizedProvider === "anthropic"
              ? ANTHROPIC_MODEL
              : normalizedProvider === "gemini"
                ? GEMINI_MODEL
              : OLLAMA_MODEL,
      });
    } catch (error) {
      console.error("Draft generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate draft.",
      });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
