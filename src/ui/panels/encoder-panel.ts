import {
    encodeRFC3986,
    decodePercent,
    normalizePercent,
    encodeForm,
    decodeForm,
    iriToUri,
    uriToIri,
    type EncodingContext,
} from '../../lib/index.js';

export function renderEncoderPanel(): string {
    return `
    <div class="glass-panel fade-in">
        <div class="panel-title">Mode & Context</div>
        <div class="controls-row">
            <div class="control-group">
                <label>Mode</label>
                <select id="enc-mode">
                    <option value="rfc3986">RFC 3986 (Percent)</option>
                    <option value="form">Form (x-www-form-urlencoded)</option>
                    <option value="iri">IRI → URI</option>
                    <option value="iri-reverse">URI → IRI</option>
                </select>
            </div>
            <div class="control-group">
                <label>Context</label>
                <select id="enc-context">
                    <option value="full">Full URI</option>
                    <option value="path">Path</option>
                    <option value="pathSegment">Path Segment</option>
                    <option value="query">Query</option>
                    <option value="fragment">Fragment</option>
                </select>
            </div>
            <div class="control-group">
                <label>Direction</label>
                <select id="enc-direction">
                    <option value="encode">Encode</option>
                    <option value="decode">Decode</option>
                    <option value="normalize">Normalize</option>
                </select>
            </div>
            <div class="control-group">
                <label>Passes (N)</label>
                <input type="number" id="enc-passes" value="1" min="1" max="20" />
            </div>
        </div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Options</div>
        <div class="toggle-row">
            <label class="toggle">
                <input type="checkbox" id="opt-keepReserved" />
                Keep Reserved
            </label>
            <label class="toggle">
                <input type="checkbox" id="opt-strict" />
                Strict Mode
            </label>
            <label class="toggle">
                <input type="checkbox" id="opt-reencodePercent" />
                Re-encode %
            </label>
            <label class="toggle">
                <input type="checkbox" id="opt-untilStable" />
                Decode Until Stable
            </label>
        </div>
        <div class="controls-row" style="margin-top: 0.75rem;">
            <div class="control-group">
                <label>Extra Safe Set</label>
                <input type="text" id="opt-safeSet" placeholder="e.g. !@#" />
            </div>
        </div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Input</div>
        <textarea id="enc-input" rows="4" placeholder="Enter text to encode/decode..."></textarea>
        <div class="btn-row">
            <button class="btn btn-primary" id="enc-run">⚡ Transform</button>
            <button class="btn btn-secondary" id="enc-clear">Clear</button>
            <button class="btn btn-secondary" id="enc-swap">⇅ Swap Input/Output</button>
        </div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Output</div>
        <div class="output-area empty" id="enc-output">Result will appear here...</div>
        <div class="trace" id="enc-trace"></div>
    </div>`;
}

export function initEncoderPanel(): void {
    const runBtn = document.getElementById('enc-run')!;
    const clearBtn = document.getElementById('enc-clear')!;
    const swapBtn = document.getElementById('enc-swap')!;

    runBtn.addEventListener('click', runEncoder);
    clearBtn.addEventListener('click', () => {
        (document.getElementById('enc-input') as HTMLTextAreaElement).value = '';
        const out = document.getElementById('enc-output')!;
        out.textContent = 'Result will appear here...';
        out.className = 'output-area empty';
        document.getElementById('enc-trace')!.innerHTML = '';
    });
    swapBtn.addEventListener('click', () => {
        const inp = document.getElementById('enc-input') as HTMLTextAreaElement;
        const out = document.getElementById('enc-output')!;
        if (!out.classList.contains('empty')) {
            inp.value = out.textContent || '';
        }
    });

    // Auto-run on Enter in textarea
    (document.getElementById('enc-input') as HTMLTextAreaElement).addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            runEncoder();
        }
    });
}

function runEncoder(): void {
    const input = (document.getElementById('enc-input') as HTMLTextAreaElement).value;
    const mode = (document.getElementById('enc-mode') as HTMLSelectElement).value;
    const context = (document.getElementById('enc-context') as HTMLSelectElement).value as EncodingContext;
    const direction = (document.getElementById('enc-direction') as HTMLSelectElement).value;
    const passes = parseInt((document.getElementById('enc-passes') as HTMLInputElement).value) || 1;

    const keepReserved = (document.getElementById('opt-keepReserved') as HTMLInputElement).checked;
    const strict = (document.getElementById('opt-strict') as HTMLInputElement).checked;
    const reencodePercent = (document.getElementById('opt-reencodePercent') as HTMLInputElement).checked;
    const untilStable = (document.getElementById('opt-untilStable') as HTMLInputElement).checked;
    const safeSet = (document.getElementById('opt-safeSet') as HTMLInputElement).value;

    let result = '';
    const traceSteps: string[] = [];

    try {
        if (mode === 'iri') {
            result = iriToUri(input);
            traceSteps.push('iriToUri()');
        } else if (mode === 'iri-reverse') {
            result = uriToIri(input);
            traceSteps.push('uriToIri()');
        } else if (mode === 'form') {
            if (direction === 'encode') {
                let r = input;
                for (let i = 0; i < passes; i++) {
                    r = encodeForm(r, { safeSet, strict });
                }
                result = r;
                traceSteps.push(`encodeForm(×${passes})`);
            } else if (direction === 'decode') {
                result = decodeForm(input, { times: passes, untilStable, strict });
                traceSteps.push(`decodeForm(${untilStable ? 'untilStable' : `×${passes}`})`);
            } else {
                result = normalizePercent(input, { strict });
                traceSteps.push('normalizePercent()');
            }
        } else {
            // RFC 3986
            if (direction === 'encode') {
                let r = input;
                for (let i = 0; i < passes; i++) {
                    r = encodeRFC3986(r, {
                        context,
                        keepReserved,
                        safeSet,
                        reencodePercent: i > 0 || reencodePercent,
                        strict,
                    });
                }
                result = r;
                traceSteps.push(`encodeRFC3986(${context}${keepReserved ? ', keepReserved' : ''}, ×${passes})`);
            } else if (direction === 'decode') {
                result = decodePercent(input, { times: passes, untilStable, strict });
                traceSteps.push(`decodePercent(${untilStable ? 'untilStable' : `×${passes}`})`);
            } else {
                result = normalizePercent(input, { strict });
                traceSteps.push('normalizePercent(upperHex)');
            }
        }
    } catch (err) {
        result = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }

    const outEl = document.getElementById('enc-output')!;
    outEl.textContent = result;
    outEl.className = 'output-area';

    // Add copy button
    let copyBtn = outEl.querySelector('.copy-btn');
    if (!copyBtn) {
        copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋 Copy';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(result);
            (copyBtn as HTMLButtonElement).textContent = '✓ Copied';
            setTimeout(() => { (copyBtn as HTMLButtonElement).textContent = '📋 Copy'; }, 1500);
        });
        outEl.appendChild(copyBtn);
    }

    // Render trace
    const traceEl = document.getElementById('enc-trace')!;
    traceEl.innerHTML = traceSteps
        .map(s => `<span class="trace-step">${s}</span>`)
        .join('<span class="trace-arrow"> → </span>');
}
