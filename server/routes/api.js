import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import {
  getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
  getLeadsByCampaign, createLead, bulkCreateLeads,
  getCallLogs, getCallLog, createCallLog,
  getAnalytics,
  getAgentConfig, updateAgentConfig
} from '../db/database.js';

const router = Router();

// ──────────────── CAMPAIGNS ────────────────

router.get('/campaigns', (req, res) => {
  res.json(getCampaigns());
});

router.get('/campaigns/:id', (req, res) => {
  const campaign = getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

router.post('/campaigns', (req, res) => {
  const data = { id: uuid(), ...req.body };
  const campaign = createCampaign(data);
  res.status(201).json(campaign);
});

router.put('/campaigns/:id', (req, res) => {
  const campaign = updateCampaign(req.params.id, req.body);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

router.delete('/campaigns/:id', (req, res) => {
  deleteCampaign(req.params.id);
  res.json({ success: true });
});

// ──────────────── LEADS ────────────────

router.get('/campaigns/:id/leads', (req, res) => {
  res.json(getLeadsByCampaign(req.params.id));
});

router.post('/campaigns/:id/leads', (req, res) => {
  const leads = req.body.leads || [req.body];
  const prepared = leads.map(l => ({
    id: uuid(),
    campaign_id: req.params.id,
    ...l
  }));
  bulkCreateLeads(prepared);

  // Update campaign total
  const campaign = getCampaign(req.params.id);
  if (campaign) {
    updateCampaign(req.params.id, { total_leads: campaign.total_leads + prepared.length });
  }

  res.status(201).json({ count: prepared.length });
});

// ──────────────── CALL LOGS ────────────────

router.get('/calls', (req, res) => {
  const filters = {
    campaign_id: req.query.campaign_id,
    status: req.query.status,
    disposition: req.query.disposition,
    search: req.query.search,
    limit: req.query.limit ? parseInt(req.query.limit) : undefined
  };
  res.json(getCallLogs(filters));
});

router.get('/calls/:id', (req, res) => {
  const call = getCallLog(req.params.id);
  if (!call) return res.status(404).json({ error: 'Call not found' });
  // Parse extracted_data JSON
  if (call.extracted_data) {
    try { call.extracted_data = JSON.parse(call.extracted_data); } catch (e) { /* leave as string */ }
  }
  res.json(call);
});

// ──────────────── ANALYTICS ────────────────

router.get('/analytics', (req, res) => {
  res.json(getAnalytics());
});

// ──────────────── AGENT CONFIG ────────────────

router.get('/agent-config', (req, res) => {
  const config = getAgentConfig();
  const apiKey = process.env.BOLNA_API_KEY || '';
  config.bolna_api_configured = apiKey && apiKey !== 'demo_key';
  config.bolna_api_key_masked = apiKey ? apiKey.slice(0, 6) + '••••••••' + apiKey.slice(-4) : 'Not configured';
  // Auto-detect webhook URL based on request host
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  config.webhook_url = `${protocol}://${host}/api/webhook/bolna`;
  res.json(config);
});

router.put('/agent-config', (req, res) => {
  const config = updateAgentConfig(req.body);
  res.json(config);
});

export default router;
