import punycode from 'punycode/';
import { HEX_TABLE } from './constants.js';

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

/**
 * Check if a character should be percent-encoded when converting IRI → URI.
 * ASCII characters that are valid in URIs stay as-is; non-ASCII gets encoded.
 */
function shouldPercentEncodeForURI(cp: number): boolean {
    // Non-ASCII → encode
    return cp >= 0x80;
}

/**
 * Decode a percent-encoded UTF-8 sequence starting at position i.
 * Returns the decoded string and the number of characters consumed, or null if invalid.
 */
function decodePercentUtf8(s: string, i: number): { char: string; consumed: number } | null {
    const bytes: number[] = [];

    let pos = i;
    while (pos < s.length && s[pos] === '%' && pos + 2 < s.length) {
        const h1 = s.charCodeAt(pos + 1);
        const h2 = s.charCodeAt(pos + 2);
        if (!isHex(h1) || !isHex(h2)) break;
        bytes.push(parseInt(s.slice(pos + 1, pos + 3), 16));
        pos += 3;
    }

    if (bytes.length === 0) return null;

    try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const decoded = decoder.decode(new Uint8Array(bytes));
        return { char: decoded, consumed: pos - i };
    } catch {
        return null;
    }
}

function isHex(c: number): boolean {
    return (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Convert an IRI (Internationalized Resource Identifier) to a URI.
 * Non-ASCII characters in the IRI are percent-encoded using UTF-8 bytes.
 */
export function iriToUri(input: string): string {
    let out = '';
    for (let i = 0; i < input.length;) {
        const cp = input.codePointAt(i)!;
        const ch = String.fromCodePoint(cp);
        const charLen = ch.length;

        if (shouldPercentEncodeForURI(cp)) {
            for (const byte of utf8Bytes(cp)) {
                out += HEX_TABLE[byte];
            }
        } else {
            out += ch;
        }
        i += charLen;
    }
    return out;
}

/**
 * Convert a URI to an IRI (best-effort).
 * Percent-encoded UTF-8 sequences that decode to valid Unicode are converted back.
 * ASCII percent-encoded characters are left as-is (they may be structurally significant).
 */
export function uriToIri(input: string): string {
    let out = '';
    for (let i = 0; i < input.length;) {
        if (input[i] === '%') {
            // Try to decode a UTF-8 percent-encoded sequence
            const decoded = decodePercentUtf8(input, i);
            if (decoded) {
                // Only convert to literal if it contains non-ASCII characters
                const hasNonAscii = [...decoded.char].some(c => c.codePointAt(0)! >= 0x80);
                if (hasNonAscii) {
                    out += decoded.char;
                    i += decoded.consumed;
                    continue;
                }
            }
            // Pass through ASCII percent-encoded or invalid
            out += input[i];
            i += 1;
            continue;
        }
        out += input[i];
        i += 1;
    }
    return out;
}

/**
 * Extract the raw hostname from a URL string (before any normalization).
 */
function extractRawHost(urlStr: string): { host: string; start: number; end: number } | null {
    const schemeMatch = urlStr.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//);
    if (!schemeMatch) return null;
    const afterScheme = schemeMatch[0].length;

    // Skip userinfo (user:pass@)
    let hostStart = afterScheme;
    const atIdx = urlStr.indexOf('@', afterScheme);
    const slashIdx = urlStr.indexOf('/', afterScheme);
    if (atIdx !== -1 && (slashIdx === -1 || atIdx < slashIdx)) {
        hostStart = atIdx + 1;
    }

    // Find the end of the host: next /, ?, or #
    let hostEnd = urlStr.length;
    for (let i = hostStart; i < urlStr.length; i++) {
        const ch = urlStr[i];
        if (ch === '/' || ch === '?' || ch === '#') {
            hostEnd = i;
            break;
        }
        if (ch === ':' && i > hostStart) {
            const rest = urlStr.slice(i + 1);
            if (/^\d/.test(rest)) {
                hostEnd = i;
                break;
            }
        }
    }
    return { host: urlStr.slice(hostStart, hostEnd), start: hostStart, end: hostEnd };
}

/**
 * Convert a Unicode domain (or full URL with Unicode domain) to punycode.
 * e.g., "münchen.de" → "xn--mnchen-3ya.de"
 * e.g., "https://münchen.de/path" → "https://xn--mnchen-3ya.de/path"
 */
export function domainToPunycode(urlOrDomain: string): string {
    const extracted = extractRawHost(urlOrDomain);
    if (extracted) {
        const punycodeHost = punycode.toASCII(extracted.host);
        return urlOrDomain.slice(0, extracted.start) + punycodeHost + urlOrDomain.slice(extracted.end);
    }
    return punycode.toASCII(urlOrDomain);
}

/**
 * Convert a punycode domain (or full URL with punycode domain) to Unicode.
 * e.g., "xn--mnchen-3ya.de" → "münchen.de"
 */
export function punycodeToDomain(xnDomain: string): string {
    const extracted = extractRawHost(xnDomain);
    if (extracted) {
        const unicodeHost = punycode.toUnicode(extracted.host);
        return xnDomain.slice(0, extracted.start) + unicodeHost + xnDomain.slice(extracted.end);
    }
    return punycode.toUnicode(xnDomain);
}

