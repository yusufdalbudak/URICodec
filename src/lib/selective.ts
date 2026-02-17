import type { SelectiveOptions, NonAlnumOptions, SafeSetOptions } from './types.js';
import { HEX_TABLE, UNRESERVED, RESERVED, charSet } from './constants.js';

// ─── Internal helpers ────────────────────────────────────────────

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

function percentEncodeChar(cp: number): string {
    const bytes = utf8Bytes(cp);
    return bytes.map(b => HEX_TABLE[b]).join('');
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Encode only user-specified characters.
 * Every character in `charsToEncode` will be percent-encoded; everything else passes through.
 */
export function selectiveEncode(input: string, opts: SelectiveOptions = {}): string {
    const { charsToEncode = '', keepReserved = false } = opts;
    const encodeSet = charSet(charsToEncode);
    const reservedSet = charSet(RESERVED);

    let out = '';
    for (let i = 0; i < input.length;) {
        const cp = input.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        const charLen = ch.length;

        if (encodeSet.has(ch)) {
            // If keepReserved and the char is reserved, skip encoding
            if (keepReserved && reservedSet.has(ch)) {
                out += ch;
            } else {
                out += percentEncodeChar(cp);
            }
        } else {
            out += ch;
        }
        i += charLen;
    }
    return out;
}

/**
 * Encode all non-alphanumeric characters.
 * Letters (A-Z, a-z) and digits (0-9) pass through; everything else is percent-encoded.
 */
export function encodeNonAlnum(input: string, opts: NonAlnumOptions = {}): string {
    const { keepReserved = false } = opts;
    const reservedSet = charSet(RESERVED);

    let out = '';
    for (let i = 0; i < input.length;) {
        const cp = input.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        const charLen = ch.length;

        if (
            (cp >= 0x41 && cp <= 0x5a) || // A-Z
            (cp >= 0x61 && cp <= 0x7a) || // a-z
            (cp >= 0x30 && cp <= 0x39)    // 0-9
        ) {
            out += ch;
        } else if (keepReserved && cp < 0x80 && reservedSet.has(ch)) {
            out += ch;
        } else {
            out += percentEncodeChar(cp);
        }
        i += charLen;
    }
    return out;
}

/**
 * Encode everything except a configurable safe set.
 * Characters in `safeSet` pass through; everything else is percent-encoded.
 */
export function encodeExceptSafeSet(input: string, opts: SafeSetOptions): string {
    const safe = charSet(opts.safeSet);

    let out = '';
    for (let i = 0; i < input.length;) {
        const cp = input.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        const charLen = ch.length;

        if (cp < 0x80 && safe.has(ch)) {
            out += ch;
        } else {
            out += percentEncodeChar(cp);
        }
        i += charLen;
    }
    return out;
}
