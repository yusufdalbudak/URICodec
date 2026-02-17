import type { VariantConfig, VariantResult, TransformStep } from './types.js';
import { UNRESERVED } from './constants.js';
import { encodeRFC3986, decodePercent, normalizePercent } from './percent.js';
import { encodeForm } from './form.js';
import { encodeNTimes, mixedCasePercent } from './multipass.js';
import { selectiveEncode, encodeNonAlnum, encodeExceptSafeSet } from './selective.js';
import { domainToPunycode } from './unicode.js';

/**
 * Extract the raw domain from a string, if it looks like a URL.
 * Avoids URL constructor which auto-encodes Unicode hostnames.
 */
function extractDomain(input: string): string | null {
    const schemeMatch = input.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//);
    if (!schemeMatch) return null;
    let start = schemeMatch[0].length;

    // Skip userinfo
    const atIdx = input.indexOf('@', start);
    const slashIdx = input.indexOf('/', start);
    if (atIdx !== -1 && (slashIdx === -1 || atIdx < slashIdx)) {
        start = atIdx + 1;
    }

    let end = input.length;
    for (let i = start; i < input.length; i++) {
        const ch = input[i];
        if (ch === '/' || ch === '?' || ch === '#') { end = i; break; }
        if (ch === ':' && i > start && /^\d/.test(input.slice(i + 1))) { end = i; break; }
    }
    return input.slice(start, end) || null;
}

/**
 * Check if a domain contains non-ASCII characters (i.e., could benefit from punycode).
 */
function hasUnicodeDomain(input: string): boolean {
    const domain = extractDomain(input);
    if (!domain) return false;
    return [...domain].some(c => c.codePointAt(0)! >= 0x80);
}

/**
 * Generate all 12 variant types for a given input line.
 */
export function generateVariants(line: string, config: VariantConfig = {}): VariantResult[] {
    const {
        selectiveChars = '',
        safeSet = UNRESERVED,
        encodeN = 2,
        maxDecodeIterations = 10,
        context = 'full',
        keepReserved = false,
    } = config;

    const results: VariantResult[] = [];

    // 1) RFC3986 canonical encode
    results.push({
        id: 1,
        label: 'RFC3986 canonical',
        value: encodeRFC3986(line, { context, keepReserved: false }),
        trace: [{ name: 'encodeRFC3986', params: { context, keepReserved: false } }],
    });

    // 2) RFC3986 encode with reserved kept
    results.push({
        id: 2,
        label: 'RFC3986 keep-reserved',
        value: encodeRFC3986(line, { context, keepReserved: true }),
        trace: [{ name: 'encodeRFC3986', params: { context, keepReserved: true } }],
    });

    // 3) Form-encode (space → '+')
    results.push({
        id: 3,
        label: 'Form encode (space → +)',
        value: encodeForm(line),
        trace: [{ name: 'encodeForm', params: {} }],
    });

    // 4) Selective encode (user-specified chars)
    results.push({
        id: 4,
        label: `Selective encode [${selectiveChars || '(none)'}]`,
        value: selectiveEncode(line, { charsToEncode: selectiveChars, keepReserved }),
        trace: [{ name: 'selectiveEncode', params: { charsToEncode: selectiveChars, keepReserved } }],
    });

    // 5) Encode non-alnum
    results.push({
        id: 5,
        label: 'Encode non-alphanumeric',
        value: encodeNonAlnum(line, { context, keepReserved }),
        trace: [{ name: 'encodeNonAlnum', params: { context, keepReserved } }],
    });

    // 6) Encode all except safe set
    results.push({
        id: 6,
        label: `Encode except safe set`,
        value: encodeExceptSafeSet(line, { safeSet, context }),
        trace: [{ name: 'encodeExceptSafeSet', params: { safeSet: `[${safeSet.length} chars]`, context } }],
    });

    // 7) Double-encode (N=encodeN)
    const encFn = (s: string) => encodeRFC3986(s, { context, reencodePercent: true });
    results.push({
        id: 7,
        label: `Multi-encode (N=${encodeN})`,
        value: encodeNTimes(line, encodeN, encFn),
        trace: [{ name: 'encodeNTimes', params: { n: encodeN, encoder: 'encodeRFC3986' } }],
    });

    // 8) Mixed-case percent variant
    const canonical = encodeRFC3986(line, { context, keepReserved: false });
    results.push({
        id: 8,
        label: 'Mixed-case percent',
        value: mixedCasePercent(canonical),
        trace: [
            { name: 'encodeRFC3986', params: { context } },
            { name: 'mixedCasePercent', params: {} },
        ],
    });

    // 9) Decode once
    results.push({
        id: 9,
        label: 'Decode once',
        value: decodePercent(line, { times: 1 }),
        trace: [{ name: 'decodePercent', params: { times: 1 } }],
    });

    // 10) Decode until stable
    results.push({
        id: 10,
        label: `Decode until stable (max ${maxDecodeIterations})`,
        value: decodePercent(line, { untilStable: true, maxIterations: maxDecodeIterations }),
        trace: [{ name: 'decodePercent', params: { untilStable: true, maxIterations: maxDecodeIterations } }],
    });

    // 11) Normalize then encode (canonicalization pipeline)
    const normalized = normalizePercent(line);
    const normalizedEncoded = encodeRFC3986(normalized, { context, keepReserved });
    results.push({
        id: 11,
        label: 'Normalize → encode',
        value: normalizedEncoded,
        trace: [
            { name: 'normalizePercent', params: { uppercaseHex: true } },
            { name: 'encodeRFC3986', params: { context, keepReserved } },
        ] as TransformStep[],
    });

    // 12) Domain punycode transform (if URL contains a Unicode domain)
    if (hasUnicodeDomain(line)) {
        results.push({
            id: 12,
            label: 'Domain → Punycode',
            value: domainToPunycode(line),
            trace: [{ name: 'domainToPunycode', params: {} }],
        });
    } else {
        results.push({
            id: 12,
            label: 'Domain → Punycode (no Unicode domain detected)',
            value: line,
            trace: [{ name: 'domainToPunycode', params: { skipped: true } }],
        });
    }

    return results;
}
