import dns from 'node:dns/promises';
import { URL } from 'node:url';
import { BadRequestError } from './errors.js';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'metadata.google.internal',
  'instance-data',
]);

/**
 * Checks if an IPv4 address is in a reserved/private range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP treated as unsafe
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link-Local, AWS/GCP/Azure instance metadata: 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (Reserved)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a reserved/private range.
 */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // Loopback (::1)
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  // Unspecified (::)
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
  // Link-local (fe80::/10)
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
  // Unique local / private (fc00::/7 -> fc.. or fd..)
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // IPv4-mapped IPv6 (::ffff:192.168.x.x)
  if (lower.startsWith('::ffff:')) {
    const v4Part = lower.replace('::ffff:', '');
    return isPrivateIPv4(v4Part);
  }

  return false;
}

/**
 * Validates a website URL against SSRF attacks.
 * Resolves DNS to ensure no private/internal IP ranges are targeted.
 */
export async function validatePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestError('Invalid website URL format');
  }

  // Only allow http: and https: protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestError('Website URL must use HTTP or HTTPS protocol');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check static blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan')) {
    throw new BadRequestError('Access to internal or private hosts is prohibited');
  }

  // If hostname is directly an IP literal, validate directly
  if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    throw new BadRequestError('Access to private or local IP addresses is prohibited');
  }

  // Perform DNS resolution to check resolved IP addresses
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        throw new BadRequestError(`Destination resolves to private address: ${record.address}`);
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        throw new BadRequestError(`Destination resolves to private IPv6 address: ${record.address}`);
      }
    }
  } catch (err: unknown) {
    if (err instanceof BadRequestError) throw err;
    throw new BadRequestError(`Failed to resolve host ${hostname}: ${(err as Error).message}`);
  }

  return parsed;
}
