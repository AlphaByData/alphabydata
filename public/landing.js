/* Landing Page Controller */
document.addEventListener('DOMContentLoaded', () => {
  // Products Menu Drawer Controls
  const burgerBtn = document.getElementById('btn-burger-menu');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerContent = document.getElementById('drawer-content');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');

  function openDrawer() {
    if (!drawerOverlay || !drawerContent) return;
    drawerOverlay.classList.remove('opacity-0', 'pointer-events-none');
    drawerContent.classList.remove('translate-x-full');
  }

  function closeDrawer() {
    if (!drawerOverlay || !drawerContent) return;
    drawerOverlay.classList.add('opacity-0', 'pointer-events-none');
    drawerContent.classList.add('translate-x-full');
  }

  if (burgerBtn) burgerBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeDrawer();
    });
  }

  // Dynamic Ecosystem / Chain Selector Pill Clicks
  const chainPills = document.getElementById('chain-pills');
  if (chainPills) {
    chainPills.addEventListener('click', (e) => {
      const btn = e.target.closest('.chain-box-btn');
      if (!btn) return;

      document.querySelectorAll('#chain-pills .chain-box-btn').forEach(b => {
        b.classList.remove('active', 'border-2', 'border-rose-600', 'bg-rose-500/10');
        b.classList.add('border', 'border-slate-200', 'dark:border-white/10', 'bg-slate-50', 'dark:bg-slate-800/50');
      });

      btn.classList.remove('border', 'border-slate-200', 'dark:border-white/10', 'bg-slate-50', 'dark:bg-slate-800/50');
      btn.classList.add('active', 'border-2', 'border-rose-600', 'bg-rose-500/10');

      const chain = btn.dataset.chain;
      console.log(`[AlphaByData] Ecosystem Selected: ${chain.toUpperCase()}`);
    });
  }
});
