const TRACKING_PARAM_PREFIXES = ["utm_"];
const TRACKING_PARAM_NAMES = [
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "spm"
] as const;

export interface NormalizedArticleUrl {
  originalUrl: string;
  canonicalUrl: string;
  canonicalUrlHash: string;
}

export function normalizeArticleUrl(input: string): NormalizedArticleUrl {
  const originalUrl = input.trim();
  const url = new URL(originalUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  url.hash = "";
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  if (
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443")
  ) {
    url.port = "";
  }

  const params = [...url.searchParams.entries()]
    .filter(([name]) => !isTrackingParam(name))
    .sort(([left], [right]) => left.localeCompare(right));

  url.search = "";

  for (const [name, value] of params) {
    url.searchParams.append(name, value);
  }

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  const canonicalUrl = url.toString();

  return {
    originalUrl,
    canonicalUrl,
    canonicalUrlHash: hashCanonicalUrl(canonicalUrl)
  };
}

function isTrackingParam(name: string) {
  const lowerName = name.toLowerCase();
  return (
    TRACKING_PARAM_NAMES.includes(lowerName as (typeof TRACKING_PARAM_NAMES)[number]) ||
    TRACKING_PARAM_PREFIXES.some((prefix) => lowerName.startsWith(prefix))
  );
}

function hashCanonicalUrl(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
