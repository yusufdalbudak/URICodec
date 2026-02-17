// RFC 3986 §2.3 — Unreserved Characters
// ALPHA / DIGIT / "-" / "." / "_" / "~"
export const UNRESERVED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

// RFC 3986 §2.2 — Reserved Characters
export const GEN_DELIMS = ':/?#[]@';
export const SUB_DELIMS = "!$&'()*+,;=";
export const RESERVED = GEN_DELIMS + SUB_DELIMS;

// ─── Context-specific safe sets ──────────────────────────────────
// These define characters that are allowed unencoded in each URI component,
// in addition to the unreserved set.

/** Path segment: unreserved / sub-delims / ":" / "@"  (NO "/") */
export const PATH_SEGMENT_EXTRA = SUB_DELIMS + ':@';

/** Full path: same as path segment but also allows "/" */
export const PATH_EXTRA = SUB_DELIMS + ':@/';

/** Query: unreserved / sub-delims / ":" / "@" / "/" / "?" */
export const QUERY_EXTRA = SUB_DELIMS + ':@/?';

/** Fragment: same as query */
export const FRAGMENT_EXTRA = SUB_DELIMS + ':@/?';

// ─── Form encoding safe set ─────────────────────────────────────
// application/x-www-form-urlencoded keeps alphanumerics + "*" + "-" + "." / "_"
// (spaces become "+")
export const FORM_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*-._';

// ─── Hex lookup ──────────────────────────────────────────────────
const _hexTable: string[] = [];
for (let i = 0; i < 256; i++) {
    _hexTable[i] = '%' + i.toString(16).toUpperCase().padStart(2, '0');
}
export const HEX_TABLE: ReadonlyArray<string> = _hexTable;

// ─── Helper to build a fast lookup set ───────────────────────────
export function charSet(chars: string): Set<string> {
    return new Set(chars.split(''));
}
