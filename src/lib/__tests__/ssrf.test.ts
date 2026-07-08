import { describe, it, expect } from 'vitest';
import { isPrivateIpv4, isPrivateIpv6, assertPublicHttpUrl } from '@/lib/ssrf';

describe('isPrivateIpv4', () => {
  it.each(['127.0.0.1', '10.0.0.5', '172.16.3.4', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1'])(
    'blocks private/reserved %s',
    (ip) => expect(isPrivateIpv4(ip)).toBe(true)
  );
  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34'])('allows public %s', (ip) =>
    expect(isPrivateIpv4(ip)).toBe(false)
  );
  it('treats unparseable as private (fail-safe)', () => {
    expect(isPrivateIpv4('not-an-ip')).toBe(true);
    expect(isPrivateIpv4('999.1.1.1')).toBe(true);
  });
});

describe('isPrivateIpv6', () => {
  it.each(['::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', '::ffff:127.0.0.1'])(
    'blocks %s',
    (ip) => expect(isPrivateIpv6(ip)).toBe(true)
  );
  it('allows a public v6 address', () => {
    expect(isPrivateIpv6('2001:4860:4860::8888')).toBe(false);
  });
});

describe('assertPublicHttpUrl', () => {
  it('rejects non-http(s) protocols', async () => {
    await expect(assertPublicHttpUrl('ftp://example.com/x')).rejects.toThrow();
    await expect(assertPublicHttpUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(assertPublicHttpUrl('not a url')).rejects.toThrow();
  });

  it('blocks SSRF to private / cloud-metadata / loopback literals', async () => {
    await expect(assertPublicHttpUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow();
    await expect(assertPublicHttpUrl('http://127.0.0.1:3000/')).rejects.toThrow();
    await expect(assertPublicHttpUrl('http://10.0.0.1/')).rejects.toThrow();
    await expect(assertPublicHttpUrl('http://[::1]/')).rejects.toThrow();
  });

  it('allows a public literal IP host', async () => {
    const url = await assertPublicHttpUrl('https://1.1.1.1/path');
    expect(url.hostname).toBe('1.1.1.1');
  });
});
