import type { KV, ParseQueryOptions, BuildQueryOptions } from './types.js';
import { encodeRFC3986, decodePercent } from './percent.js';
import { encodeForm, decodeForm } from './form.js';

/**
 * Parse a query string into key/value pairs.
 * Handles repeated keys, empty values, and configurable decode mode.
 *
 * @param input - The query string (with or without leading '?')
 * @param opts  - Parse options
 */
export function parseQuery(input: string, opts: ParseQueryOptions = {}): KV[] {
    const { mode = 'percent' } = opts;

    // Strip leading '?'
    let qs = input;
    if (qs.startsWith('?')) qs = qs.slice(1);
    if (qs === '') return [];

    const decodeFn = mode === 'form' ? (s: string) => decodeForm(s) : (s: string) => decodePercent(s);

    const pairs = qs.split('&');
    const result: KV[] = [];

    for (const pair of pairs) {
        if (pair === '') continue;
        const eqIdx = pair.indexOf('=');
        let key: string;
        let value: string;

        if (eqIdx === -1) {
            // No '=' → key with empty value
            key = decodeFn(pair);
            value = '';
        } else {
            key = decodeFn(pair.slice(0, eqIdx));
            value = decodeFn(pair.slice(eqIdx + 1));
        }
        result.push({ key, value });
    }

    return result;
}

/**
 * Build a query string from key/value pairs with configurable encoding policy.
 *
 * @param kvList - Key/value pairs
 * @param opts   - Build options
 */
export function buildQuery(kvList: KV[], opts: BuildQueryOptions = {}): string {
    const { mode = 'percent', sort = false } = opts;

    let pairs = [...kvList];
    if (sort) {
        pairs = pairs.sort((a, b) => a.key.localeCompare(b.key));
    }

    const encodeFn =
        mode === 'form'
            ? (s: string) => encodeForm(s)
            : (s: string) => encodeRFC3986(s, { context: 'query', ...opts.policy });

    return pairs.map(({ key, value }) => `${encodeFn(key)}=${encodeFn(value)}`).join('&');
}
