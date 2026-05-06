import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function getDb() {
  if (!db) {
    db = new Database(join(__dirname, 'voiceflow.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);

    // Insert default agent config if not exists
    const existing = db.prepare('SELECT id FROM agent_config WHERE id = ?').get('default');
    if (!existing) {
      db.prepare(`
        INSERT INTO agent_config (id, agent_name, system_prompt, welcome_message, webhook_url)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'default',
        'LeadQualifier-Sarah',
        getDefaultPrompt(),
        'Hi {lead_name}! This is Sarah from {company_name}. I noticed you were checking out {product_name} recently — do you have a quick minute to chat about how it could help your team?',
        'http://localhost:3001/api/webhook/bolna'
      );
    }
  }
  return db;
}

function getDefaultPrompt() {
  return `## PERSONALITY
You are Sarah, a friendly and professional Business Development Representative at {company_name}. You speak clearly, concisely, and with genuine enthusiasm. You never sound robotic or scripted.

## CONTEXT
You're calling {lead_name} who expressed interest in {product_name} through {lead_source}. Your goal is to qualify them using BANT criteria and book an appointment with a senior sales consultant if they're a fit.

## CONVERSATION RULES
1. Keep responses under 2 sentences unless explaining something complex
2. Ask ONE question at a time — never stack multiple questions
3. Use the lead's name naturally (not every sentence)
4. If they seem busy, offer to call back at a better time
5. Never pressure or use aggressive sales tactics
6. If asked a product question you can't answer, say "That's a great question — our specialist can cover that in detail during your consultation"

## QUALIFICATION CRITERIA (BANT)
- Budget: Are they allocating budget for this type of solution?
- Authority: Are they the decision-maker or can they influence the decision?
- Need: Do they have a specific pain point the product solves?
- Timeline: Are they looking to implement within the next 1-3 months?

## GUARDRAILS
- Never discuss pricing specifics — defer to the consultation
- Never disparage competitors
- If the person asks you to stop calling, immediately comply and end politely
- Do not discuss topics unrelated to business`;
}

// --- Query Helpers ---

export function getCampaigns() {
  return getDb().prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
}

export function getCampaign(id) {
  return getDb().prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
}

export function createCampaign(data) {
  const stmt = getDb().prepare(`
    INSERT INTO campaigns (id, name, description, agent_id, status, total_leads)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, data.name, data.description, data.agent_id, data.status || 'draft', data.total_leads || 0);
  return getCampaign(data.id);
}

export function updateCampaign(id, data) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  getDb().prepare(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCampaign(id);
}

export function deleteCampaign(id) {
  getDb().prepare('DELETE FROM campaigns WHERE id = ?').run(id);
}

// Leads
export function getLeadsByCampaign(campaignId) {
  return getDb().prepare('SELECT * FROM leads WHERE campaign_id = ? ORDER BY created_at DESC').all(campaignId);
}

export function createLead(data) {
  const stmt = getDb().prepare(`
    INSERT INTO leads (id, campaign_id, name, company, phone, email, source, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, data.campaign_id, data.name, data.company, data.phone, data.email, data.source || 'manual', data.status || 'pending');
}

export function bulkCreateLeads(leads) {
  const stmt = getDb().prepare(`
    INSERT INTO leads (id, campaign_id, name, company, phone, email, source, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = getDb().transaction((items) => {
    for (const l of items) {
      stmt.run(l.id, l.campaign_id, l.name, l.company, l.phone, l.email, l.source || 'manual', l.status || 'pending');
    }
  });
  insertMany(leads);
}

// Call Logs
export function getCallLogs(filters = {}) {
  let query = 'SELECT * FROM call_logs WHERE 1=1';
  const params = [];

  if (filters.campaign_id) {
    query += ' AND campaign_id = ?';
    params.push(filters.campaign_id);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.disposition) {
    query += ' AND disposition = ?';
    params.push(filters.disposition);
  }
  if (filters.search) {
    query += ' AND (lead_name LIKE ? OR lead_phone LIKE ? OR lead_company LIKE ?)';
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return getDb().prepare(query).all(...params);
}

export function getCallLog(id) {
  return getDb().prepare('SELECT * FROM call_logs WHERE id = ?').get(id);
}

export function createCallLog(data) {
  const stmt = getDb().prepare(`
    INSERT INTO call_logs (id, lead_id, campaign_id, agent_id, bolna_execution_id, lead_name, lead_phone, lead_company, status, disposition, qualification_score, duration_seconds, cost, transcript, extracted_data, recording_url, appointment_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.id, data.lead_id, data.campaign_id, data.agent_id, data.bolna_execution_id,
    data.lead_name, data.lead_phone, data.lead_company,
    data.status || 'initiated', data.disposition, data.qualification_score,
    data.duration_seconds || 0, data.cost || 0,
    data.transcript, data.extracted_data ? JSON.stringify(data.extracted_data) : null,
    data.recording_url, data.appointment_date, data.notes
  );
  return getCallLog(data.id);
}

export function updateCallLog(id, data) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(key === 'extracted_data' && typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  getDb().prepare(`UPDATE call_logs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCallLog(id);
}

// Analytics
export function getAnalytics() {
  const db = getDb();

  const totalCalls = db.prepare('SELECT COUNT(*) as count FROM call_logs').get().count;
  const completedCalls = db.prepare("SELECT COUNT(*) as count FROM call_logs WHERE status = 'completed'").get().count;
  const qualifiedLeads = db.prepare("SELECT COUNT(*) as count FROM call_logs WHERE qualification_score IN ('A','B')").get().count;
  const bookedAppointments = db.prepare("SELECT COUNT(*) as count FROM call_logs WHERE disposition = 'qualified_booked'").get().count;
  const avgDuration = db.prepare("SELECT AVG(duration_seconds) as avg FROM call_logs WHERE status = 'completed'").get().avg || 0;
  const totalCost = db.prepare('SELECT SUM(cost) as total FROM call_logs').get().total || 0;

  const dispositionBreakdown = db.prepare(`
    SELECT disposition, COUNT(*) as count 
    FROM call_logs 
    WHERE disposition IS NOT NULL 
    GROUP BY disposition
  `).all();

  const qualificationBreakdown = db.prepare(`
    SELECT qualification_score, COUNT(*) as count 
    FROM call_logs 
    WHERE qualification_score IS NOT NULL 
    GROUP BY qualification_score
  `).all();

  const callsByDay = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM call_logs 
    GROUP BY DATE(created_at) 
    ORDER BY date DESC 
    LIMIT 30
  `).all().reverse();

  const callsByHour = db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as count 
    FROM call_logs 
    GROUP BY hour 
    ORDER BY hour
  `).all();

  const conversionRate = totalCalls > 0 ? ((bookedAppointments / totalCalls) * 100).toFixed(1) : 0;

  const recentCalls = db.prepare(`
    SELECT id, lead_name, lead_company, status, disposition, qualification_score, duration_seconds, created_at 
    FROM call_logs 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  return {
    kpis: {
      totalCalls,
      completedCalls,
      qualifiedLeads,
      bookedAppointments,
      avgDuration: Math.round(avgDuration),
      totalCost: totalCost.toFixed(2),
      conversionRate
    },
    dispositionBreakdown,
    qualificationBreakdown,
    callsByDay,
    callsByHour,
    recentCalls
  };
}

// Agent Config
export function getAgentConfig() {
  return getDb().prepare('SELECT * FROM agent_config WHERE id = ?').get('default');
}

export function updateAgentConfig(data) {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push('default');
  getDb().prepare(`UPDATE agent_config SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getAgentConfig();
}

// Webhook Events
export function logWebhookEvent(eventType, payload) {
  getDb().prepare(`
    INSERT INTO webhook_events (event_type, payload) VALUES (?, ?)
  `).run(eventType, JSON.stringify(payload));
}
