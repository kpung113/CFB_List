// Shared Navigation Drawer & Header Menu Management
const NAV_LINKS = [
  { title: "Scores Board", url: "index.html" },
  { title: "Game Grid", url: "grid.html" },
  { title: "MSU Schedule", url: "schedules.html" },
  { title: "SEC Injury Report", url: "injuries.html" },
  { title: "Closest Away Games", url: "away.html" },
  { title: "MSU Trip", url: "visit.html" }
];

function renderSharedNav() {
  // 1. Inject Nav Overlay & Drawer if missing
  if (!document.getElementById('navDrawer')) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.id = 'navOverlay';
    overlay.onclick = toggleMenu;

    const drawer = document.createElement('nav');
    drawer.className = 'nav-drawer';
    drawer.id = 'navDrawer';

    const linksHtml = NAV_LINKS.map(link => {
      const isActive = currentPage === link.url ? 'class="active"' : '';
      return `<li><a href="${link.url}" ${isActive}>${link.title}</a></li>`;
    }).join('');

    drawer.innerHTML = `
      <div class="drawer-header">
        <span>Navigation</span>
        <button class="drawer-close" onclick="toggleMenu()">&times;</button>
      </div>
      <ul class="drawer-links">
        ${linksHtml}
      </ul>
    `;

    document.body.insertAdjacentElement('afterbegin', overlay);
    document.body.insertAdjacentElement('afterbegin', drawer);
  }
}

function toggleMenu() {
  const drawer = document.getElementById('navDrawer');
  const overlay = document.getElementById('navOverlay');
  if (drawer) drawer.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

// Auto-render menu DOM as soon as page loads
document.addEventListener('DOMContentLoaded', renderSharedNav);
