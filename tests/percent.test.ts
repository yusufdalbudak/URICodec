import { describe, it, expect } from 'vitest';
import { encodeRFC3986, decodePercent, normalizePercent } from '../src/lib/percent.js';

describe('encodeRFC3986', () => {
    it('passes through unreserved characters', () => {
        expect(encodeRFC3986('hello-world_test.file~123')).toBe('hello-world_test.file~123');
    });

    it('encodes spaces and special chars', () => {
        expect(encodeRFC3986('hello world')).toBe('hello%20world');
        expect(encodeRFC3986('a=b&c=d')).toBe('a%3Db%26c%3Dd');
    });

    it('encodes UTF-8 multi-byte characters', () => {
        // ğ → 0xC4 0x9F
        expect(encodeRFC3986('ğ')).toBe('%C4%9F');
        // ş → 0xC5 0x9F
        expect(encodeRFC3986('ş')).toBe('%C5%9F');
    });

    it('encodes emoji (4-byte UTF-8)', () => {
        // 😀 → 0xF0 0x9F 0x98 0x80
        expect(encodeRFC3986('😀')).toBe('%F0%9F%98%80');
    });

    it('preserves already-encoded sequences by default', () => {
        expect(encodeRFC3986('%20already%20encoded')).toBe('%20already%20encoded');
    });

    it('re-encodes percent when reencodePercent=true', () => {
        expect(encodeRFC3986('%20', { reencodePercent: true })).toBe('%2520');
    });

    it('throws on invalid percent sequences in strict mode', () => {
        expect(() => encodeRFC3986('%GG', { strict: true })).toThrow('Invalid percent sequence');
    });

    it('encodes invalid percent sequences in lenient mode', () => {
        expect(encodeRFC3986('%GG')).toBe('%25GG');
    });

    describe('context modes', () => {
        it('path segment: allows sub-delims, ":", "@" but encodes "/"', () => {
            // RFC 3986: pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
            // So : and @ are allowed in path segments, but / is not
            expect(encodeRFC3986("a/b:c@d!e'f", { context: 'pathSegment' })).toBe("a%2Fb:c@d!e'f");
            const r = encodeRFC3986('a:b@c', { context: 'pathSegment' });
            expect(r).toBe('a:b@c');
        });

        it('full path: allows "/" in addition to path segment chars', () => {
            expect(encodeRFC3986('a/b/c', { context: 'path' })).toBe('a/b/c');
        });

        it('query: allows "?", "/", ":", "@"', () => {
            expect(encodeRFC3986('key=val&a=b?q', { context: 'query' })).toBe('key=val&a=b?q');
        });

        it('fragment: same rules as query', () => {
            expect(encodeRFC3986('frag#extra', { context: 'fragment' })).toBe('frag%23extra');
        });
    });

    describe('keepReserved', () => {
        it('preserves all reserved characters when keepReserved=true', () => {
            const reserved = ':/?#[]@!$&\'()*+,;=';
            expect(encodeRFC3986(reserved, { keepReserved: true })).toBe(reserved);
        });

        it('encodes reserved characters when keepReserved=false', () => {
            const result = encodeRFC3986(':/?#[]@', { keepReserved: false });
            expect(result).toBe('%3A%2F%3F%23%5B%5D%40');
        });
    });

    describe('safeSet', () => {
        it('allows extra characters via safeSet', () => {
            expect(encodeRFC3986('a b!c', { safeSet: '!' })).toBe('a%20b!c');
        });
    });
});

describe('decodePercent', () => {
    it('decodes basic percent sequences', () => {
        expect(decodePercent('%20')).toBe(' ');
        expect(decodePercent('hello%20world')).toBe('hello world');
    });

    it('decodes N times', () => {
        // Double-encoded: %2520 → %20 → ' '
        expect(decodePercent('%2520', { times: 2 })).toBe(' ');
    });

    it('decodes until stable', () => {
        // Triple-encoded: %252520 → %2520 → %20 → ' '
        expect(decodePercent('%252520', { untilStable: true })).toBe(' ');
    });

    it('respects maxIterations', () => {
        // Only allow 1 iteration: %252520 → %2520
        expect(decodePercent('%252520', { untilStable: true, maxIterations: 1 })).toBe('%2520');
    });

    it('handles lowercase hex', () => {
        expect(decodePercent('%2f')).toBe('/');
    });

    it('throws on invalid sequences in strict mode', () => {
        expect(() => decodePercent('%GG', { strict: true })).toThrow('Invalid percent sequence');
    });

    it('passes through invalid sequences in lenient mode', () => {
        expect(decodePercent('%GG')).toBe('%GG');
    });

    it('handles trailing percent', () => {
        expect(decodePercent('abc%')).toBe('abc%');
    });

    it('handles empty string', () => {
        expect(decodePercent('')).toBe('');
    });
});

describe('normalizePercent', () => {
    it('uppercases hex digits', () => {
        expect(normalizePercent('%2f%3a')).toBe('%2F%3A');
    });

    it('decodes unreserved characters to their literal form', () => {
        // %41 = 'A' (unreserved), should be decoded
        expect(normalizePercent('%41')).toBe('A');
        // %7E = '~' (unreserved), should be decoded
        expect(normalizePercent('%7e')).toBe('~');
    });

    it('keeps reserved characters as percent-encoded', () => {
        // %2F = '/' (reserved), should stay encoded
        expect(normalizePercent('%2f')).toBe('%2F');
    });

    it('passes through non-percent content', () => {
        expect(normalizePercent('hello')).toBe('hello');
    });

    it('throws on invalid sequences in strict mode', () => {
        expect(() => normalizePercent('%ZZ', { strict: true })).toThrow();
    });
});
