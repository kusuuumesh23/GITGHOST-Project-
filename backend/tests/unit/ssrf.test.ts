import { describe, it, expect } from 'vitest';
import { validatePublicUrl } from '../../src/utils/ssrf.js';
import { BadRequestError } from '../../src/utils/errors.js';

describe('SSRF Protection & URL Validation', () => {
  it('should accept valid public HTTPS websites', async () => {
    const url = await validatePublicUrl('https://example.com/about');
    expect(url.hostname).toBe('example.com');
    expect(url.protocol).toBe('https:');
  });

  it('should reject non-HTTP/HTTPS protocols', async () => {
    await expect(validatePublicUrl('file:///etc/passwd')).rejects.toThrow(BadRequestError);
    await expect(validatePublicUrl('ftp://example.com')).rejects.toThrow(BadRequestError);
    await expect(validatePublicUrl('javascript:alert(1)')).rejects.toThrow(BadRequestError);
  });

  it('should reject loopback addresses and localhost', async () => {
    await expect(validatePublicUrl('http://localhost:3000')).rejects.toThrow(BadRequestError);
    await expect(validatePublicUrl('http://127.0.0.1')).rejects.toThrow(BadRequestError);
    await expect(validatePublicUrl('http://[::1]')).rejects.toThrow(BadRequestError);
  });

  it('should reject AWS/Cloud metadata service address (169.254.169.254)', async () => {
    await expect(validatePublicUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(BadRequestError);
  });

  it('should reject private RFC1918 subnets', async () => {
    await expect(validatePublicUrl('http://10.0.0.1')).rejects.toThrow(BadRequestError);
    await expect(validatePublicUrl('http://172.16.0.5')).rejects.toThrow(BadRequestError);
    await expect(validatePublicUrl('http://192.168.1.1')).rejects.toThrow(BadRequestError);
  });

  it('should reject internal domain suffixes (.local, .internal, .lan)', async () => {
    await expect(validatePublicUrl('http://app.internal')).rejects.toThrow(BadRequestError);
    await expect(validatePublicUrl('http://printer.local')).rejects.toThrow(BadRequestError);
  });
});
