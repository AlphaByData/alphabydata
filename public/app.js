/* KOL Directory App Controller */
document.addEventListener('DOMContentLoaded', () => {
  let currentPreset = 'ALL';
  let currentSort = 'trades_desc';
  let currentSearch = '';
  let kolsData = [];

  // DOM Elements
  const kolGrid = document.getElementById('kol-grid');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const categoryFilters = document.getElementById('category-filters');
  
  // Stats Elements
  const statTotalKols = document.getElementById('stat-total-kols');
  const statTotalTrades = document.getElementById('stat-total-trades');
  const statUniqueTokens = document.getElementById('stat-unique-tokens');
  const statAvgWinrate = document.getElementById('stat-avg-winrate');
  const countAll = document.getElementById('count-all');

  // Modal Elements
  const tradeModal = document.getElementById('trade-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalKolAvatar = document.getElementById('modal-kol-avatar');
  const modalKolName = document.getElementById('modal-kol-name');
  const modalKolSummary = document.getElementById('modal-kol-summary');
  const tradesTbody = document.getElementById('trades-tbody');

  // Initialize
  fetchStats();
  fetchKOLs();

  // Search Input Debounce
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        fetchKOLs();
      }, 250);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      fetchKOLs();
    });
  }

  if (categoryFilters) {
    categoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;

      document.querySelectorAll('.filter-pill').forEach(b => {
        b.classList.remove('bg-rose-600', 'text-white', 'shadow-sm');
        b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      });

      btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      btn.classList.add('bg-rose-600', 'text-white', 'shadow-sm');

      currentPreset = btn.dataset.preset;
      fetchKOLs();
    });
  }

  // Dynamic Ecosystem Box Card Selection
  const appChainPills = document.getElementById('app-chain-pills');
  const activeChainStatus = document.getElementById('active-chain-status');
  const chainStatusTag = document.getElementById('chain-status-tag');

  if (appChainPills) {
    appChainPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.chain-box-btn');
      if (!btn) return;

      document.querySelectorAll('#app-chain-pills .chain-box-btn').forEach(b => {
        b.classList.remove('active', 'border-2', 'border-rose-600', 'bg-rose-500/10');
        b.classList.add('border', 'border-slate-200', 'dark:border-white/10', 'bg-slate-50', 'dark:bg-slate-800/50');
      });

      btn.classList.remove('border', 'border-slate-200', 'dark:border-white/10', 'bg-slate-50', 'dark:bg-slate-800/50');
      btn.classList.add('active', 'border-2', 'border-rose-600', 'bg-rose-500/10');

      const chain = btn.dataset.chain;

      if (chain === 'solana') {
        if (activeChainStatus) activeChainStatus.textContent = 'SOLANA (153 KOLs)';
        if (chainStatusTag) chainStatusTag.innerHTML = '<i class="pi pi-check-circle text-emerald-500"></i> Active Ecosystem Dataset';
        showToast('Active Ecosystem: SOLANA (153 Verified Pure KOLs)');
        fetchKOLs();
      } else {
        const names = { bsc: 'BSC', base: 'BASE L2', eth: 'ETH', robinhood: 'ROBINHOOD' };
        const name = names[chain] || chain.toUpperCase();
        if (activeChainStatus) activeChainStatus.textContent = `${name} (HARVESTING SOON)`;
        if (chainStatusTag) chainStatusTag.innerHTML = `<i class="pi pi-clock text-amber-500"></i> ${name} Pipeline Initializing`;
        showToast(`🚀 ${name} KOL & Smart Money harvesting pipeline launching soon!`);
      }
    });
  }

  // Fetch Platform Stats
  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        const s = json.data;
        if (statTotalKols) statTotalKols.textContent = s.total_kols.toLocaleString();
        if (statTotalTrades) statTotalTrades.textContent = s.total_trades.toLocaleString();
        if (statUniqueTokens) statUniqueTokens.textContent = s.unique_tokens.toLocaleString();
        if (statAvgWinrate) statAvgWinrate.textContent = `${s.avg_win_rate}%`;
        if (countAll) countAll.textContent = s.total_kols;
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  // Fetch KOL Directory
  async function fetchKOLs() {
    if (!kolGrid) return;
    kolGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        <i class="pi pi-spin pi-spinner text-2xl text-rose-600 mb-2"></i>
        <p class="text-sm font-semibold">Harvesting Verified Solana KOL Intelligence...</p>
      </div>
    `;

    try {
      const params = new URLSearchParams({
        filterPreset: currentPreset,
        sortBy: currentSort,
        search: currentSearch
      });

      const res = await fetch(`/api/kols?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        kolsData = json.data;
        renderKOLCards(kolsData);
      } else {
        kolGrid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">Error loading KOL directory</div>`;
      }
    } catch (err) {
      console.error('Error fetching KOLs:', err);
      kolGrid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">Error connecting to server</div>`;
    }
  }

  // Render Pure KOL Cards
  function renderKOLCards(kols) {
    if (kols.length === 0) {
      kolGrid.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
          <i class="pi pi-search text-3xl text-slate-400 mb-2"></i>
          <h3 class="font-outfit text-base font-bold text-slate-900 dark:text-white">No KOLs found matching your search</h3>
          <p class="text-xs text-slate-500 mt-1">Try tweaking your search keywords or filter option.</p>
        </div>
      `;
      return;
    }

    kolGrid.innerHTML = kols.map(kol => {
      const shortWallet = `${kol.wallet_address.slice(0, 4)}...${kol.wallet_address.slice(-4)}`;
      const tagsHtml = (kol.maker_tags || []).slice(0, 5).map(t => `<span class="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">#${t}</span>`).join('');

      return `
        <div class="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-lg flex flex-col justify-between hover:border-rose-500 transition-all space-y-4">
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <img 
                    src="${kol.avatar}" 
                    alt="${kol.maker_name}" 
                    referrerpolicy="no-referrer" 
                    class="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 object-cover bg-slate-100 dark:bg-slate-800" 
                    onerror="if(!this.dataset.tried){this.dataset.tried=true;this.src='https://unavatar.io/twitter/${kol.twitter_username || kol.maker_name}';}else{this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${kol.wallet_address}';}"
                  >
                  <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-slate-900"><i class="pi pi-check"></i></span>
                </div>
                <div>
                  <h3 class="font-outfit font-extrabold text-base text-slate-900 dark:text-white leading-snug">${kol.maker_name || kol.twitter_name || 'Solana KOL'}</h3>
                  ${kol.twitter_username ? `<a href="${kol.twitter_url}" target="_blank" class="text-xs text-sky-500 font-semibold hover:underline"><i class="pi pi-twitter text-[10px]"></i> @${kol.twitter_username}</a>` : '<span class="text-[11px] text-slate-400">No X handle</span>'}
                </div>
              </div>
              <span class="text-[10px] font-black tracking-wide bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full whitespace-nowrap">👑 PURE KOL</span>
            </div>

            <div class="flex flex-wrap gap-1">
              ${tagsHtml}
            </div>

            <div class="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-center">
              <div>
                <span class="font-outfit font-extrabold text-sm text-rose-600 dark:text-rose-400 block">${kol.win_rate}%</span>
                <span class="text-[10px] uppercase font-semibold text-slate-500">Win Rate</span>
              </div>
              <div>
                <span class="font-outfit font-extrabold text-sm text-slate-900 dark:text-white block">${kol.total_trades}</span>
                <span class="text-[10px] uppercase font-semibold text-slate-500">Trades</span>
              </div>
              <div>
                <span class="font-outfit font-extrabold text-sm text-slate-900 dark:text-white block">${kol.total_volume_sol} SOL</span>
                <span class="text-[10px] uppercase font-semibold text-slate-500">Volume</span>
              </div>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-mono text-slate-600 dark:text-slate-300">
              <span class="flex items-center gap-1.5"><i class="pi pi-wallet text-rose-600"></i> ${shortWallet}</span>
              <button onclick="copyWallet('${kol.wallet_address}')" title="Copy Address" class="text-slate-400 hover:text-rose-600 transition-colors">
                <i class="pi pi-copy"></i>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <a href="${kol.jupiter_url}" target="_blank" class="py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-center font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all">
              <i class="pi pi-chart-bar"></i> Jupiter
            </a>
            ${kol.twitter_url ? `
              <a href="${kol.twitter_url}" target="_blank" class="py-2 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 text-center font-bold text-xs hover:bg-sky-500 hover:text-white transition-all">
                <i class="pi pi-twitter"></i> Follow X
              </a>
            ` : `
              <button class="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold cursor-not-allowed opacity-50">
                <i class="pi pi-twitter"></i> No X
              </button>
            `}
            <button onclick="inspectKOL('${kol.wallet_address}')" class="col-span-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-center font-bold text-xs transition-all">
              <i class="pi pi-history"></i> Inspect Trades
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Copy Wallet Address
  window.copyWallet = function(wallet) {
    navigator.clipboard.writeText(wallet).then(() => {
      showToast(`Copied ${wallet.slice(0, 6)}...${wallet.slice(-4)} to clipboard!`);
    }).catch(() => {
      showToast(`Wallet: ${wallet}`);
    });
  };

  // Inspect KOL Trades
  window.inspectKOL = async function(wallet) {
    if (!tradeModal || !tradesTbody) return;
    tradeModal.classList.remove('opacity-0', 'pointer-events-none');
    tradeModal.querySelector('div').classList.remove('translate-y-full');

    tradesTbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-slate-400">
          <i class="pi pi-spin pi-spinner text-rose-600 text-lg mb-1 block"></i> Loading trade history...
        </td>
      </tr>
    `;

    try {
      const res = await fetch(`/api/kol/${wallet}`);
      const json = await res.json();

      if (json.success) {
        const kol = json.data;
        if (modalKolAvatar) modalKolAvatar.src = kol.avatar;
        if (modalKolName) modalKolName.innerHTML = `${kol.maker_name || kol.twitter_name} <span class="text-xs font-normal text-slate-400">(${kol.wallet_address.slice(0, 5)}...${kol.wallet_address.slice(-4)})</span>`;

        if (modalKolSummary) {
          modalKolSummary.innerHTML = `
            <div>
              <span class="font-outfit font-extrabold text-sm text-rose-600 block">${kol.win_rate}%</span>
              <span class="text-[10px] font-semibold text-slate-500 uppercase">Win Rate</span>
            </div>
            <div>
              <span class="font-outfit font-extrabold text-sm text-slate-900 dark:text-white block">${kol.total_trades}</span>
              <span class="text-[10px] font-semibold text-slate-500 uppercase">Total Trades</span>
            </div>
            <div>
              <span class="font-outfit font-extrabold text-sm text-slate-900 dark:text-white block">${kol.total_volume_sol} SOL</span>
              <span class="text-[10px] font-semibold text-slate-500 uppercase">Volume</span>
            </div>
          `;
        }

        if (kol.recent_trades.length === 0) {
          tradesTbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">No recent trades ingested for this KOL.</td></tr>`;
          return;
        }

        tradesTbody.innerHTML = kol.recent_trades.map(t => {
          const isBuy = t.trade_type === 'BUY';
          const typeBadge = isBuy ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30';
          const dateStr = new Date(t.timestamp).toLocaleDateString() + ' ' + new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const jupSwap = `https://jup.ag/swap/SOL-${t.token_address}`;

          return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td class="py-2.5"><span class="px-2 py-0.5 rounded border text-[10px] font-bold ${typeBadge}">${t.trade_type}</span></td>
              <td class="py-2.5 font-bold text-slate-900 dark:text-white">${t.token_symbol}</td>
              <td class="py-2.5 font-semibold text-slate-900 dark:text-white">${t.amount_sol} SOL</td>
              <td class="py-2.5">$${t.price_usd ? parseFloat(t.price_usd).toFixed(6) : '0.00'}</td>
              <td class="py-2.5 text-[11px] text-slate-400">${dateStr}</td>
              <td class="py-2.5">
                <a href="${jupSwap}" target="_blank" class="text-rose-600 hover:underline font-bold">Swap JUP <i class="pi pi-external-link text-[10px]"></i></a>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Inspect error:', err);
      tradesTbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-rose-500 font-bold">Error fetching trade history.</td></tr>`;
    }
  };

  // Close Modal
  if (modalCloseBtn && tradeModal) {
    const closeModal = () => {
      tradeModal.classList.add('opacity-0', 'pointer-events-none');
      tradeModal.querySelector('div').classList.add('translate-y-full');
    };
    modalCloseBtn.addEventListener('click', closeModal);
    tradeModal.addEventListener('click', (e) => {
      if (e.target === tradeModal) closeModal();
    });
  }

  // Toast Function
  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 3000);
  }
});
