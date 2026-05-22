import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

export interface ExtractedReadableArticle {
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  markdownContent: string | null;
  textContent: string | null;
  wordCount: number | null;
}

export function extractReadableArticle(
  html: string,
  url: string
): ExtractedReadableArticle {
  const dom = new JSDOM(html, {
    url
  });

  try {
    const article = new Readability(dom.window.document).parse();

    if (!article) {
      throw new Error("Readable article could not be extracted");
    }

    const textContent = normalizeText(article.textContent);
    const markdownContent = article.content
      ? new TurndownService({
          codeBlockStyle: "fenced",
          headingStyle: "atx"
        })
          .turndown(article.content)
          .trim()
      : null;

    return {
      title: normalizeText(article.title),
      byline: normalizeText(article.byline),
      excerpt: normalizeText(article.excerpt),
      markdownContent,
      textContent,
      wordCount: textContent ? countWords(textContent) : null
    };
  } finally {
    dom.window.close();
  }
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function countWords(value: string) {
  const latinWordCount = value.split(/\s+/).filter(Boolean).length;
  const cjkCount = value.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  return Math.max(latinWordCount, cjkCount);
}
