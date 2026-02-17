import {
    generateVariants,
    type EncodingContext,
    type VariantConfig,
} from '../../lib/index.js';

export function renderVariantPanel(): string {
    return `
    <div class="glass-panel fade-in">
        <div class="panel-title">Variant Configuration</div>
        <div class="controls-row">
            <div class="control-group">
                <label>Context</label>
                <select id="var-context">
                    <option value="full">Full URI</option>
                    <option value="path">Path</option>
                    <option value="pathSegment">Path Segment</option>
                    <option value="query">Query</option>
                    <option value="fragment">Fragment</option>
                </select>
            </div>
            <div class="control-group">
                <label>Selective Chars</label>
                <input type="text" id="var-selective" placeholder="e.g. $!@" />
            </div>
            <div class="control-group">
                <label>Multi-encode N</label>
                <input type="number" id="var-encodeN" value="2" min="2" max="10" />
            </div>
            <div class="control-group">
                <label>Max Decode Iter</label>
                <input type="number" id="var-maxIter" value="10" min="1" max="50" />
            </div>
        </div>
        <div class="toggle-row" style="margin-top: 0.75rem;">
            <label class="toggle">
                <input type="checkbox" id="var-keepReserved" />
                Keep Reserved
            </label>
        </div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Input</div>
        <textarea id="var-input" rows="3" placeholder="Enter a URL or text to generate all variants..."></textarea>
        <div class="btn-row">
            <button class="btn btn-primary" id="var-run">🔀 Generate Variants</button>
            <button class="btn btn-secondary" id="var-clear">Clear</button>
        </div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Variants (12 types)</div>
        <div class="variant-grid" id="var-results">
            <div class="output-area empty">Generate variants to see results...</div>
        </div>
    </div>`;
}

export function initVariantPanel(): void {
    document.getElementById('var-run')!.addEventListener('click', runVariants);
    document.getElementById('var-clear')!.addEventListener('click', () => {
        (document.getElementById('var-input') as HTMLTextAreaElement).value = '';
        document.getElementById('var-results')!.innerHTML =
            '<div class="output-area empty">Generate variants to see results...</div>';
    });

    (document.getElementById('var-input') as HTMLTextAreaElement).addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            runVariants();
        }
    });
}

function runVariants(): void {
    const input = (document.getElementById('var-input') as HTMLTextAreaElement).value;
    if (!input) return;

    const config: VariantConfig = {
        context: (document.getElementById('var-context') as HTMLSelectElement).value as EncodingContext,
        selectiveChars: (document.getElementById('var-selective') as HTMLInputElement).value,
        encodeN: parseInt((document.getElementById('var-encodeN') as HTMLInputElement).value) || 2,
        maxDecodeIterations: parseInt((document.getElementById('var-maxIter') as HTMLInputElement).value) || 10,
        keepReserved: (document.getElementById('var-keepReserved') as HTMLInputElement).checked,
    };

    const variants = generateVariants(input, config);
    const grid = document.getElementById('var-results')!;

    grid.innerHTML = variants
        .map(v => {
            const traceHtml = v.trace
                .map(s => `<span class="trace-step">${s.name}(${Object.entries(s.params).map(([k, val]) => `${k}=${val}`).join(', ')})</span>`)
                .join('<span class="trace-arrow"> → </span>');

            return `
            <div class="variant-card">
                <div class="variant-header">
                    <span class="variant-id">#${v.id}</span>
                    <span class="variant-label">${v.label}</span>
                </div>
                <div class="variant-value">${escapeHtml(v.value)}</div>
                <div class="trace">${traceHtml}</div>
            </div>`;
        })
        .join('');
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
