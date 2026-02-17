// ─── Encoding Contexts ───────────────────────────────────────────
export type EncodingContext = 'path' | 'pathSegment' | 'query' | 'fragment' | 'full';

// ─── Encoding Modes ──────────────────────────────────────────────
export type EncodingMode = 'rfc3986' | 'form' | 'iri' | 'domain';

// ─── RFC 3986 Options ────────────────────────────────────────────
export interface RFC3986Options {
    /** Which URI component context to use (determines safe set). Default: 'full' */
    context?: EncodingContext;
    /** If true, reserved characters (gen-delims + sub-delims) are NOT percent-encoded. Default: false */
    keepReserved?: boolean;
    /** Extra characters to treat as safe (not encoded). */
    safeSet?: string;
    /** If true, re-encode already-encoded '%' sequences. Default: false */
    reencodePercent?: boolean;
    /** If true, reject invalid percent sequences instead of passing through. Default: false */
    strict?: boolean;
}

// ─── Form Options ────────────────────────────────────────────────
export interface FormOptions {
    /** Extra characters to treat as safe (not encoded). */
    safeSet?: string;
    /** Strict mode for decoding. Default: false */
    strict?: boolean;
}

// ─── Decode Options ──────────────────────────────────────────────
export interface DecodeOptions {
    /** Number of decode passes to apply. Default: 1 */
    times?: number;
    /** If true, decode iteratively until output stabilizes. Overrides `times`. */
    untilStable?: boolean;
    /** Maximum iterations when `untilStable` is true. Default: 10 */
    maxIterations?: number;
    /** If true, throw on invalid percent sequences. Default: false */
    strict?: boolean;
}

// ─── Selective Options ───────────────────────────────────────────
export interface SelectiveOptions {
    /** Specific characters to encode. */
    charsToEncode?: string;
    /** URI component context. */
    context?: EncodingContext;
    /** Keep reserved characters unencoded. */
    keepReserved?: boolean;
}

// ─── Safe Set Options ────────────────────────────────────────────
export interface SafeSetOptions {
    /** Characters that should NOT be encoded. Everything else is encoded. */
    safeSet: string;
    /** URI component context. */
    context?: EncodingContext;
}

// ─── Non-Alnum Options ──────────────────────────────────────────
export interface NonAlnumOptions {
    /** URI component context. */
    context?: EncodingContext;
    /** Keep reserved characters unencoded. */
    keepReserved?: boolean;
}

// ─── Query KV ────────────────────────────────────────────────────
export interface KV {
    key: string;
    value: string;
}

export type QueryMode = 'percent' | 'form';

export interface ParseQueryOptions {
    /** Decode mode: 'percent' uses standard %XX, 'form' also converts '+' to space. Default: 'percent' */
    mode?: QueryMode;
}

export interface BuildQueryOptions {
    /** Encoding mode. Default: 'percent' */
    mode?: QueryMode;
    /** Encoding policy for keys/values. */
    policy?: RFC3986Options | FormOptions;
    /** If true, sort query params alphabetically by key. Default: false */
    sort?: boolean;
}

// ─── Transform Trace ─────────────────────────────────────────────
export interface TransformStep {
    name: string;
    params: Record<string, unknown>;
}

export interface VariantResult {
    /** Label for this variant (e.g. "RFC3986 canonical") */
    label: string;
    /** Numeric ID matching the spec list (1–12) */
    id: number;
    /** The transformed output string */
    value: string;
    /** Pipeline steps that produced this variant */
    trace: TransformStep[];
}

// ─── Variant Config ──────────────────────────────────────────────
export interface VariantConfig {
    /** Characters to encode for selective variant (#4). Default: '' */
    selectiveChars?: string;
    /** Safe set for "encode except safe" variant (#6). Default: RFC 3986 unreserved */
    safeSet?: string;
    /** N for multi-encode variant (#7). Default: 2 */
    encodeN?: number;
    /** Max iterations for decode-until-stable (#10). Default: 10 */
    maxDecodeIterations?: number;
    /** URI context for encoding variants. Default: 'full' */
    context?: EncodingContext;
    /** Whether to keep reserved chars where relevant. Default: false */
    keepReserved?: boolean;
}
