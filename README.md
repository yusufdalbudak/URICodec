<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tests-101%20passing-34D399?logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-A78BFA" alt="License" />
</p>

<h1 align="center">🔗 URICodec</h1>

<p align="center">
  <strong>A comprehensive URL/URI encoding, decoding, normalization & variant generation toolkit</strong>
  <br />
  Built with TypeScript • Zero-dependency core • Dark-mode web UI
</p>

---

## ✨ Features

- **RFC 3986 Percent-Encoding** — Context-aware encoding for path, query, fragment with `keepReserved` and `reencodePercent` toggles
- **Form Encoding** — Full `application/x-www-form-urlencoded` with correct UTF-8 multi-byte handling
- **Multi-Pass Transforms** — N-encode, N-decode, decode-until-stable, mixed-case percent triplets
- **Selective Encoding** — Encode only specific characters, non-alphanumeric, or everything except a custom safe set
- **Unicode / IRI / Punycode** — IRI ↔ URI conversion, Unicode domain ↔ Punycode (xn--) for bare domains and full URLs
- **Query String Utilities** — Parse and build query strings with mode-aware encoding, repeated keys, and optional sorting
- **Variant Generation** — Generate all 12 encoding variants of a URL in one call, each with a full transform trace
- **Strict & Lenient Modes** — Configurable error handling for malformed percent sequences
- **Web UI** — Dark-mode glassmorphism SPA with tabbed panels for every feature

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation & Setup

```bash
git clone https://github.com/yusufdalbudak/URICodec.git
cd URICodec
npm install
```

### Development Server

```bash
npm run dev
# → http://localhost:5173/
```

### Run Tests

```bash
npm test
# 101 tests across 6 suites
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture

```
URICodec/
├── src/
│   ├── lib/                    # Zero-dependency core library
│   │   ├── index.ts            # Public API barrel export
│   │   ├── types.ts            # TypeScript interfaces & type aliases
│   │   ├── constants.ts        # Character sets (UNRESERVED, RESERVED, etc.)
│   │   ├── percent.ts          # RFC 3986 percent-encoding engine
│   │   ├── form.ts             # application/x-www-form-urlencoded
│   │   ├── multipass.ts        # N-encode, decode-until-stable, mixed-case
│   │   ├── selective.ts        # Policy-based selective encoding
│   │   ├── unicode.ts          # IRI/URI conversion, Punycode domain transforms
│   │   ├── query.ts            # Query string parse & build
│   │   └── variants.ts         # 12-variant generator with transform traces
│   └── ui/                     # Web UI (Vite + vanilla TS)
│       ├── main.ts             # App entry point & tab routing
│       ├── styles.css          # Dark glassmorphism design system
│       └── panels/
│           ├── encoder-panel.ts
│           ├── variant-panel.ts
│           ├── query-panel.ts
│           └── domain-panel.ts
├── tests/                      # Vitest unit tests (101 tests)
│   ├── percent.test.ts         # 29 tests
│   ├── form.test.ts            # 15 tests
│   ├── unicode.test.ts         # 16 tests
│   ├── selective.test.ts       # 14 tests
│   ├── query.test.ts           # 14 tests
│   └── variants.test.ts        # 13 tests
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

The core library under `src/lib/` has **zero browser or Node.js-specific dependencies** (aside from `punycode/` for IDN transforms) and can be imported directly into any JavaScript/TypeScript project.

---

## 📖 API Reference

### Percent Encoding (`percent.ts`)

#### `encodeRFC3986(input, options?)`

RFC 3986–compliant percent-encoding with context awareness.

