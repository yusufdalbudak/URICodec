import {
    parseQuery,
    buildQuery,
    type QueryMode,
    type KV,
} from '../../lib/index.js';

export function renderQueryPanel(): string {
    return `
    <div class="glass-panel fade-in">
        <div class="panel-title">Query String Parser</div>
        <div class="controls-row">
            <div class="control-group">
                <label>Decode Mode</label>
                <select id="qs-parse-mode">
                    <option value="percent">Percent (%XX)</option>
                    <option value="form">Form (+/space)</option>
                </select>
            </div>
        </div>
        <textarea id="qs-input" rows="2" placeholder="a=1&b=hello%20world&c=3" style="margin-top: 0.75rem;"></textarea>
        <div class="btn-row">
            <button class="btn btn-primary" id="qs-parse">📋 Parse</button>
            <button class="btn btn-secondary" id="qs-clear-parse">Clear</button>
        </div>
        <div id="qs-parse-result" style="margin-top: 0.75rem;"></div>
    </div>

    <div class="glass-panel fade-in">
        <div class="panel-title">Query String Builder</div>
        <div class="controls-row">
            <div class="control-group">
                <label>Encode Mode</label>
                <select id="qs-build-mode">
                    <option value="percent">Percent (%XX)</option>
                    <option value="form">Form (+/space)</option>
                </select>
            </div>
            <label class="toggle">
                <input type="checkbox" id="qs-sort" />
                Sort by Key
            </label>
        </div>
        <div id="qs-kv-editor" style="margin-top: 0.75rem;">
            <div class="kv-row-inputs" data-idx="0" style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">
                <input type="text" class="kv-key" placeholder="key" style="flex:1;" />
                <input type="text" class="kv-val" placeholder="value" style="flex:1;" />
            </div>
        </div>
        <div class="btn-row">
            <button class="btn btn-secondary" id="qs-add-pair">+ Add Pair</button>
            <button class="btn btn-primary" id="qs-build">🔧 Build</button>
        </div>
        <div class="output-area empty" id="qs-build-result" style="margin-top: 0.75rem;">
            Built query string will appear here...
        </div>
    </div>`;
}

export function initQueryPanel(): void {
    document.getElementById('qs-parse')!.addEventListener('click', runParse);
    document.getElementById('qs-clear-parse')!.addEventListener('click', () => {
        (document.getElementById('qs-input') as HTMLTextAreaElement).value = '';
        document.getElementById('qs-parse-result')!.innerHTML = '';
    });
    document.getElementById('qs-add-pair')!.addEventListener('click', addKvRow);
    document.getElementById('qs-build')!.addEventListener('click', runBuild);
}

function runParse(): void {
    const input = (document.getElementById('qs-input') as HTMLTextAreaElement).value;
    const mode = (document.getElementById('qs-parse-mode') as HTMLSelectElement).value as QueryMode;
    const pairs = parseQuery(input, { mode });
    const container = document.getElementById('qs-parse-result')!;

    if (pairs.length === 0) {
        container.innerHTML = '<div class="output-area empty">No parameters found</div>';
        return;
    }

    container.innerHTML = `
    <table class="kv-table">
        <thead><tr><th>#</th><th>Key</th><th>Value</th></tr></thead>
        <tbody>
            ${pairs.map((kv, i) => `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.75rem;">${i + 1}</td>
                    <td>${escapeHtml(kv.key)}</td>
                    <td>${escapeHtml(kv.value) || '<span style="color:var(--text-muted);font-style:italic">(empty)</span>'}</td>
                </tr>`).join('')}
        </tbody>
    </table>`;
}

function addKvRow(): void {
    const editor = document.getElementById('qs-kv-editor')!;
    const row = document.createElement('div');
    row.className = 'kv-row-inputs';
    row.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:0.5rem;';
    row.innerHTML = `
        <input type="text" class="kv-key" placeholder="key" style="flex:1;" />
        <input type="text" class="kv-val" placeholder="value" style="flex:1;" />
        <button class="btn btn-secondary" style="padding:0.4rem 0.6rem;font-size:0.75rem;" onclick="this.parentElement.remove()">✕</button>`;
    editor.appendChild(row);
}

function runBuild(): void {
    const mode = (document.getElementById('qs-build-mode') as HTMLSelectElement).value as QueryMode;
    const sort = (document.getElementById('qs-sort') as HTMLInputElement).checked;
    const rows = document.querySelectorAll('.kv-row-inputs');
    const kvList: KV[] = [];

    rows.forEach(row => {
        const key = (row.querySelector('.kv-key') as HTMLInputElement).value;
        const value = (row.querySelector('.kv-val') as HTMLInputElement).value;
        if (key || value) kvList.push({ key, value });
    });

    const result = buildQuery(kvList, { mode, sort });
    const outEl = document.getElementById('qs-build-result')!;
    outEl.textContent = result || '(empty)';
    outEl.className = result ? 'output-area' : 'output-area empty';
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
