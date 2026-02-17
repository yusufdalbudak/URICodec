/**
 * Multi-pass and variant-generation transforms.
 */

/**
 * Apply an encoding function N times (double-encode, triple-encode, etc.).
 */
export function encodeNTimes(input: string, n: number, encodeFn: (s: string) => string): string {
    let result = input;
    for (let i = 0; i < n; i++) {
        result = encodeFn(result);
    }
    return result;
}

/**
 * Apply a decoding function N times.
 */
export function decodeNTimes(input: string, n: number, decodeFn: (s: string) => string): string {
    let result = input;
    for (let i = 0; i < n; i++) {
        result = decodeFn(result);
    }
    return result;
}

/**
 * Decode iteratively until the output stabilizes (no more changes).
 * Safety cap at `maxIterations` to prevent infinite loops.
 */
export function decodeUntilStable(
    input: string,
    decodeFn: (s: string) => string,
    maxIterations: number = 10,
): string {
    let result = input;
    for (let i = 0; i < maxIterations; i++) {
        const next = decodeFn(result);
        if (next === result) return result;
        result = next;
    }
    return result;
}

/**
 * Generate mixed-case variants of percent-encoded sequences.
 * For each %XX triplet, produces a random upper/lower variant.
 * Deterministic seed based on position for reproducibility.
 */
export function mixedCasePercent(input: string): string {
    let out = '';
    for (let i = 0; i < input.length;) {
        if (input[i] === '%' && i + 2 < input.length) {
            const h1 = input[i + 1];
            const h2 = input[i + 2];
            if (isHexDigit(h1) && isHexDigit(h2)) {
                // Alternate: first hex char lowercase, second uppercase (or vice versa)
                // Use position-based deterministic pattern for reproducibility
                const useLowerFirst = (i / 3) % 2 === 0;
                out += '%';
                out += useLowerFirst ? h1.toLowerCase() : h1.toUpperCase();
                out += useLowerFirst ? h2.toUpperCase() : h2.toLowerCase();
                i += 3;
                continue;
            }
        }
        out += input[i];
        i += 1;
    }
    return out;
}

function isHexDigit(c: string): boolean {
    const code = c.charCodeAt(0);
    return (code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x46) || (code >= 0x61 && code <= 0x66);
}
