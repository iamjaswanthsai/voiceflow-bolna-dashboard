import { Router } from 'express';
import bolnaService from '../services/bolna.js';
import { getAgentConfig } from '../db/database.js';

const router = Router();

/**
 * POST /api/bolna/agent — Create a new Bolna agent
 */
router.post('/agent', async (req, res) => {
  try {
    const config = getAgentConfig();
    const payload = bolnaService.buildAgentPayload(config);
    const result = await bolnaService.createAgent(payload);
    res.json(result);
  } catch (error) {
    console.error('[Bolna] Create agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bolna/agent/:id — Get agent details
 */
router.get('/agent/:id', async (req, res) => {
  try {
    const result = await bolnaService.getAgent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bolna/call — Make an outbound call
 */
router.post('/call', async (req, res) => {
  try {
    const { agent_id, phone_number, variables } = req.body;
    const result = await bolnaService.makeCall(agent_id, phone_number, variables);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bolna/config-payload — Preview the agent config that would be sent to Bolna
 */
router.get('/config-payload', (req, res) => {
  const config = getAgentConfig();
  const payload = bolnaService.buildAgentPayload(config);
  res.json(payload);
});

export default router;
