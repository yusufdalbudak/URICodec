import { describe, it, expect } from 'vitest';
import { generateVariants } from '../src/lib/variants.js';

describe('generateVariants', () => {
    it('produces exactly 12 variants', () => {
        const results = generateVariants('hello world');
        expect(results.length).toBe(12);
    });

    it('assigns correct IDs 1-12', () => {
        const results = generateVariants('test');
        const ids = results.map(r => r.id);
        expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('each variant has a label, value, and trace', () => {
        const results = generateVariants('hello');
        for (const r of results) {
            expect(typeof r.label).toBe('string');
            expect(r.label.length).toBeGreaterThan(0);
            expect(typeof r.value).toBe('string');
            expect(Array.isArray(r.trace)).toBe(true);
            expect(r.trace.length).toBeGreaterThan(0);
        }
    });

    describe('variant correctness', () => {
        const input = 'hello world/path?q=1';
        const results = generateVariants(input);

        it('#1 RFC3986 canonical encodes spaces and reserved', () => {
            const v = results.find(r => r.id === 1)!;
            expect(v.value).toContain('%20');
            expect(v.value).not.toContain(' ');
        });

        it('#2 RFC3986 keep-reserved preserves reserved chars', () => {
            const v = results.find(r => r.id === 2)!;
            expect(v.value).toContain('/');
            expect(v.value).toContain('?');
            expect(v.value).toContain('=');
        });

        it('#3 Form encode converts spaces to "+"', () => {
            const v = results.find(r => r.id === 3)!;
            expect(v.value).toContain('+');
            expect(v.value).not.toContain(' ');
        });

        it('#5 Encode non-alnum encodes all non-alphanumeric', () => {
            const v = results.find(r => r.id === 5)!;
            expect(v.value).toMatch(/^[a-zA-Z0-9%]+$/);
        });

        it('#7 Multi-encode produces double-encoded output', () => {
            const v = results.find(r => r.id === 7)!;
            expect(v.value).toContain('%25');
        });

        it('#9 Decode once decodes percent sequences', () => {
            const encoded = 'hello%20world';
            const results2 = generateVariants(encoded);
            const v = results2.find(r => r.id === 9)!;
            expect(v.value).toBe('hello world');
        });

        it('#10 Decode until stable fully decodes', () => {
            const doubleEncoded = 'hello%2520world';
            const results2 = generateVariants(doubleEncoded);
            const v = results2.find(r => r.id === 10)!;
            expect(v.value).toBe('hello world');
        });
    });

    describe('with Unicode domain', () => {
        it('#12 performs punycode transform for Unicode domain', () => {
            const input = 'https://münchen.de/path';
            const results = generateVariants(input);
            const v = results.find(r => r.id === 12)!;
            expect(v.value).toContain('xn--mnchen-3ya');
        });
    });

    describe('config options', () => {
        it('uses selectiveChars for variant #4', () => {
            const results = generateVariants('hello!world', { selectiveChars: '!' });
            const v = results.find(r => r.id === 4)!;
            expect(v.value).toBe('hello%21world');
        });

        it('uses custom encodeN', () => {
            const results = generateVariants('a b', { encodeN: 3 });
            const v = results.find(r => r.id === 7)!;
            // Triple-encoded space: %20 → %2520 → %252520
            expect(v.value).toContain('%252520');
        });
    });
});
