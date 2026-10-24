/**
 * AES-256-GCM symmetric encryption for OAuth tokens.
 *
 * KEY must be 32 bytes (64 hex chars). Set TOKEN_ENCRYPTION_KEY in .env.
 * Each encrypt call produces a unique IV; the IV is prepended to the ciphertext.
 * Format: hex(iv) + ':' + hex(tag) + ':' + hex(ciphertext)
 *
 * NEVER log or expose the raw output without ensuring it stays server-side.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const TAG_BYTES = 16;

function getKey(): Buffer {
  const hex = env.TOKEN_ENCRYPTION_KEY;
  if (hex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted token format');

  const [ivHex, tagHex, encHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/** Safe null-handling wrappers */
export function encryptTokenSafe(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  return encryptToken(plaintext);
}

export function decryptTokenSafe(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  try {
    return decryptToken(ciphertext);
  } catch {
    return null;
  }
}