```typescript
import { encodeRFC3986 } from './src/lib/index';

// Basic encoding
encodeRFC3986('hello world');
// → 'hello%20world'

// Path segment context (allows : and @ per RFC 3986)
encodeRFC3986('a/b:c@d', { context: 'pathSegment' });
// → 'a%2Fb:c@d'

// Keep reserved characters
encodeRFC3986('path/to?q=1', { context: 'full', keepReserved: true });
// → 'path/to?q=1'

// Re-encode existing percent sequences (for double-encoding)
encodeRFC3986('hello%20world', { reencodePercent: true });
// → 'hello%2520world'
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `context` | `'full' \| 'path' \| 'pathSegment' \| 'query' \| 'fragment'` | `'full'` | Determines which characters are allowed unencoded |
| `keepReserved` | `boolean` | `false` | If `true`, reserved characters (`:/?#[]@!$&'()*+,;=`) are left as-is |
| `reencodePercent` | `boolean` | `false` | If `true`, existing `%` characters are re-encoded as `%25` |
| `safeSet` | `string` | `''` | Additional characters to leave unencoded |
| `strict` | `boolean` | `false` | If `true`, throws on malformed percent sequences |

#### `decodePercent(input, options?)`

Decodes percent-encoded sequences.

```typescript
import { decodePercent } from './src/lib/index';

decodePercent('hello%20world');
// → 'hello world'

// Decode N times
decodePercent('%2520', { times: 2 });
// → ' '

// Decode until stable
decodePercent('%252520', { untilStable: true });
// → ' '
```

#### `normalizePercent(input, options?)`

Uppercases hex digits and decodes unreserved characters per RFC 3986 §2.3.

```typescript
import { normalizePercent } from './src/lib/index';

normalizePercent('%3a%2f%61');
// → '%3A%2Fa'  (uppercase hex, decode unreserved 'a')
```

---

### Form Encoding (`form.ts`)

#### `encodeForm(input, options?)` / `decodeForm(input, options?)`

Full `application/x-www-form-urlencoded` encoding with correct UTF-8 multi-byte support.

```typescript
import { encodeForm, decodeForm } from './src/lib/index';

encodeForm('hello world');
// → 'hello+world'

encodeForm('München straße');
// → 'M%C3%BCnchen+stra%C3%9Fe'

decodeForm('M%C3%BCnchen+stra%C3%9Fe');
// → 'München straße'

// Decode until stable (each pass decodes one encoding layer)
decodeForm('%252B', { untilStable: true });
// → ' '
```

---

### Multi-Pass Transforms (`multipass.ts`)

```typescript
import { encodeNTimes, decodeNTimes, decodeUntilStable, mixedCasePercent } from './src/lib/index';

// Double-encode
encodeNTimes('hello world', 2);
// → 'hello%2520world'

// Mixed-case variant (WAF bypass testing)
mixedCasePercent('hello%20world%3F');
// → 'hello%20world%3f'  (alternates case of hex digits)
```

---

### Selective Encoding (`selective.ts`)

```typescript
import { selectiveEncode, encodeNonAlnum, encodeExceptSafeSet } from './src/lib/index';

// Encode only specific characters
selectiveEncode('a=b&c=d', { charsToEncode: '&=' });
// → 'a%3Db%26c%3Dd'

// Encode everything that isn't alphanumeric
encodeNonAlnum('hello!world@2024');
// → 'hello%21world%402024'

// Encode everything except a custom safe set
encodeExceptSafeSet('ABC-123_test', { safeSet: 'ABCabc123' });
// → 'ABC%2D123%5Ftest'
```

---

### Unicode / IRI / Punycode (`unicode.ts`)

```typescript
import { iriToUri, uriToIri, domainToPunycode, punycodeToDomain } from './src/lib/index';

// IRI → URI (encode non-ASCII in path/query)
iriToUri('https://example.com/café?q=über');
// → 'https://example.com/caf%C3%A9?q=%C3%BCber'

// URI → IRI (decode safe Unicode back)
uriToIri('https://example.com/caf%C3%A9');
// → 'https://example.com/café'

// Domain Punycode (works with bare domains and full URLs)
domainToPunycode('münchen.de');
// → 'xn--mnchen-3ya.de'

domainToPunycode('https://münchen.de/path?q=1');
// → 'https://xn--mnchen-3ya.de/path?q=1'

punycodeToDomain('xn--mnchen-3ya.de');
// → 'münchen.de'
```

