import { generateDraft, isConfigurationError, isLlmProvider } from "../lib/llm.js";

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body: string): void;
}

class InvalidJsonError extends Error {
  constructor() {
    super("Invalid JSON body.");
    this.name = "InvalidJsonError";
  }
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
      throw new InvalidJsonError();
    }
  }

  if (body instanceof Uint8Array) {
    try {
      return JSON.parse(Buffer.from(body).toString("utf8")) as { leadContext?: unknown; provider?: unknown };
    } catch {
      throw new InvalidJsonError();
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
    if (error instanceof InvalidJsonError) {
      sendJson(response, 400, { error: error.message });
      return;
    }

    console.error("Draft generation error:", error);
    sendJson(response, isConfigurationError(error) ? 503 : 500, {
      error: error instanceof Error ? error.message : "Failed to generate draft.",
    });
  }
}
