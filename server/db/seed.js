/**
 * Seed script — populates the database with realistic demo data
 * Run: node server/db/seed.js
 */
import 'dotenv/config';
import { v4 as uuid } from 'uuid';
import {
  getDb, createCampaign, bulkCreateLeads, createCallLog
} from './database.js';

console.log('🌱 Seeding demo data...');

// Ensure DB is initialized
getDb();

// --- Campaigns ---
const campaigns = [
  {
    id: uuid(),
    name: 'Q2 SaaS Outreach',
    description: 'Targeting mid-market SaaS companies who downloaded our ROI whitepaper',
    status: 'active',
    total_leads: 150,
    called_leads: 87,
    qualified_leads: 24,
    booked_appointments: 12
  },
  {
    id: uuid(),
    name: 'Enterprise Demo Follow-up',
    description: 'Following up with enterprise leads who attended the May webinar',
    status: 'active',
    total_leads: 45,
    called_leads: 32,
    qualified_leads: 14,
    booked_appointments: 8
  },
  {
    id: uuid(),
    name: 'Startup Pilot Program',
    description: 'Outreach to Y Combinator batch companies for pilot onboarding',
    status: 'completed',
    total_leads: 200,
    called_leads: 200,
    qualified_leads: 52,
    booked_appointments: 31
  },
  {
    id: uuid(),
    name: 'Healthcare Vertical',
    description: 'Targeting healthcare IT decision-makers from HIMSS attendee list',
    status: 'draft',
    total_leads: 80,
    called_leads: 0,
    qualified_leads: 0,
    booked_appointments: 0
  }
];

campaigns.forEach(c => createCampaign(c));
console.log(`  ✅ Created ${campaigns.length} campaigns`);

// --- Leads ---
const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Sai', 'Arnav', 'Dhruv', 'Kabir', 'Ananya', 'Diya', 'Saanvi', 'Isha', 'Aanya', 'Priya', 'Riya', 'Meera', 'Kavya', 'Neha', 'Rohan', 'Karthik', 'Vikram', 'Rahul', 'Pooja'];
const lastNames = ['Patel', 'Sharma', 'Reddy', 'Kumar', 'Gupta', 'Singh', 'Verma', 'Joshi', 'Nair', 'Iyer', 'Mehta', 'Choudhury', 'Rao', 'Malhotra', 'Srinivasan'];
const companies = ['Infosys', 'Zoho Corp', 'Freshworks', 'Razorpay', 'Zerodha', 'PhonePe', 'CRED', 'Postman', 'Swiggy', 'Meesho', 'Flipkart', 'Ola Electric', 'Delhivery', 'Lenskart', 'UpGrad'];
const sources = ['linkedin_ad', 'google_search', 'webinar', 'whitepaper', 'referral', 'cold_outreach', 'website_demo_request'];

const leads = [];
for (let i = 0; i < 60; i++) {
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  leads.push({
    id: uuid(),
    campaign_id: campaigns[i % 3].id,
    name: `${fn} ${ln}`,
    company: companies[Math.floor(Math.random() * companies.length)],
    phone: `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${companies[Math.floor(Math.random() * companies.length)].toLowerCase().replace(/\s+/g, '')}.com`,
    source: sources[Math.floor(Math.random() * sources.length)],
    status: ['pending', 'called', 'qualified', 'not_qualified', 'no_answer'][Math.floor(Math.random() * 5)]
  });
}
bulkCreateLeads(leads);
console.log(`  ✅ Created ${leads.length} leads`);

// --- Call Logs (realistic conversation data) ---
const dispositions = ['qualified_booked', 'qualified_interested', 'not_qualified', 'not_interested', 'callback_requested', 'no_answer', 'voicemail'];
const scores = ['A', 'B', 'C', 'D', 'F'];
const painPoints = [
  'Manual data entry consuming 20+ hours/week',
  'Sales team spending too much time on unqualified leads',
  'Customer onboarding taking 3+ weeks',
  'No visibility into pipeline metrics',
  'High churn due to poor support response times',
  'Compliance reporting taking entire team 2 days/month',
  'Unable to scale outbound sales beyond current team size'
];

