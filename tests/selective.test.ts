import { describe, it, expect } from 'vitest';
import { selectiveEncode, encodeNonAlnum, encodeExceptSafeSet } from '../src/lib/selective.js';

describe('selectiveEncode', () => {
    it('encodes only specified characters', () => {
        expect(selectiveEncode('hello world!', { charsToEncode: ' ' })).toBe('hello%20world!');
        expect(selectiveEncode('a$b$c', { charsToEncode: '$' })).toBe('a%24b%24c');
    });

    it('does not touch unspecified characters', () => {
        expect(selectiveEncode('hello world!', { charsToEncode: '!' })).toBe('hello world%21');
    });

    it('respects keepReserved', () => {
        expect(selectiveEncode('a&b', { charsToEncode: '&', keepReserved: true })).toBe('a&b');
        expect(selectiveEncode('a&b', { charsToEncode: '&', keepReserved: false })).toBe('a%26b');
    });

    it('handles UTF-8 characters in encode set', () => {
        expect(selectiveEncode('ağb', { charsToEncode: 'ğ' })).toBe('a%C4%9Fb');
    });

    it('handles empty charsToEncode (no-op)', () => {
        expect(selectiveEncode('hello', { charsToEncode: '' })).toBe('hello');
    });

    it('handles empty input', () => {
        expect(selectiveEncode('', { charsToEncode: 'abc' })).toBe('');
    });
});

describe('encodeNonAlnum', () => {
    it('encodes everything except letters and digits', () => {
        expect(encodeNonAlnum('a1!')).toBe('a1%21');
        expect(encodeNonAlnum('hello world')).toBe('hello%20world');
    });

    it('encodes dots, dashes, underscores, tildes', () => {
        expect(encodeNonAlnum('a-b.c_d~e')).toBe('a%2Db%2Ec%5Fd%7Ee');
    });

    it('keeps reserved when keepReserved=true', () => {
        expect(encodeNonAlnum('a/b', { keepReserved: true })).toBe('a/b');
    });

    it('handles Unicode', () => {
        const result = encodeNonAlnum('ğ');
        expect(result).toBe('%C4%9F');
    });
});

describe('encodeExceptSafeSet', () => {
    it('encodes everything not in the safe set', () => {
        expect(encodeExceptSafeSet('abc!@#', { safeSet: 'abc' })).toBe('abc%21%40%23');
    });

    it('handles empty safe set (encodes everything)', () => {
        expect(encodeExceptSafeSet('ab', { safeSet: '' })).toBe('%61%62');
    });

    it('handles safe set that covers all input', () => {
        expect(encodeExceptSafeSet('abc', { safeSet: 'abc' })).toBe('abc');
    });

    it('handles Unicode with ASCII-only safe set', () => {
        expect(encodeExceptSafeSet('ağb', { safeSet: 'ab' })).toBe('a%C4%9Fb');
    });
});
