import { Router } from 'express';
import { logWebhookEvent, updateCallLog, getCallLog, updateCampaign, getCampaign } from '../db/database.js';
import { v4 as uuid } from 'uuid';

const router = Router();

/**
 * POST /api/webhook/bolna
 * Receives call status updates from Bolna platform
 */
router.post('/bolna', (req, res) => {
  try {
    const payload = req.body;
    console.log('[Webhook] Received Bolna event:', payload.status || 'unknown');

    // Log raw event
    logWebhookEvent('bolna_call_update', payload);

    // Process if we have an execution ID
    if (payload.id || payload.execution_id) {
      const execId = payload.id || payload.execution_id;

      // Find matching call log by bolna_execution_id
      const callLog = getCallLog(execId);

      if (callLog) {
        const updateData = {
          status: mapBolnaStatus(payload.status),
          duration_seconds: payload.conversation_time || payload.duration || 0,
          cost: payload.total_cost || 0
        };

        if (payload.transcript) {
          updateData.transcript = payload.transcript;
        }

        if (payload.extracted_data) {
          updateData.extracted_data = payload.extracted_data;
          updateData.disposition = payload.extracted_data.disposition || null;
          updateData.qualification_score = payload.extracted_data.qualification_score || null;
          updateData.appointment_date = payload.extracted_data.appointment_date || null;
        }

        if (payload.recording_url) {
          updateData.recording_url = payload.recording_url;
        }

        updateCallLog(execId, updateData);

        // Update campaign stats if completed
        if (updateData.status === 'completed' && callLog.campaign_id) {
          const campaign = getCampaign(callLog.campaign_id);
          if (campaign) {
            const updates = { called_leads: campaign.called_leads + 1 };
            if (updateData.qualification_score && ['A', 'B'].includes(updateData.qualification_score)) {
              updates.qualified_leads = campaign.qualified_leads + 1;
            }
            if (updateData.disposition === 'qualified_booked') {
              updates.booked_appointments = campaign.booked_appointments + 1;
            }
            updateCampaign(callLog.campaign_id, updates);
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

function mapBolnaStatus(status) {
  const statusMap = {
    'queued': 'initiated',
    'initiated': 'initiated',
    'ringing': 'ringing',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'failed': 'failed',
    'no-answer': 'no-answer',
    'busy': 'busy'
  };
  return statusMap[status] || status || 'initiated';
}

export default router;
