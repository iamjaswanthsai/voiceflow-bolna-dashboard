# 🎙️ VoiceFlow AI — Enterprise Lead Qualification Dashboard

> AI-powered voice agent for automated B2B lead qualification & appointment scheduling, built on [Bolna](https://bolna.ai).

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)
![Bolna](https://img.shields.io/badge/Bolna-Voice_AI-3b82f6)

## 🚀 Live Demo

**Full Flow**: User → Web App → Bolna Voice Agent → Backend Webhook → Structured Output

Navigate to the **Live Demo** page in the sidebar to see the complete end-to-end flow in action.

---

## 📋 Enterprise Use Case

**Problem**: B2B SaaS companies lose 35-50% of inbound leads due to slow response times (avg 42 hours).

**Solution**: AI voice agent makes outbound calls within 60 seconds, qualifies leads using **BANT criteria** (Budget, Authority, Need, Timeline), and books appointments automatically.

| Metric | Before (Manual) | After (Voice AI) | Impact |
|--------|-----------------|-------------------|--------|
| Lead Response Time | 42 hours | < 60 seconds | 2,500x faster |
| Cost per Qualification | $15-25 | $0.50-1.50 | 90% reduction |
| Appointments/Day | 8-12 | 40-80 | 5x throughput |

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend   │────▸│  Express Backend  │────▸│  Bolna API   │
│  (Vite SPA)  │◂────│   (Port 3001)     │◂────│  Voice Agent │
│  Port 5173   │     │                  │     │              │
└──────────────┘     │  ┌────────────┐  │     └──────────────┘
                     │  │  SQLite DB │  │
                     │  └────────────┘  │
                     │  ┌────────────┐  │
                     │  │  Webhook   │◂─── Bolna POST callbacks
                     │  │  Handler   │  │
                     │  └────────────┘  │
                     └──────────────────┘
```

## 🤖 Bolna Voice Agent

- **Agent**: LeadQualifier-Sarah
- **Persona**: Friendly, professional Business Development Representative
- **Qualification**: BANT framework (Budget, Authority, Need, Timeline)
- **Stack**: Deepgram Nova-3 (STT) → GPT-4o-mini (LLM) → ElevenLabs (TTS)
- **Webhook**: Real-time call data extraction via POST callbacks

### Structured System Prompt

The agent uses a carefully engineered prompt with:
- **Personality** definition (warm, professional, concise)
- **Conversation rules** (one question at a time, no pressure)
- **BANT qualification criteria** with specific probing questions
- **Guardrails** (no pricing, no competitor bashing, respect opt-outs)

---

## 📱 Web App — 6 Pages

| Page | Description |
|------|-------------|
| **Dashboard** | KPI cards, qualification funnel, live activity feed |
| **🔴 Live Demo** | Interactive full-flow demonstration |
| **Campaigns** | Create/manage outbound calling campaigns |
| **Call Logs** | Searchable table with expandable transcripts & BANT data |
| **Analytics** | 4 Chart.js visualizations (trends, disposition, scores, hourly) |
| **Settings** | Agent prompt editor, API key config, Bolna JSON payload preview |

---

## ⚡ Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/voiceflow-bolna-dashboard.git
cd voiceflow-bolna-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Bolna API key (or leave DEMO_MODE=true)

# Seed demo data
npm run seed

# Start development servers
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOLNA_API_KEY` | Your Bolna API key | `demo_key` |
| `BOLNA_API_URL` | Bolna API endpoint | `https://api.bolna.ai` |
| `PORT` | Backend server port | `3001` |
| `DEMO_MODE` | Use simulated data | `true` |

---

## 🔧 Tech Stack

- **Frontend**: Vanilla JS + Vite (SPA with hash router)
- **Styling**: Custom CSS — dark mode glassmorphism, CSS variables
- **Backend**: Express.js (Node.js)
- **Database**: SQLite via better-sqlite3
- **Charts**: Chart.js 4.x
- **Voice AI**: Bolna API (Deepgram + GPT-4o-mini + ElevenLabs)

## 📂 Project Structure

```
├── server/
│   ├── index.js              # Express server
│   ├── routes/
│   │   ├── api.js            # REST API (campaigns, calls, analytics)
│   │   ├── webhook.js        # Bolna webhook handler
│   │   └── bolna.js          # Bolna API proxy
│   ├── services/
│   │   └── bolna.js          # Bolna API client
│   └── db/
│       ├── schema.sql        # SQLite schema
│       ├── database.js       # Queries & helpers
│       └── seed.js           # Demo data seeder
├── src/
│   ├── index.html            # HTML shell
│   ├── main.js               # App entry & routing
│   ├── styles/               # CSS design system + page styles
│   ├── pages/                # Dashboard, Demo, Campaigns, Calls, Analytics, Settings
│   ├── components/           # Sidebar
│   └── utils/                # Router, API client, helpers
├── package.json
├── vite.config.js
└── .env.example
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/analytics` | Dashboard analytics & KPIs |
| GET/POST | `/api/campaigns` | Campaign CRUD |
| GET | `/api/calls` | Call logs (with search/filter) |
| GET | `/api/agent-config` | Agent configuration |
| PUT | `/api/agent-config` | Update agent config |
| POST | `/api/webhook/bolna` | Bolna webhook receiver |
| POST | `/api/bolna/agent` | Create agent on Bolna |
| POST | `/api/bolna/call` | Initiate outbound call |
| GET | `/api/bolna/config-payload` | Preview Bolna API payload |

---

## 📄 License

MIT
