import type { RFC3986Options, DecodeOptions, EncodingContext } from './types.js';
import {
    UNRESERVED,
    RESERVED,
    PATH_SEGMENT_EXTRA,
    PATH_EXTRA,
    QUERY_EXTRA,
    FRAGMENT_EXTRA,
    HEX_TABLE,
    charSet,
} from './constants.js';

// ─── Internal helpers ────────────────────────────────────────────

/** Convert a code-point to its UTF-8 byte sequence. */
function utf8Bytes(codePoint: number): number[] {
    if (codePoint < 0x80) return [codePoint];
    if (codePoint < 0x800) return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)];
    if (codePoint < 0x10000)
        return [
            0xe0 | (codePoint >> 12),
            0x80 | ((codePoint >> 6) & 0x3f),
            0x80 | (codePoint & 0x3f),
        ];
    return [
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
    ];
}

function extraSafeForContext(context: EncodingContext): string {
    switch (context) {
        case 'pathSegment':
            return PATH_SEGMENT_EXTRA;
        case 'path':
            return PATH_EXTRA;
        case 'query':
            return QUERY_EXTRA;
        case 'fragment':
            return FRAGMENT_EXTRA;
        case 'full':
        default:
            return '';
    }
}

/** Validate a percent-encoded triplet. Returns true if valid hex. */
function isValidPercentTriplet(s: string, i: number): boolean {
    if (i + 2 >= s.length) return false;
    const h1 = s.charCodeAt(i + 1);
    const h2 = s.charCodeAt(i + 2);
    return isHexChar(h1) && isHexChar(h2);
}

function isHexChar(c: number): boolean {
    return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Percent-encode a string per RFC 3986, with configurable context and options.
 */
export function encodeRFC3986(input: string, opts: RFC3986Options = {}): string {
    const {
        context = 'full',
        keepReserved = false,
        safeSet: extraSafe = '',
        reencodePercent = false,
        strict = false,
    } = opts;

    // Build the safe character set
    const safe = charSet(UNRESERVED + extraSafeForContext(context) + extraSafe);
    const reservedSet = charSet(RESERVED);

    let out = '';
    for (let i = 0; i < input.length;) {
        const cp = input.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        const charLen = ch.length; // 1 for BMP, 2 for surrogate pair

        if (ch === '%' && !reencodePercent) {
            // Existing percent-encoded sequence — pass through or validate
            if (isValidPercentTriplet(input, i)) {
                out += input.slice(i, i + 3);
                i += 3;
                continue;
            } else if (strict) {
                throw new Error(`Invalid percent sequence at index ${i}: "${input.slice(i, i + 3)}"`);
            }
            // Lenient: encode the '%' itself
            out += '%25';
            i += 1;
            continue;
        }

        if (cp < 0x80 && safe.has(ch)) {
            out += ch;
            i += charLen;
            continue;
        }

        if (keepReserved && cp < 0x80 && reservedSet.has(ch)) {
            out += ch;
            i += charLen;
            continue;
        }

        // Percent-encode each UTF-8 byte
        for (const byte of utf8Bytes(cp)) {
            out += HEX_TABLE[byte];
        }
        i += charLen;
    }
    return out;
}

/**
 * Decode percent-encoded sequences. Supports N-pass and until-stable modes.
 */
export function decodePercent(input: string, opts: DecodeOptions = {}): string {
    const { times = 1, untilStable = false, maxIterations = 10, strict = false } = opts;

    const decodeSingle = (s: string): string => {
        let out = '';
        for (let i = 0; i < s.length;) {
            if (s[i] === '%') {
                if (isValidPercentTriplet(s, i)) {
                    const hex = s.slice(i + 1, i + 3);
                    out += String.fromCharCode(parseInt(hex, 16));
                    i += 3;
                    continue;
                } else if (strict) {
                    throw new Error(`Invalid percent sequence at index ${i}: "${s.slice(i, i + 3)}"`);
                }
                // Lenient: pass through the '%'
                out += '%';
                i += 1;
                continue;
            }
            out += s[i];
            i += 1;
        }
        return out;
    };

    if (untilStable) {
        let result = input;
        for (let iter = 0; iter < maxIterations; iter++) {
            const next = decodeSingle(result);
            if (next === result) return result;
            result = next;
        }
        return result;
    }

    let result = input;
    for (let n = 0; n < times; n++) {
        result = decodeSingle(result);
    }
    return result;
}

/**
 * Normalize percent-encoded sequences: uppercase hex digits, decode unreserved.
 */
export function normalizePercent(
    input: string,
    opts: { uppercaseHex?: boolean; strict?: boolean } = {},
): string {
    const { uppercaseHex = true, strict = false } = opts;
    const unreservedSet = charSet(UNRESERVED);

    let out = '';
    for (let i = 0; i < input.length;) {
        if (input[i] === '%') {
            if (isValidPercentTriplet(input, i)) {
                const hex = input.slice(i + 1, i + 3);
                const byte = parseInt(hex, 16);
                const ch = String.fromCharCode(byte);

                // Decode unreserved characters to their literal form (RFC 3986 §2.3)
                if (byte < 0x80 && unreservedSet.has(ch)) {
                    out += ch;
                } else if (uppercaseHex) {
                    out += '%' + hex.toUpperCase();
                } else {
                    out += '%' + hex;
                }
                i += 3;
                continue;
            } else if (strict) {
                throw new Error(`Invalid percent sequence at index ${i}: "${input.slice(i, i + 3)}"`);
            }
            out += '%';
            i += 1;
            continue;
        }
        out += input[i];
        i += 1;
    }
    return out;
}
