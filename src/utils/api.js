/**
 * Frontend API Client
 */
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Health
  health: () => request('/health'),

  // Analytics
  getAnalytics: () => request('/analytics'),

  // Campaigns
  getCampaigns: () => request('/campaigns'),
  getCampaign: (id) => request(`/campaigns/${id}`),
  createCampaign: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaign: (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),

  // Leads
  getCampaignLeads: (campaignId) => request(`/campaigns/${campaignId}/leads`),
  addLeads: (campaignId, leads) => request(`/campaigns/${campaignId}/leads`, { method: 'POST', body: JSON.stringify({ leads }) }),

  // Call Logs
  getCallLogs: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return request(`/calls?${params}`);
  },
  getCallLog: (id) => request(`/calls/${id}`),

  // Agent Config
  getAgentConfig: () => request('/agent-config'),
  updateAgentConfig: (data) => request('/agent-config', { method: 'PUT', body: JSON.stringify(data) }),

  // Bolna
  getBolnaPayload: () => request('/bolna/config-payload'),
  createBolnaAgent: () => request('/bolna/agent', { method: 'POST' }),
  makeBolnaCall: (data) => request('/bolna/call', { method: 'POST', body: JSON.stringify(data) })
};