---

### Query String Utilities (`query.ts`)

```typescript
import { parseQuery, buildQuery } from './src/lib/index';

// Parse a query string into key-value pairs
parseQuery('a=1&b=hello%20world&c=3');
// → [{ key: 'a', value: '1' }, { key: 'b', value: 'hello world' }, { key: 'c', value: '3' }]

// Parse with form-decoding mode ('+' → space)
parseQuery('q=hello+world', { mode: 'form' });
// → [{ key: 'q', value: 'hello world' }]

// Build a query string from key-value pairs
buildQuery([
  { key: 'search', value: 'hello world' },
  { key: 'page', value: '2' },
], { mode: 'form', sort: true });
// → 'page=2&search=hello+world'
```

---

### Variant Generation (`variants.ts`)

Generate all 12 encoding variants of a URL in one call. Each variant includes a label, the transformed value, and a trace of which functions were applied.

```typescript
import { generateVariants } from './src/lib/index';

const variants = generateVariants('https://münchen.de/path?q=hello world', {
  context: 'full',
  encodeN: 2,
});

// Returns 12 VariantResult objects:
// #1  RFC3986 canonical
// #2  RFC3986 keep-reserved
// #3  Form encode (space → +)
// #4  Selective encode
// #5  Encode non-alphanumeric
// #6  Encode except safe set
// #7  Multi-encode (N=2)
// #8  Mixed-case percent
// #9  Decode once
// #10 Decode until stable
// #11 Normalize → encode
// #12 Domain → Punycode
```

**Configuration:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `context` | `EncodingContext` | `'full'` | Encoding context for variants |
| `selectiveChars` | `string` | `''` | Characters for selective encode (#4) |
| `safeSet` | `string` | `UNRESERVED` | Safe set for variant #6 |
| `encodeN` | `number` | `2` | Passes for multi-encode (#7) |
| `maxDecodeIterations` | `number` | `10` | Max iterations for decode-until-stable (#10) |
| `keepReserved` | `boolean` | `false` | Keep reserved chars in applicable variants |

---

## 🖥️ Web UI

The web UI is a single-page application with four tabbed panels:

| Tab | Description |
|-----|-------------|
| **Encoder / Decoder** | RFC 3986 and form encoding with mode, context, direction, passes, and toggle options |
| **Variant Generator** | Generate all 12 variants with configurable parameters and transform traces |
| **Query Strings** | Parse query strings into key-value tables, build from editable key-value pairs |
| **Domain Transform** | Bidirectional Unicode ↔ Punycode conversion for domains and full URLs |

**Keyboard shortcuts:**
- `Cmd/Ctrl + Enter` — Run the current transform

---

## 🧪 Testing

The test suite covers 101 cases across 6 files:

```
✓ tests/percent.test.ts     29 tests — context modes, strict/lenient, normalization
✓ tests/form.test.ts        15 tests — UTF-8 round-trips, decode-until-stable, edge cases
✓ tests/unicode.test.ts     16 tests — IRI/URI, punycode domains in full URLs
✓ tests/selective.test.ts   14 tests — selective encode, non-alnum, safe set
✓ tests/query.test.ts       14 tests — parse/build, repeated keys, sorting, modes
✓ tests/variants.test.ts    13 tests — all 12 variants, config options, Unicode domains
```

```bash
# Run all tests
npm test

# Watch mode during development
npm run test:watch
```

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript 5.7 |
| Bundler | Vite 6 |
| Test Runner | Vitest 3 |
| IDN/Punycode | `punycode/` (sole runtime dependency) |
| UI | Vanilla TypeScript + CSS (no framework) |

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/yusufdalbudak">Yusuf Dalbudak</a>
</p>
