import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateDraft, getLlmStatus, isLlmProvider } from "./lib/llm";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // --- API Routes ---
  app.get("/api/llm-status", async (_req, res) => {
    res.json(await getLlmStatus());
  });

  app.post("/api/draft", async (req, res) => {
    try {
      const { leadContext, provider } = req.body as {
        leadContext?: unknown;
        provider?: unknown;
      };

      if (!leadContext) {
        res.status(400).json({ error: "leadContext is required." });
        return;
      }

      res.json(
        await generateDraft({
          leadContext,
          provider: isLlmProvider(provider) ? provider : undefined,
        }),
      );
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
