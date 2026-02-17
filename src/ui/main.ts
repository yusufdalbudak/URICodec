import './styles.css';
import { renderEncoderPanel, initEncoderPanel } from './panels/encoder-panel.js';
import { renderVariantPanel, initVariantPanel } from './panels/variant-panel.js';
import { renderQueryPanel, initQueryPanel } from './panels/query-panel.js';
import { renderDomainPanel, initDomainPanel } from './panels/domain-panel.js';

type TabId = 'encoder' | 'variants' | 'query' | 'domain';

const panels: Record<TabId, { render: () => string; init: () => void }> = {
    encoder: { render: renderEncoderPanel, init: initEncoderPanel },
    variants: { render: renderVariantPanel, init: initVariantPanel },
    query: { render: renderQueryPanel, init: initQueryPanel },
    domain: { render: renderDomainPanel, init: initDomainPanel },
};

let activeTab: TabId = 'encoder';

function switchTab(tabId: TabId): void {
    activeTab = tabId;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Render panel
    const content = document.getElementById('tab-content')!;
    content.innerHTML = panels[tabId].render();
    panels[tabId].init();
}

function init(): void {
    // Wire up tabs
    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab') as TabId;
            if (tabId && tabId !== activeTab) {
                switchTab(tabId);
            }
        });
    });

    // Show default tab
    switchTab('encoder');
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
