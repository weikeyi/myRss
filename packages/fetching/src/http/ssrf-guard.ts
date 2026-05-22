import { lookup } from "node:dns/promises";
import net from "node:net";

export class SsrfGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfGuardError";
  }
}

export async function assertPublicHttpUrl(input: string): Promise<URL> {
  const url = new URL(input);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfGuardError("Only HTTP and HTTPS URLs are allowed");
  }

  if (url.username || url.password) {
    throw new SsrfGuardError("URL credentials are not allowed");
  }

  const hostname = url.hostname.toLowerCase();

  if (isBlockedHostname(hostname)) {
    throw new SsrfGuardError("Private hostnames are not allowed");
  }

  const addresses = net.isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, {
        all: true,
        verbatim: false
      });

  if (addresses.length === 0) {
    throw new SsrfGuardError("URL hostname could not be resolved");
  }

  for (const address of addresses) {
    if (isPrivateAddress(address.address)) {
      throw new SsrfGuardError("Private network addresses are not allowed");
    }
  }

  return url;
}

function isBlockedHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  );
}

function isPrivateAddress(address: string) {
  const ipVersion = net.isIP(address);

  if (ipVersion === 4) {
    return isPrivateIpv4(address);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

function isPrivateIpv4(address: string) {
  const [first = 0, second = 0] = address.split(".").map(Number);

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}
