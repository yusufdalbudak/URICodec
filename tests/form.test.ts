import { describe, it, expect } from 'vitest';
import { encodeForm, decodeForm } from '../src/lib/form.js';

describe('encodeForm', () => {
    it('encodes spaces as "+"', () => {
        expect(encodeForm('hello world')).toBe('hello+world');
    });

    it('passes through form-safe characters', () => {
        expect(encodeForm('abc123-._*')).toBe('abc123-._*');
    });

    it('percent-encodes non-safe characters', () => {
        expect(encodeForm('a=b&c')).toBe('a%3Db%26c');
    });

    it('encodes UTF-8 characters', () => {
        expect(encodeForm('ğ')).toBe('%C4%9F');
    });

    it('respects safeSet', () => {
        expect(encodeForm('a=b', { safeSet: '=' })).toBe('a=b');
    });

    it('handles empty string', () => {
        expect(encodeForm('')).toBe('');
    });
});

describe('decodeForm', () => {
    it('decodes "+" to space', () => {
        expect(decodeForm('hello+world')).toBe('hello world');
    });

    it('decodes percent sequences', () => {
        expect(decodeForm('%3D')).toBe('=');
    });

    it('decodes combined "+" and percent', () => {
        expect(decodeForm('a+b%3Dc')).toBe('a b=c');
    });

    it('supports N-pass decode', () => {
        // %2B → '+' after one decode; '+' stays '+' if decoded again (not converted to space in second pass for form)
        // Actually: first pass: %252B → %2B; second pass: %2B → '+'
        expect(decodeForm('%252B', { times: 2 })).toBe('+');
    });

    it('decodes until stable', () => {
        // %252B → %2B → '+', then '+' → ' ' (form decode converts + to space)
        // After that ' ' stays stable
        expect(decodeForm('%252B', { untilStable: true })).toBe(' ');
    });

    it('throws on invalid sequences in strict mode', () => {
        expect(() => decodeForm('%GG', { strict: true })).toThrow();
    });

    it('handles empty string', () => {
        expect(decodeForm('')).toBe('');
    });
});

describe('form encode/decode round-trip', () => {
    it('round-trips basic text', () => {
        const input = 'hello world & goodbye=world';
        expect(decodeForm(encodeForm(input))).toBe(input);
    });

    it('round-trips Unicode', () => {
        const input = 'München straße';
        expect(decodeForm(encodeForm(input))).toBe(input);
    });
});
