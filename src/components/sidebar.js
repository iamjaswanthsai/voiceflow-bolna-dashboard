import { navigateTo, getCurrentRoute } from '../utils/router.js';

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const currentPath = getCurrentRoute();

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">🎙️</div>
      <div class="sidebar-logo-text">
        <h1>VoiceFlow AI</h1>
        <span>Lead Qualification</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Overview</div>
      <button class="nav-item ${currentPath === '/' ? 'active' : ''}" data-path="/" id="nav-dashboard">
        <span class="nav-icon">📊</span>
        <span>Dashboard</span>
      </button>
      <button class="nav-item ${currentPath === '/demo' ? 'active' : ''}" data-path="/demo" id="nav-demo">
        <span class="nav-icon">🔴</span>
        <span>Live Demo</span>
        <span class="nav-badge" style="background:var(--error);">NEW</span>
      </button>

      <div class="sidebar-section-label">Management</div>
      <button class="nav-item ${currentPath === '/campaigns' ? 'active' : ''}" data-path="/campaigns" id="nav-campaigns">
        <span class="nav-icon">📢</span>
        <span>Campaigns</span>
      </button>
      <button class="nav-item ${currentPath === '/calls' ? 'active' : ''}" data-path="/calls" id="nav-calls">
        <span class="nav-icon">📞</span>
        <span>Call Logs</span>
      </button>

      <div class="sidebar-section-label">Insights</div>
      <button class="nav-item ${currentPath === '/analytics' ? 'active' : ''}" data-path="/analytics" id="nav-analytics">
        <span class="nav-icon">📈</span>
        <span>Analytics</span>
      </button>

      <div class="sidebar-section-label">Configuration</div>
      <button class="nav-item ${currentPath === '/settings' ? 'active' : ''}" data-path="/settings" id="nav-settings">
        <span class="nav-icon">⚙️</span>
        <span>Agent Settings</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="demo-badge" style="background:var(--success-bg);border-color:rgba(16,185,129,0.2);color:var(--success);">
        <span>🟢</span>
        <span>Bolna Connected</span>
      </div>
    </div>
  `;

  // Attach click handlers
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.path);
    });
  });
}
