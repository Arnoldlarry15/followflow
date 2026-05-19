import { getLlmStatus } from "../lib/llm";

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
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Failed to load LLM status.",
    });
  }
}
