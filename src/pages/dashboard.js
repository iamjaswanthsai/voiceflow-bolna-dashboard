import { api } from '../utils/api.js';
import { formatDuration, formatRelativeTime, animateCounter, getDispositionBadge } from '../utils/helpers.js';
import { navigateTo } from '../utils/router.js';

export async function renderDashboard(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const data = await api.getAnalytics();
    const { kpis, dispositionBreakdown, recentCalls } = data;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Dashboard</h2>
          <p>Real-time overview of your voice AI lead qualification pipeline</p>
        </div>
        <button class="btn btn-primary" id="btn-new-campaign">
          <span>➕</span> New Campaign
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card blue animate-in stagger-1">
          <div class="kpi-header">
            <span class="kpi-label">Total Calls</span>
            <div class="kpi-icon">📞</div>
          </div>
          <div class="kpi-value" data-counter="${kpis.totalCalls}">0</div>
          <div class="kpi-change"><span class="up">↑ 12%</span> vs last week</div>
        </div>
        <div class="kpi-card green animate-in stagger-2">
          <div class="kpi-header">
            <span class="kpi-label">Qualified Leads</span>
            <div class="kpi-icon">✅</div>
          </div>
          <div class="kpi-value" data-counter="${kpis.qualifiedLeads}">0</div>
          <div class="kpi-change"><span class="up">↑ 23%</span> vs last week</div>
        </div>
        <div class="kpi-card purple animate-in stagger-3">
          <div class="kpi-header">
            <span class="kpi-label">Appointments</span>
            <div class="kpi-icon">📅</div>
          </div>
          <div class="kpi-value" data-counter="${kpis.bookedAppointments}">0</div>
          <div class="kpi-change"><span class="up">↑ 18%</span> vs last week</div>
        </div>
        <div class="kpi-card amber animate-in stagger-4">
          <div class="kpi-header">
            <span class="kpi-label">Conversion Rate</span>
            <div class="kpi-icon">🎯</div>
          </div>
          <div class="kpi-value" data-counter="${kpis.conversionRate}">0</div>
          <div class="kpi-change">Avg. call: ${formatDuration(kpis.avgDuration)}</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="dashboard-grid">
        <!-- Funnel -->
        <div class="glass-card animate-in stagger-5">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:4px;">Qualification Funnel</h3>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">Lead journey from call to booking</p>
          <div class="funnel-bar-container">
            <div class="funnel-bar-item">
              <span class="funnel-bar-label">Calls Made</span>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill blue" style="width:100%">${kpis.totalCalls}</div>
              </div>
            </div>
            <div class="funnel-bar-item">
              <span class="funnel-bar-label">Completed</span>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill cyan" style="width:${kpis.totalCalls ? (kpis.completedCalls/kpis.totalCalls*100) : 0}%">${kpis.completedCalls}</div>
              </div>
            </div>
            <div class="funnel-bar-item">
              <span class="funnel-bar-label">Qualified</span>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill green" style="width:${kpis.totalCalls ? (kpis.qualifiedLeads/kpis.totalCalls*100) : 0}%">${kpis.qualifiedLeads}</div>
              </div>
            </div>
            <div class="funnel-bar-item">
              <span class="funnel-bar-label">Booked</span>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill purple" style="width:${kpis.totalCalls ? (kpis.bookedAppointments/kpis.totalCalls*100) : 0}%">${kpis.bookedAppointments}</div>
              </div>
            </div>
          </div>

          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
            <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">Quick Actions</h3>
            <div class="quick-actions">
              <button class="quick-action-btn" id="qa-campaigns">
                <span class="icon">📢</span>
                <span>View Campaigns</span>
              </button>
              <button class="quick-action-btn" id="qa-calls">
                <span class="icon">📞</span>
                <span>Call Logs</span>
              </button>
              <button class="quick-action-btn" id="qa-analytics">
                <span class="icon">📈</span>
                <span>Analytics</span>
              </button>
              <button class="quick-action-btn" id="qa-settings">
                <span class="icon">⚙️</span>
                <span>Agent Config</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Activity Feed -->
        <div class="glass-card animate-in stagger-6">
          <h3 style="font-size:15px;font-weight:700;margin-bottom:4px;">Recent Activity</h3>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">Latest call outcomes</p>
          <div class="activity-feed" id="activity-feed"></div>
        </div>
      </div>
    `;

    // Animate counters
    container.querySelectorAll('[data-counter]').forEach(el => {
      const target = parseFloat(el.dataset.counter);
      animateCounter(el, target);
    });

    // Render activity feed
    const feed = container.querySelector('#activity-feed');
    if (recentCalls.length === 0) {
      feed.innerHTML = '<div class="empty-state"><p style="font-size:13px;">No calls yet. Create a campaign to get started!</p></div>';
    } else {
      feed.innerHTML = recentCalls.map(call => {
        const badge = getDispositionBadge(call.disposition);
        const dotClass = call.disposition === 'qualified_booked' ? 'success'
          : call.disposition === 'qualified_interested' ? 'info'
          : call.disposition === 'not_interested' ? 'neutral'
          : call.status === 'failed' ? 'error'
          : 'warning';

        return `
          <div class="activity-item">
            <div class="activity-dot ${dotClass}"></div>
            <div class="activity-content">
              <div class="activity-text">
                <strong>${call.lead_name || 'Unknown'}</strong>
                ${call.lead_company ? `at ${call.lead_company}` : ''}
                — <span class="badge ${badge.class}" style="font-size:10px;">${badge.label}</span>
                ${call.duration_seconds ? ` · ${formatDuration(call.duration_seconds)}` : ''}
              </div>
              <div class="activity-time">${formatRelativeTime(call.created_at)}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Quick action handlers
    document.getElementById('btn-new-campaign')?.addEventListener('click', () => navigateTo('/campaigns'));
    document.getElementById('qa-campaigns')?.addEventListener('click', () => navigateTo('/campaigns'));
    document.getElementById('qa-calls')?.addEventListener('click', () => navigateTo('/calls'));
    document.getElementById('qa-analytics')?.addEventListener('click', () => navigateTo('/analytics'));
    document.getElementById('qa-settings')?.addEventListener('click', () => navigateTo('/settings'));

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Connection Error</h3><p>Could not connect to the server. Make sure the backend is running on port 3001.</p></div>`;
  }

  return {};
}
