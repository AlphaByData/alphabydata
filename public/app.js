/* KOL Directory App Controller */
document.addEventListener('DOMContentLoaded', () => {
  let currentPreset = 'ALL';
  let currentSort = 'trades_desc';
  let currentSearch = '';
  let selectedChain = 'solana';
  let currentPage = 1;
  const itemsPerPage = 20;
  let kolsData = [];

  // DOM Elements
  const kolGrid = document.getElementById('kol-grid');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const categoryFilters = document.getElementById('category-filters');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationControls = document.getElementById('pagination-controls');
  
  // Stats Elements
  const statTotalKols = document.getElementById('stat-total-kols');
  const statTotalTrades = document.getElementById('stat-total-trades');
  const statUniqueTokens = document.getElementById('stat-unique-tokens');
  const statAvgWinrate = document.getElementById('stat-avg-winrate');
  const countAll = document.getElementById('count-all');

  // Stats Accordion Elements
  const statsAccordionToggle = document.getElementById('stats-accordion-toggle');
  const statsAccordionBody = document.getElementById('stats-accordion-body');
  const statsAccordionChevron = document.getElementById('stats-accordion-chevron');

  // Ecosystem Chain Accordion Elements
  const chainAccordionToggle = document.getElementById('chain-accordion-toggle');
  const chainAccordionBody = document.getElementById('chain-accordion-body');
  const chainAccordionChevron = document.getElementById('chain-accordion-chevron');

  // Burger Menu Elements
  const burgerMenuBtn = document.getElementById('burger-menu-btn');
  const burgerDropdownMenu = document.getElementById('burger-dropdown-menu');
  const menuThemeToggle = document.getElementById('menu-theme-toggle');

  // Modal Elements
  const tradeModal = document.getElementById('trade-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalKolAvatar = document.getElementById('modal-kol-avatar');
  const modalKolName = document.getElementById('modal-kol-name');
  const modalKolSummary = document.getElementById('modal-kol-summary');
  const tradesTbody = document.getElementById('trades-tbody');

  // Initialize
  fetchStats(selectedChain);
  fetchKOLs();

  // Burger Menu Toggle
  if (burgerMenuBtn && burgerDropdownMenu) {
    burgerMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      burgerDropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!burgerDropdownMenu.contains(e.target) && !burgerMenuBtn.contains(e.target)) {
        burgerDropdownMenu.classList.add('hidden');
      }
    });
  }

  // Theme Toggle inside Burger Menu
  if (menuThemeToggle) {
    menuThemeToggle.addEventListener('click', () => {
      if (window.toggleTheme) window.toggleTheme();
    });
  }

  // Unified Single Accordion Toggle (Platform Intelligence & Ecosystems)
  let isStatsAccordionOpen = true;
  if (statsAccordionToggle && statsAccordionBody) {
    statsAccordionToggle.addEventListener('click', () => {
      isStatsAccordionOpen = !isStatsAccordionOpen;
      if (isStatsAccordionOpen) {
        statsAccordionBody.classList.remove('hidden');
        if (statsAccordionChevron) statsAccordionChevron.classList.replace('pi-chevron-down', 'pi-chevron-up');
      } else {
        statsAccordionBody.classList.add('hidden');
        if (statsAccordionChevron) statsAccordionChevron.classList.replace('pi-chevron-up', 'pi-chevron-down');
      }
    });
  }

  // Search Input Debounce
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        fetchKOLs();
      }, 250);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      currentPage = 1;
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
      currentPage = 1;
      fetchKOLs();
    });
  }

  // Dynamic Ecosystem Box Card Selection
  const appChainPills = document.getElementById('app-chain-pills');

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

      selectedChain = btn.dataset.chain;
      currentPage = 1;

      const names = { solana: 'SOLANA', bsc: 'BSC', base: 'BASE', eth: 'ETH', robinhood: 'ROBINHOOD' };
      const name = names[selectedChain] || selectedChain.toUpperCase();
      
      showToast(`Switched to ${name}`);

      const menuEngineName = document.getElementById('menu-engine-name');
      if (menuEngineName) menuEngineName.textContent = name;

      // Dynamically update stats and directory cards
      fetchStats(selectedChain);
      fetchKOLs();
    });
  }

  // Realtime Polling Loop (3-second silent sync for live realtime UI data!)
  setInterval(() => {
    fetchStats(selectedChain);
    fetchKOLsSilently();
  }, 3000);

  // Fetch Dynamic Platform Stats from Database
  async function fetchStats(chain = 'solana') {
    try {
      const res = await fetch(`/api/stats?chain=${chain}`);
      const json = await res.json();
      if (json.success) {
        const s = json.data;
        if (statTotalKols) statTotalKols.textContent = s.total_kols ? s.total_kols.toLocaleString() : '0';
        if (statTotalTrades) statTotalTrades.textContent = s.total_trades ? s.total_trades.toLocaleString() : '0';
        if (statUniqueTokens) statUniqueTokens.textContent = s.unique_tokens ? s.unique_tokens.toLocaleString() : '0';
        if (statAvgWinrate) statAvgWinrate.textContent = `${s.avg_win_rate}%`;
        if (countAll) countAll.textContent = s.total_kols || '0';
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  // Fetch KOL Directory from Database
  async function fetchKOLs() {
    if (!kolGrid) return;
    kolGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        <i class="pi pi-spin pi-spinner text-2xl text-rose-600 mb-2"></i>
        <p class="text-sm font-semibold">Harvesting Verified ${selectedChain.toUpperCase()} KOL Intelligence...</p>
      </div>
    `;

    try {
      const params = new URLSearchParams({
        chain: selectedChain,
        filterPreset: currentPreset,
        sortBy: currentSort,
        search: currentSearch,
        limit: 200 // Fetch dataset to paginate 20 per page on client
      });

      const res = await fetch(`/api/kols?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        kolsData = json.data;
        renderPaginatedView();
      } else {
        kolGrid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">Error loading KOL directory</div>`;
      }
    } catch (err) {
      console.error('Error fetching KOLs:', err);
      kolGrid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500">Error connecting to server</div>`;
    }
  }

  // Silent Background Fetch for Realtime UI Updates (No loading spinner interruption!)
  async function fetchKOLsSilently() {
    try {
      const params = new URLSearchParams({
        chain: selectedChain,
        filterPreset: currentPreset,
        sortBy: currentSort,
        search: currentSearch,
        limit: 200
      });

      const res = await fetch(`/api/kols?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        kolsData = json.data;
        renderPaginatedView();
      }
    } catch (err) {
      // Silent catch
    }
  }

  // Render Paginated View (20 items per page)
  function renderPaginatedView() {
    const totalItems = kolsData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
    const pageItems = kolsData.slice(startIdx, endIdx);

    renderKOLCards(pageItems);
    renderPaginationControls(totalItems, startIdx, endIdx, totalPages);
  }

  // Render Compact Mobile-Scaled Pure KOL Cards (2 Columns Mobile, 4 Columns Desktop, Minimal Mono Buttons)
  function renderKOLCards(kols) {
    if (kols.length === 0) {
      kolGrid.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
          <i class="pi pi-search text-3xl text-slate-400 mb-2"></i>
          <h3 class="font-outfit text-base font-bold text-slate-900 dark:text-white">No KOLs found matching your selection</h3>
          <p class="text-xs text-slate-500 mt-1">Try tweaking your search keywords or choosing another ecosystem.</p>
        </div>
      `;
      return;
    }

    kolGrid.innerHTML = kols.map(kol => {
      const shortWallet = `${kol.wallet_address.slice(0, 4)}...${kol.wallet_address.slice(-4)}`;
      const tagsHtml = (kol.maker_tags || []).slice(0, 2).map(t => `<span class="text-[8px] sm:text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md truncate max-w-[65px]">#${t}</span>`).join('');

      return `
        <div class="bg-white dark:bg-slate-900/90 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-3.5 shadow-md flex flex-col justify-between hover:border-rose-500 transition-all space-y-2">
          <div class="space-y-1.5 sm:space-y-2">
            <!-- Header: Avatar + Info -->
            <div class="flex items-start justify-between gap-1">
              <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <img 
                  src="${kol.avatar}" 
                  alt="${kol.maker_name}" 
                  referrerpolicy="no-referrer" 
                  class="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800" 
                  onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(kol.maker_name || 'KOL')}&background=e11d48&color=fff&bold=true';"
                >
                <div class="min-w-0">
                  <h3 class="font-outfit font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate" title="${kol.maker_name}">${kol.maker_name || kol.twitter_name || 'KOL'}</h3>
                  ${kol.twitter_username ? `<a href="${kol.twitter_url}" target="_blank" class="text-[9px] sm:text-[10px] text-sky-500 font-semibold hover:underline truncate block"><i class="pi pi-twitter text-[8px]"></i> @${kol.twitter_username}</a>` : '<span class="text-[9px] text-slate-400 block">No X</span>'}
                </div>
              </div>
            </div>

            <!-- Tags (Compact Overflow) -->
            <div class="flex flex-wrap gap-0.5 sm:gap-1 overflow-hidden h-4 sm:h-5">
              ${tagsHtml}
            </div>

            <!-- Compact Stats Grid (Scaled for Mobile) -->
            <div class="grid grid-cols-3 gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
              <div>
                <span class="font-outfit font-black text-[10px] sm:text-xs text-rose-600 dark:text-rose-400 block leading-tight">${kol.win_rate}%</span>
                <span class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Win</span>
              </div>
              <div>
                <span class="font-outfit font-black text-[10px] sm:text-xs text-slate-900 dark:text-white block leading-tight">${kol.total_trades}</span>
                <span class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Trades</span>
              </div>
              <div>
                <span class="font-outfit font-black text-[10px] sm:text-xs text-slate-900 dark:text-white block leading-tight truncate px-0.5">${kol.total_volume_sol}</span>
                <span class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider">SOL</span>
              </div>
            </div>
          </div>

          <!-- Minimal Clean Action Bar: 3 Uniform Borderless Icon Buttons -->
          <div class="pt-1.5 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-1 sm:gap-1.5">
            <button onclick="inspectKOL('${kol.wallet_address}')" title="Inspect Trades" class="h-7 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-center hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all">
              <i class="pi pi-eye text-xs"></i>
            </button>

            <a href="${kol.jupiter_url}" target="_blank" title="Jupiter Swap" class="h-7 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-center hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all">
              <i class="pi pi-chart-bar text-xs"></i>
            </a>

            ${kol.twitter_url ? `
              <a href="${kol.twitter_url}" target="_blank" title="Follow X" class="h-7 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-center hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all">
                <i class="pi pi-twitter text-xs"></i>
              </a>
            ` : `
              <button title="No Twitter Handle" class="h-7 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 text-xs flex items-center justify-center cursor-not-allowed opacity-40">
                <i class="pi pi-twitter text-xs"></i>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Page Selector Controls (20 items per page)
  function renderPaginationControls(totalItems, startIdx, endIdx, totalPages) {
    if (!paginationInfo || !paginationControls) return;

    if (totalItems === 0) {
      paginationInfo.textContent = 'Showing 0 KOLs';
      paginationControls.innerHTML = '';
      return;
    }

    paginationInfo.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${totalItems} KOLs`;

    let btnsHtml = '';

    // Prev Button
    btnsHtml += `
      <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})" class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:border-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        <i class="pi pi-chevron-left text-[10px]"></i> Prev
      </button>
    `;

    // Page Number Pills
    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
        if (p === 2 && currentPage > 4) btnsHtml += `<span class="px-1 text-slate-400 text-xs">...</span>`;
        if (p === totalPages - 1 && currentPage < totalPages - 3) btnsHtml += `<span class="px-1 text-slate-400 text-xs">...</span>`;
        continue;
      }

      const isActive = p === currentPage;
      btnsHtml += `
        <button onclick="changePage(${p})" class="w-8 h-8 rounded-lg text-xs font-bold transition-all ${
          isActive 
            ? 'bg-rose-600 text-white shadow-sm' 
            : 'border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-500'
        }">
          ${p}
        </button>
      `;
    }

    // Next Button
    btnsHtml += `
      <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})" class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:border-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        Next <i class="pi pi-chevron-right text-[10px]"></i>
      </button>
    `;

    paginationControls.innerHTML = btnsHtml;
  }

  // Change Page Action
  window.changePage = function(newPage) {
    currentPage = newPage;
    renderPaginatedView();
    if (kolGrid) {
      kolGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
          tradesTbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 font-medium">No daily trades recorded today for this KOL.</td></tr>`;
          return;
        }

        tradesTbody.innerHTML = kol.recent_trades.map(t => {
          const isBuy = t.trade_type === 'BUY';
          const typeBadge = isBuy ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
          const dateStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          const chainLower = (kol.chain || 'SOLANA').toLowerCase();
          let swapUrl = `https://jup.ag/swap/SOL-${t.token_address}`;
          let swapText = 'Swap JUP';
          if (chainLower === 'bsc') { swapUrl = `https://pancakeswap.finance/swap?outputCurrency=${t.token_address}`; swapText = 'PancakeSwap'; }
          else if (chainLower === 'base') { swapUrl = `https://aerodrome.finance/swap?from=eth&to=${t.token_address}`; swapText = 'Aerodrome'; }
          else if (chainLower === 'eth') { swapUrl = `https://app.uniswap.org/#/swap?outputCurrency=${t.token_address}`; swapText = 'Uniswap'; }
          else if (chainLower === 'robinhood') { swapUrl = `https://dexscreener.com/search?q=${t.token_address}`; swapText = 'DexScreener'; }

          return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3.5"><span class="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${typeBadge}">${t.trade_type}</span></td>
              <td class="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white text-xs">${t.token_symbol}</td>
              <td class="px-4 py-3.5 font-bold text-slate-900 dark:text-white text-xs">${t.amount_sol} SOL</td>
              <td class="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300 text-xs">$${t.price_usd ? parseFloat(t.price_usd).toFixed(6) : '0.00'}</td>
              <td class="px-4 py-3.5 text-[11px] font-medium text-slate-400">${dateStr}</td>
              <td class="px-4 py-3.5 text-right">
                <a href="${swapUrl}" target="_blank" class="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] hover:bg-rose-600 hover:text-white transition-all inline-flex items-center gap-1">
                  ${swapText} <i class="pi pi-external-link text-[9px]"></i>
                </a>
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
