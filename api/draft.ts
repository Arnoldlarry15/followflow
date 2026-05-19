import { generateDraft, isLlmProvider } from "../lib/llm";

interface ApiRequest {
  method?: string;
  body?: unknown;
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

function parseJsonBody(body: unknown): { leadContext?: unknown; provider?: unknown } {
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as { leadContext?: unknown; provider?: unknown };
    } catch {
      throw new Error("Invalid JSON body.");
    }
  }

  if (body instanceof Uint8Array) {
    try {
      return JSON.parse(Buffer.from(body).toString("utf8")) as { leadContext?: unknown; provider?: unknown };
    } catch {
      throw new Error("Invalid JSON body.");
    }
  }

  if (body && typeof body === "object") {
    return body as { leadContext?: unknown; provider?: unknown };
  }

  return {};
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const { leadContext, provider } = parseJsonBody(request.body);

    if (!leadContext) {
      sendJson(response, 400, { error: "leadContext is required." });
      return;
    }

    sendJson(
      response,
      200,
      await generateDraft({
        leadContext,
        provider: isLlmProvider(provider) ? provider : undefined,
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid JSON body.") {
      sendJson(response, 400, { error: "Invalid JSON body." });
      return;
    }

    console.error("Draft generation error:", error);
    sendJson(response, 500, {
      error: "Failed to generate draft.",
    });
  }
}
