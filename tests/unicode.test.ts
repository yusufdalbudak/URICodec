import { describe, it, expect } from 'vitest';
import { iriToUri, uriToIri, domainToPunycode, punycodeToDomain } from '../src/lib/unicode.js';

describe('iriToUri', () => {
    it('converts non-ASCII characters to percent-encoded UTF-8', () => {
        expect(iriToUri('https://example.com/ğ')).toBe('https://example.com/%C4%9F');
    });

    it('passes through ASCII characters', () => {
        expect(iriToUri('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
    });

    it('handles mixed ASCII and non-ASCII', () => {
        expect(iriToUri('café')).toBe('caf%C3%A9');
    });

    it('handles emoji', () => {
        expect(iriToUri('👋')).toBe('%F0%9F%91%8B');
    });

    it('handles empty string', () => {
        expect(iriToUri('')).toBe('');
    });
});

describe('uriToIri', () => {
    it('converts percent-encoded non-ASCII back to Unicode', () => {
        expect(uriToIri('https://example.com/%C4%9F')).toBe('https://example.com/ğ');
    });

    it('leaves ASCII percent-encoded sequences as-is', () => {
        expect(uriToIri('%20')).toBe('%20');
        expect(uriToIri('%2F')).toBe('%2F');
    });

    it('handles round-trip for non-ASCII', () => {
        const original = 'https://example.com/ğüş';
        const uri = iriToUri(original);
        expect(uriToIri(uri)).toBe(original);
    });
});

describe('domainToPunycode', () => {
    it('converts a Unicode domain to punycode', () => {
        expect(domainToPunycode('münchen.de')).toBe('xn--mnchen-3ya.de');
    });

    it('converts domain in a full URL', () => {
        const result = domainToPunycode('https://münchen.de/path');
        expect(result).toContain('xn--mnchen-3ya.de');
        expect(result).toContain('/path');
    });

    it('passes through ASCII-only domains', () => {
        expect(domainToPunycode('example.com')).toBe('example.com');
    });
});

describe('punycodeToDomain', () => {
    it('converts punycode to Unicode domain', () => {
        expect(punycodeToDomain('xn--mnchen-3ya.de')).toBe('münchen.de');
    });

    it('converts punycode in a full URL', () => {
        const result = punycodeToDomain('https://xn--mnchen-3ya.de/path');
        expect(result).toContain('münchen.de');
        expect(result).toContain('/path');
    });

    it('passes through non-punycode domains', () => {
        expect(punycodeToDomain('example.com')).toBe('example.com');
    });
});

describe('punycode round-trip', () => {
    it('round-trips München', () => {
        const domain = 'münchen.de';
        expect(punycodeToDomain(domainToPunycode(domain))).toBe(domain);
    });

    it('round-trips Turkish characters', () => {
        const domain = 'güneş.com.tr';
        expect(punycodeToDomain(domainToPunycode(domain))).toBe(domain);
    });
});