const transcriptTemplates = [
  {
    disposition: 'qualified_booked',
    score: 'A',
    transcript: `Sarah: Hi {name}! This is Sarah from VoiceFlow AI. I noticed you were checking out our lead qualification platform recently — do you have a quick minute to chat?\n{name}: Sure, I've been looking into automating our SDR process actually.\nSarah: That's great to hear! A lot of teams in your space are doing the same. Can I ask — what's the biggest challenge your sales team is facing right now?\n{name}: Honestly, {pain_point}. It's been a real bottleneck.\nSarah: I hear that a lot. Our platform typically reduces that by 80% within the first month. Are you the one making decisions on sales tools, or is there someone else involved?\n{name}: I'm the VP of Sales, so yes, it's my call.\nSarah: Perfect. And do you have a budget allocated for this kind of solution?\n{name}: We've set aside around $5-8K per month for sales automation.\nSarah: That's right in range. Are you looking to get something in place soon, or is this more of a long-term evaluation?\n{name}: We want to start within the next 6 weeks ideally.\nSarah: Wonderful. I'd love to set up a 30-minute deep dive with our solutions team. They can show you exactly how it works with your CRM. Would tomorrow at 2 PM or Thursday at 10 AM work better?\n{name}: Thursday at 10 works great.\nSarah: Perfect, you're all set for Thursday at 10 AM. You'll get a calendar invite shortly. Thanks so much for your time, {name}!\n{name}: Thanks, Sarah. Looking forward to it.`
  },
  {
    disposition: 'qualified_interested',
    score: 'B',
    transcript: `Sarah: Hi {name}! This is Sarah from VoiceFlow AI. I'm reaching out because you downloaded our whitepaper on AI-powered sales — did you find it helpful?\n{name}: Yeah, it was interesting. We're exploring options.\nSarah: Glad to hear that! What's driving the interest — is there a specific challenge you're trying to solve?\n{name}: {pain_point}.\nSarah: That's a really common one. Quick question — are you evaluating other solutions as well, or are you just starting to look?\n{name}: We've looked at a couple but haven't committed to anything.\nSarah: Got it. And typically who makes the final call on tools like this at your company?\n{name}: It would be me and our CTO together.\nSarah: Makes sense. Would it be helpful if I sent over a case study from a similar company? Then we could schedule a call when your CTO is available too?\n{name}: Yeah, send that over. Let me talk to my CTO first and we'll circle back.\nSarah: Absolutely! I'll email that right over. Would next week work for a follow-up?\n{name}: Sure, try me Wednesday.\nSarah: Wednesday it is. Thanks for your time, {name}!`
  },
  {
    disposition: 'not_interested',
    score: 'D',
    transcript: `Sarah: Hi {name}! This is Sarah from VoiceFlow AI. Do you have a quick minute?\n{name}: I'm pretty busy actually. What's this about?\nSarah: Totally understand! I'll be brief — you signed up for our demo list and I wanted to see if automating lead qualification is still on your radar?\n{name}: Not really, we just hired two new SDRs so we're good for now.\nSarah: That makes sense! Congrats on the new hires. If things change down the road, we're always here. Have a great day, {name}!\n{name}: Thanks, bye.`
  },
  {
    disposition: 'not_qualified',
    score: 'F',
    transcript: `Sarah: Hi {name}! This is Sarah from VoiceFlow AI. I'm following up on your interest in our platform.\n{name}: Hi Sarah. Yeah, I was curious about it.\nSarah: Great! Can I ask what size team you're working with?\n{name}: It's just me right now. I'm a freelance consultant.\nSarah: Got it! Our platform is really designed for teams of 10+ with dedicated sales operations. For a solo consultant, it might be more than you need right now.\n{name}: Yeah, that makes sense.\nSarah: I'd recommend checking out our blog though — lots of great sales tips that could help. Wishing you all the best with the consulting!\n{name}: Thanks, appreciate it.`
  },
  {
    disposition: 'callback_requested',
    score: 'B',
    transcript: `Sarah: Hi {name}! This is Sarah from VoiceFlow AI. Is this a good time?\n{name}: Actually, I'm in the middle of something. Can you call back?\nSarah: Of course! When works better for you?\n{name}: Tomorrow afternoon, maybe around 3?\nSarah: Tomorrow at 3 PM — I'll make a note. Talk to you then, {name}!\n{name}: Sounds good, thanks.`
  }
];

