-- VoiceFlow Dashboard Schema

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  agent_id TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','paused','completed')),
  total_leads INTEGER DEFAULT 0,
  called_leads INTEGER DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  booked_appointments INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','calling','called','qualified','not_qualified','no_answer','callback')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS call_logs (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  campaign_id TEXT,
  agent_id TEXT,
  bolna_execution_id TEXT,
  lead_name TEXT,
  lead_phone TEXT,
  lead_company TEXT,
  status TEXT DEFAULT 'initiated' CHECK(status IN ('initiated','ringing','in-progress','completed','failed','no-answer','busy','voicemail')),
  disposition TEXT CHECK(disposition IN ('qualified_booked','qualified_interested','not_qualified','not_interested','callback_requested','no_answer','voicemail','error',NULL)),
  qualification_score TEXT CHECK(qualification_score IN ('A','B','C','D','F',NULL)),
  duration_seconds INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  transcript TEXT,
  extracted_data TEXT, -- JSON string
  recording_url TEXT,
  appointment_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS agent_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  agent_name TEXT DEFAULT 'LeadQualifier-Sarah',
  bolna_agent_id TEXT,
  system_prompt TEXT,
  welcome_message TEXT,
  webhook_url TEXT,
  voice_provider TEXT DEFAULT 'elevenlabs',
  voice_name TEXT DEFAULT 'Sarah',
  llm_provider TEXT DEFAULT 'openai',
  llm_model TEXT DEFAULT 'gpt-4o-mini',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT,
  payload TEXT, -- full JSON payload
  processed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_calls_campaign ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON call_logs(status);
CREATE INDEX IF NOT EXISTS idx_calls_disposition ON call_logs(disposition);
CREATE INDEX IF NOT EXISTS idx_calls_created ON call_logs(created_at);
