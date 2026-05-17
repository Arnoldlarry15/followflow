import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  app.post("/api/draft", async (req, res) => {
    try {
      const { leadContext } = req.body;
      const prompt = `You are FollowFlow, an AI-powered follow-up and lead management assistant.
Write a professional, concise, and friendly follow-up email/message based on the following lead context:
${JSON.stringify(leadContext)}

Make it sound natural and helpful, not overly salesy. Only return the email draft, nothing else.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite", // Fast and efficient for simple text drafts
        contents: prompt,
      });

      res.json({ draft: response.text });
    } catch (error) {
      console.error("Draft generation error:", error);
      res.status(500).json({ error: "Failed to generate draft." });
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
