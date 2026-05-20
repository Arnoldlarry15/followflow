import { getLlmStatus } from "../lib/llm.js";

interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body: string): void;
}

function sendJson(response: ApiResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    sendJson(response, 200, await getLlmStatus());
  } catch (error) {
    console.error("LLM status error:", error);
    sendJson(response, 200, {
      defaultProvider: "ollama",
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        model: process.env.OLLAMA_MODEL || "qwen2.5:7b",
        reachable: false,
        modelAvailable: false,
        installedModels: [],
      },
      openai: {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        configured: Boolean(process.env.OPENAI_API_KEY),
      },
      anthropic: {
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
        configured: Boolean(process.env.ANTHROPIC_API_KEY),
      },
      gemini: {
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        configured: Boolean(process.env.GEMINI_API_KEY),
      },
      groq: {
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        configured: Boolean(process.env.GROQ_API_KEY),
      },
      error: "Failed to load LLM status.",
    });
  }
}
