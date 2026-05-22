import { assertPublicHttpUrl } from "./ssrf-guard";

export class SafeFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeFetchError";
  }
}

export interface SafeFetchTextOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

export interface SafeFetchTextResult {
  finalUrl: string;
  contentType: string | null;
  text: string;
}

export async function safeFetchText(
  input: string,
  options: SafeFetchTextOptions = {}
): Promise<SafeFetchTextResult> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const maxBytes = options.maxBytes ?? 2 * 1024 * 1024;
  const maxRedirects = options.maxRedirects ?? 5;
  let currentUrl = (await assertPublicHttpUrl(input)).toString();

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "user-agent": "MyRSS/0.1"
        }
      });

      if (isRedirect(response.status)) {
        const location = response.headers.get("location");

        if (!location) {
          throw new SafeFetchError("Redirect response is missing a location");
        }

        currentUrl = (
          await assertPublicHttpUrl(new URL(location, currentUrl).toString())
        ).toString();
        continue;
      }

      if (!response.ok) {
        throw new SafeFetchError(`Fetch failed with ${response.status}`);
      }

      const contentType = response.headers.get("content-type");

      if (contentType && !isSupportedContentType(contentType)) {
        throw new SafeFetchError(`Unsupported content type: ${contentType}`);
      }

      return {
        finalUrl: currentUrl,
        contentType,
        text: await readResponseText(response, maxBytes)
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new SafeFetchError("Fetch timed out");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new SafeFetchError("Too many redirects");
}

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

function isSupportedContentType(contentType: string) {
  const lower = contentType.toLowerCase();
  return (
    lower.includes("text/html") ||
    lower.includes("application/xhtml+xml") ||
    lower.includes("text/plain")
  );
}

async function readResponseText(response: Response, maxBytes: number) {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    received += value.byteLength;

    if (received > maxBytes) {
      throw new SafeFetchError("Response body is too large");
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8").decode(bytes);
}
