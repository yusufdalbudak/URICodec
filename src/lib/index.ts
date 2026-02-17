// ─── Core Library Public API ─────────────────────────────────────
// Re-exports all public functions and types.

export { encodeRFC3986, decodePercent, normalizePercent } from './percent.js';
export { encodeForm, decodeForm } from './form.js';
export { encodeNTimes, decodeNTimes, decodeUntilStable, mixedCasePercent } from './multipass.js';
export { selectiveEncode, encodeNonAlnum, encodeExceptSafeSet } from './selective.js';
export { iriToUri, uriToIri, domainToPunycode, punycodeToDomain } from './unicode.js';
export { parseQuery, buildQuery } from './query.js';
export { generateVariants } from './variants.js';

export type {
    EncodingContext,
    EncodingMode,
    RFC3986Options,
    FormOptions,
    DecodeOptions,
    SelectiveOptions,
    SafeSetOptions,
    NonAlnumOptions,
    KV,
    QueryMode,
    ParseQueryOptions,
    BuildQueryOptions,
    TransformStep,
    VariantResult,
    VariantConfig,
} from './types.js';

export {
    UNRESERVED,
    RESERVED,
    GEN_DELIMS,
    SUB_DELIMS,
    FORM_SAFE,
} from './constants.js';
