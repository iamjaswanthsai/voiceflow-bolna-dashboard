import { registerRoute, initRouter } from './utils/router.js';
import { renderSidebar } from './components/sidebar.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderDemo } from './pages/demo.js';
import { renderCampaigns } from './pages/campaigns.js';
import { renderCalls } from './pages/calls.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderSettings } from './pages/settings.js';

// Register routes
registerRoute('/', renderDashboard);
registerRoute('/demo', renderDemo);
registerRoute('/campaigns', renderCampaigns);
registerRoute('/calls', renderCalls);
registerRoute('/analytics', renderAnalytics);
registerRoute('/settings', renderSettings);

// Render sidebar
renderSidebar();

// Re-render sidebar on navigation to update active state
window.addEventListener('hashchange', renderSidebar);

// Initialize router
initRouter();
