import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  ANTHROPIC_MODEL,
  GEMINI_MODEL,
  GROQ_MODEL,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  OPENAI_MODEL,
  buildDraftPrompt,
  checkOllamaStatus,
  defaultProvider,
  generate,
  hasAnthropicKey,
  hasGeminiKey,
  hasGroqKey,
  hasOpenAiKey,
  modelForProvider,
  resolveProvider,
} from "./api/_lib.js";

// Allow 60 requests per minute per IP for general routes.
const generalLimiter = rateLimit({ windowMs: 60_000, max: 60 });
// Stricter limit on LLM generation (each call hits an external AI service).
const draftLimiter = rateLimit({ windowMs: 60_000, max: 10 });

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(generalLimiter);

  // --- API Routes ---
  app.get("/api/llm-status", async (_req, res) => {
    const ollama = await checkOllamaStatus();
    res.json({
      defaultProvider,
      groq: {
        model: GROQ_MODEL,
        configured: hasGroqKey,
      },
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

  app.post("/api/draft", draftLimiter, async (req, res) => {
    try {
      const { leadContext, provider } = req.body as {
        leadContext?: unknown;
        provider?: string;
      };

      if (!leadContext) {
        res.status(400).json({ error: "leadContext is required." });
        return;
      }

      const normalizedProvider = resolveProvider(
        provider as Parameters<typeof resolveProvider>[0]
      );
      const prompt = buildDraftPrompt(leadContext);
      const draft = await generate(normalizedProvider, prompt);

      res.json({
        draft,
        provider: normalizedProvider,
        model: modelForProvider(normalizedProvider),
      });
    } catch (error) {
      console.error("Draft generation error:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to generate draft.",
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
