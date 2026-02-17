import type { FormOptions, DecodeOptions } from './types.js';
import { FORM_SAFE, HEX_TABLE, charSet } from './constants.js';

/**
 * Encode a string per application/x-www-form-urlencoded.
 * Spaces become '+', everything outside the form-safe set is percent-encoded.
 */
export function encodeForm(input: string, opts: FormOptions = {}): string {
    const { safeSet: extraSafe = '', strict: _strict = false } = opts;
    const safe = charSet(FORM_SAFE + extraSafe);

    let out = '';
    for (let i = 0; i < input.length;) {
        const cp = input.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        const charLen = ch.length;

        if (ch === ' ') {
            out += '+';
            i += charLen;
            continue;
        }

        if (cp < 0x80 && safe.has(ch)) {
            out += ch;
            i += charLen;
            continue;
        }

        // Percent-encode each UTF-8 byte
        const bytes = utf8Bytes(cp);
        for (const byte of bytes) {
            out += HEX_TABLE[byte];
        }
        i += charLen;
    }
    return out;
}

/**
 * Decode a form-encoded string.
 * '+' → space, percent sequences decoded.
 */
export function decodeForm(input: string, opts: DecodeOptions = {}): string {
    const { times = 1, untilStable = false, maxIterations = 10, strict = false } = opts;

    const decodeSingle = (s: string): string => {
        let out = '';
        for (let i = 0; i < s.length;) {
            if (s[i] === '+') {
                out += ' ';
                i += 1;
                continue;
            }
            if (s[i] === '%') {
                if (i + 2 < s.length && isHex(s.charCodeAt(i + 1)) && isHex(s.charCodeAt(i + 2))) {
                    // Collect consecutive percent-encoded bytes for proper UTF-8 decoding
                    const bytes: number[] = [];
                    let j = i;
                    while (j < s.length && s[j] === '%' && j + 2 < s.length && isHex(s.charCodeAt(j + 1)) && isHex(s.charCodeAt(j + 2))) {
                        bytes.push(parseInt(s.slice(j + 1, j + 3), 16));
                        j += 3;
                    }
                    try {
                        const decoder = new TextDecoder('utf-8', { fatal: false });
                        out += decoder.decode(new Uint8Array(bytes));
                    } catch {
                        for (const b of bytes) out += String.fromCharCode(b);
                    }
                    i = j;
                    continue;
                } else if (strict) {
                    throw new Error(`Invalid percent sequence at index ${i}`);
                }
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

// ─── Internal helpers ────────────────────────────────────────────

function isHex(c: number): boolean {
    return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
}

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
