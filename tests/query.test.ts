import { describe, it, expect } from 'vitest';
import { parseQuery, buildQuery } from '../src/lib/query.js';

describe('parseQuery', () => {
    it('parses basic key=value pairs', () => {
        const result = parseQuery('a=1&b=2');
        expect(result).toEqual([
            { key: 'a', value: '1' },
            { key: 'b', value: '2' },
        ]);
    });

    it('strips leading "?"', () => {
        expect(parseQuery('?a=1')).toEqual([{ key: 'a', value: '1' }]);
    });

    it('handles percent-encoded keys/values', () => {
        const result = parseQuery('key%20one=value%20two');
        expect(result).toEqual([{ key: 'key one', value: 'value two' }]);
    });

    it('handles form-encoded "+" as space in form mode', () => {
        const result = parseQuery('key+one=value+two', { mode: 'form' });
        expect(result).toEqual([{ key: 'key one', value: 'value two' }]);
    });

    it('handles repeated keys', () => {
        const result = parseQuery('a=1&a=2&a=3');
        expect(result.length).toBe(3);
        expect(result.map(kv => kv.value)).toEqual(['1', '2', '3']);
    });

    it('handles empty values', () => {
        expect(parseQuery('a=&b=')).toEqual([
            { key: 'a', value: '' },
            { key: 'b', value: '' },
        ]);
    });

    it('handles keys with no "="', () => {
        expect(parseQuery('a&b')).toEqual([
            { key: 'a', value: '' },
            { key: 'b', value: '' },
        ]);
    });

    it('handles empty string', () => {
        expect(parseQuery('')).toEqual([]);
        expect(parseQuery('?')).toEqual([]);
    });

    it('handles values containing "="', () => {
        expect(parseQuery('a=b=c')).toEqual([{ key: 'a', value: 'b=c' }]);
    });
});

describe('buildQuery', () => {
    it('builds basic query string', () => {
        const result = buildQuery([
            { key: 'a', value: '1' },
            { key: 'b', value: '2' },
        ]);
        expect(result).toBe('a=1&b=2');
    });

    it('percent-encodes special characters', () => {
        const result = buildQuery([{ key: 'hello world', value: 'a&b' }]);
        expect(result).toContain('hello');
        expect(result).toContain('world');
    });

    it('sorts by key when sort=true', () => {
        const result = buildQuery(
            [
                { key: 'c', value: '3' },
                { key: 'a', value: '1' },
                { key: 'b', value: '2' },
            ],
            { sort: true },
        );
        expect(result).toBe('a=1&b=2&c=3');
    });

    it('uses form encoding in form mode', () => {
        const result = buildQuery([{ key: 'hello world', value: 'test' }], { mode: 'form' });
        expect(result).toBe('hello+world=test');
    });
});

describe('parseQuery → buildQuery round-trip', () => {
    it('round-trips simple query', () => {
        const qs = 'a=1&b=2&c=3';
        const parsed = parseQuery(qs);
        const rebuilt = buildQuery(parsed);
        // Re-parse to compare (encoding may differ)
        expect(parseQuery(rebuilt)).toEqual(parsed);
    });
});
