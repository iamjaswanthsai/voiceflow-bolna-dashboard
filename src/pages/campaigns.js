import { api } from '../utils/api.js';
import { getStatusBadge } from '../utils/helpers.js';

export async function renderCampaigns(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const campaigns = await api.getCampaigns();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Campaigns</h2>
          <p>Manage your outbound calling campaigns</p>
        </div>
        <button class="btn btn-primary" id="btn-create-campaign">
          <span>➕</span> Create Campaign
        </button>
      </div>

      <div class="campaign-grid" id="campaign-grid"></div>

      <!-- Create Campaign Modal -->
      <div class="modal-overlay" id="campaign-modal" style="display:none;">
        <div class="modal">
          <div class="modal-header">
            <h3>Create Campaign</h3>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label">Campaign Name</label>
            <input class="form-input" id="input-camp-name" placeholder="e.g., Q2 Enterprise Outreach" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" id="input-camp-desc" placeholder="Describe the target audience and goals..." rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="modal-save">Create Campaign</button>
          </div>
        </div>
      </div>
    `;

    renderCampaignCards(campaigns);

    // Modal handlers
    const modal = document.getElementById('campaign-modal');
    document.getElementById('btn-create-campaign').addEventListener('click', () => modal.style.display = 'flex');
    document.getElementById('modal-close').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('modal-cancel').addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    document.getElementById('modal-save').addEventListener('click', async () => {
      const name = document.getElementById('input-camp-name').value.trim();
      const desc = document.getElementById('input-camp-desc').value.trim();
      if (!name) return;

      try {
        await api.createCampaign({ name, description: desc, status: 'draft' });
        modal.style.display = 'none';
        const updated = await api.getCampaigns();
        renderCampaignCards(updated);
      } catch (err) {
        alert('Failed to create campaign: ' + err.message);
      }
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error</h3><p>${err.message}</p></div>`;
  }

  return {};
}

function renderCampaignCards(campaigns) {
  const grid = document.getElementById('campaign-grid');
  if (!grid) return;

  if (campaigns.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">📢</div><h3>No Campaigns</h3><p>Create your first campaign to start qualifying leads.</p></div>`;
    return;
  }

  grid.innerHTML = campaigns.map((c, i) => {
    const badge = getStatusBadge(c.status);
    const progress = c.total_leads > 0 ? Math.round((c.called_leads / c.total_leads) * 100) : 0;
    const convRate = c.called_leads > 0 ? Math.round((c.booked_appointments / c.called_leads) * 100) : 0;

    return `
      <div class="campaign-card animate-in stagger-${i + 1}">
        <div class="campaign-card-header">
          <div>
            <h3>${c.name}</h3>
            <p>${c.description || 'No description'}</p>
          </div>
          <span class="badge ${badge.class}"><span class="badge-dot"></span>${badge.label}</span>
        </div>
        <div class="campaign-stats">
          <div class="campaign-stat">
            <div class="campaign-stat-value">${c.total_leads}</div>
            <div class="campaign-stat-label">Leads</div>
          </div>
          <div class="campaign-stat">
            <div class="campaign-stat-value">${c.called_leads}</div>
            <div class="campaign-stat-label">Called</div>
          </div>
          <div class="campaign-stat">
            <div class="campaign-stat-value">${c.qualified_leads}</div>
            <div class="campaign-stat-label">Qualified</div>
          </div>
          <div class="campaign-stat">
            <div class="campaign-stat-value">${c.booked_appointments}</div>
            <div class="campaign-stat-label">Booked</div>
          </div>
        </div>
        <div class="campaign-progress">
          <div class="campaign-progress-bar">
            <div class="campaign-progress-fill" style="width:${progress}%"></div>
          </div>
          <div class="campaign-progress-text">
            <span>${progress}% completed</span>
            <span>${convRate}% conversion</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