const callLogs = [];
const now = Date.now();

for (let i = 0; i < 85; i++) {
  const lead = leads[i % leads.length];
  const template = transcriptTemplates[Math.floor(Math.random() * transcriptTemplates.length)];
  const daysAgo = Math.floor(Math.random() * 30);
  const hoursAgo = Math.floor(Math.random() * 24);
  const createdAt = new Date(now - (daysAgo * 86400000) - (hoursAgo * 3600000));

  const isCompleted = Math.random() > 0.15;
  const duration = isCompleted ? Math.floor(45 + Math.random() * 300) : 0;
  const cost = isCompleted ? parseFloat((0.30 + Math.random() * 1.20).toFixed(2)) : 0;

  const disposition = isCompleted ? template.disposition : (Math.random() > 0.5 ? 'no_answer' : null);
  const score = isCompleted ? template.score : null;
  const pain = painPoints[Math.floor(Math.random() * painPoints.length)];

  const transcript = isCompleted
    ? template.transcript.replace(/\{name\}/g, lead.name.split(' ')[0]).replace(/\{pain_point\}/g, pain)
    : null;

  const extractedData = isCompleted ? {
    lead_name: lead.name,
    company: lead.company,
    is_decision_maker: Math.random() > 0.4,
    pain_point: pain,
    budget_range: ['$1-3K/mo', '$3-5K/mo', '$5-10K/mo', '$10K+/mo'][Math.floor(Math.random() * 4)],
    timeline: ['Immediate', '1-2 months', '3-6 months', '6+ months'][Math.floor(Math.random() * 4)],
    qualification_score: score,
    disposition: disposition,
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
  } : null;

  const appointmentDate = disposition === 'qualified_booked'
    ? new Date(now + Math.floor(Math.random() * 14) * 86400000).toISOString()
    : null;

  callLogs.push({
    id: uuid(),
    lead_id: lead.id,
    campaign_id: lead.campaign_id,
    agent_id: 'demo_agent_001',
    bolna_execution_id: `exec_${uuid().slice(0, 8)}`,
    lead_name: lead.name,
    lead_phone: lead.phone,
    lead_company: lead.company,
    status: isCompleted ? 'completed' : (Math.random() > 0.5 ? 'no-answer' : 'failed'),
    disposition: disposition,
    qualification_score: score,
    duration_seconds: duration,
    cost: cost,
    transcript: transcript,
    extracted_data: extractedData,
    recording_url: null,
    appointment_date: appointmentDate,
    notes: null
  });
}

// Manually set created_at via raw SQL since the helper uses CURRENT_TIMESTAMP
const db = getDb();
const insertStmt = db.prepare(`
  INSERT INTO call_logs (id, lead_id, campaign_id, agent_id, bolna_execution_id, lead_name, lead_phone, lead_company, status, disposition, qualification_score, duration_seconds, cost, transcript, extracted_data, recording_url, appointment_date, notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAll = db.transaction((logs) => {
  for (const l of logs) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const createdAt = new Date(now - (daysAgo * 86400000) - (hoursAgo * 3600000)).toISOString();

    insertStmt.run(
      l.id, l.lead_id, l.campaign_id, l.agent_id, l.bolna_execution_id,
      l.lead_name, l.lead_phone, l.lead_company,
      l.status, l.disposition, l.qualification_score,
      l.duration_seconds, l.cost,
      l.transcript,
      l.extracted_data ? JSON.stringify(l.extracted_data) : null,
      l.recording_url, l.appointment_date, l.notes,
      createdAt
    );
  }
});

insertAll(callLogs);
console.log(`  ✅ Created ${callLogs.length} call logs`);

console.log('\n🎉 Seed complete! Run `npm run dev` to start the app.');
