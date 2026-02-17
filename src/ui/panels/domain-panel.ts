import {
    domainToPunycode,
    punycodeToDomain,
} from '../../lib/index.js';

export function renderDomainPanel(): string {
    return `
    <div class="glass-panel fade-in">
        <div class="panel-title">Domain ↔ Punycode Transform</div>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
            Convert between Unicode domain names and their Punycode (xn--) representation.
            Supports both bare domains and full URLs.
        </p>

        <div class="controls-row">
            <div class="control-group">
                <label>Direction</label>
                <select id="dom-direction">
                    <option value="encode">Unicode → Punycode</option>
                    <option value="decode">Punycode → Unicode</option>
                </select>
            </div>
        </div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Input</div>
        <textarea id="dom-input" rows="2" placeholder="e.g. münchen.de or https://münchen.de/path"></textarea>
        <div class="btn-row">
            <button class="btn btn-primary" id="dom-run">🌐 Transform</button>
            <button class="btn btn-secondary" id="dom-clear">Clear</button>
            <button class="btn btn-secondary" id="dom-swap">⇅ Swap</button>
        </div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Output</div>
        <div class="output-area empty" id="dom-output">Result will appear here...</div>
    </div>`;
}

export function initDomainPanel(): void {
    document.getElementById('dom-run')!.addEventListener('click', runDomain);
    document.getElementById('dom-clear')!.addEventListener('click', () => {
        (document.getElementById('dom-input') as HTMLTextAreaElement).value = '';
        const out = document.getElementById('dom-output')!;
        out.textContent = 'Result will appear here...';
        out.className = 'output-area empty';
    });
    document.getElementById('dom-swap')!.addEventListener('click', () => {
        const inp = document.getElementById('dom-input') as HTMLTextAreaElement;
        const out = document.getElementById('dom-output')!;
        const dir = document.getElementById('dom-direction') as HTMLSelectElement;
        if (!out.classList.contains('empty')) {
            inp.value = out.textContent || '';
            dir.value = dir.value === 'encode' ? 'decode' : 'encode';
        }
    });

    (document.getElementById('dom-input') as HTMLTextAreaElement).addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            runDomain();
        }
    });
}

function runDomain(): void {
    const input = (document.getElementById('dom-input') as HTMLTextAreaElement).value;
    const direction = (document.getElementById('dom-direction') as HTMLSelectElement).value;

    let result = '';
    try {
        result = direction === 'encode'
            ? domainToPunycode(input)
            : punycodeToDomain(input);
    } catch (err) {
        result = `Error: ${err instanceof Error ? err.message : String(err)}`;
    }

    const outEl = document.getElementById('dom-output')!;
    outEl.textContent = result;
    outEl.className = 'output-area';

    // Copy button
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
}
