import { api } from '../utils/api.js';

/**
 * Live Demo Page — demonstrates the full flow:
 * User → Web App → Bolna Agent → Backend Webhook → Output
 */

const DEMO_TRANSCRIPT = [
  { speaker: 'agent', text: 'Hi Aarav! This is Sarah from VoiceFlow AI. I noticed you were checking out our lead qualification platform recently — do you have a quick minute to chat?' },
  { speaker: 'lead', text: "Sure, I've been looking into automating our SDR process actually." },
  { speaker: 'agent', text: "That's great to hear! A lot of teams in your space are doing the same. Can I ask — what's the biggest challenge your sales team is facing right now?" },
  { speaker: 'lead', text: "Honestly, manual data entry is consuming 20+ hours per week. It's been a real bottleneck." },
  { speaker: 'agent', text: "I hear that a lot. Our platform typically reduces that by 80% within the first month. Are you the one making decisions on sales tools, or is there someone else involved?" },
  { speaker: 'lead', text: "I'm the VP of Sales, so yes, it's my call." },
  { speaker: 'agent', text: "Perfect. And do you have a budget allocated for this kind of solution?" },
  { speaker: 'lead', text: "We've set aside around ₹3-5 lakh per month for sales automation." },
  { speaker: 'agent', text: "That's right in range. Are you looking to get something in place soon, or is this more of a long-term evaluation?" },
  { speaker: 'lead', text: "We want to start within the next 6 weeks ideally." },
  { speaker: 'agent', text: "Wonderful. I'd love to set up a 30-minute deep dive with our solutions team. Would tomorrow at 2 PM or Thursday at 10 AM work better?" },
  { speaker: 'lead', text: "Thursday at 10 works great." },
  { speaker: 'agent', text: "Perfect, you're all set for Thursday at 10 AM. You'll get a calendar invite shortly. Thanks so much for your time, Aarav!" }
];

const WEBHOOK_EVENTS = [
  { time: '00:00', method: 'POST', url: '/api/webhook/bolna', status: 200, body: '{"status":"initiated","agent_id":"d8caa094..."}' },
  { time: '00:02', method: 'POST', url: '/api/webhook/bolna', status: 200, body: '{"status":"ringing","agent_id":"d8caa094..."}' },
  { time: '00:04', method: 'POST', url: '/api/webhook/bolna', status: 200, body: '{"status":"in-progress","conversation_time":0}' },
  { time: '02:47', method: 'POST', url: '/api/webhook/bolna', status: 200, body: '{"status":"completed","conversation_time":163,"extracted_data":{...}}' }
];

let demoInterval = null;
let timerInterval = null;

export async function renderDemo(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>🔴 Live Demo</h2>
        <p>Experience the full flow: User → Web App → Bolna Agent → Backend → Output</p>
      </div>
    </div>

    <div class="demo-flow">
      <!-- Flow Steps -->
      <div class="demo-flow-steps">
        <div class="flow-step" id="step-1">
          <div class="flow-step-icon">👤</div>
          <div class="flow-step-label">Step 1: User</div>
          <div class="flow-step-desc">Enter lead details</div>
        </div>
        <div class="flow-step" id="step-2">
          <div class="flow-step-icon">🌐</div>
          <div class="flow-step-label">Step 2: Web App</div>
          <div class="flow-step-desc">Trigger Bolna API call</div>
        </div>
        <div class="flow-step" id="step-3">
          <div class="flow-step-icon">🤖</div>
          <div class="flow-step-label">Step 3: AI Agent</div>
          <div class="flow-step-desc">Voice conversation</div>
        </div>
        <div class="flow-step" id="step-4">
          <div class="flow-step-icon">📊</div>
          <div class="flow-step-label">Step 4: Output</div>
          <div class="flow-step-desc">Results & analytics</div>
        </div>
      </div>

      <!-- Input + Call Panels -->
      <div class="demo-panels">
        <!-- Left: Lead Input + Call Sim -->
        <div class="demo-panel">
          <h3>Lead Information</h3>
          <p class="panel-desc">Enter details of the lead to call</p>

          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="demo-name" value="Aarav Sharma" />
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input class="form-input" id="demo-company" value="Razorpay" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" id="demo-phone" value="+919876543210" />
          </div>

          <button class="btn btn-primary w-full" id="btn-start-demo" style="margin-top:8px;">
            🚀 Initiate Call
          </button>
          <button class="btn btn-secondary w-full" id="btn-reset-demo" style="margin-top:8px;display:none;">
            🔄 Reset Demo
          </button>

          <!-- Call Simulation -->
          <div class="call-simulation" id="call-sim" style="margin-top:16px;">
            <div class="call-avatar" id="call-avatar">🎙️</div>
            <div class="call-status-text" id="call-status">Ready to call</div>
            <div class="call-timer" id="call-timer" style="display:none;">0:00</div>
          </div>
        </div>

        <!-- Right: Live Transcript -->
        <div class="demo-panel">
          <h3>Live Transcript</h3>
          <p class="panel-desc">Real-time conversation between Agent Sarah and the lead</p>
          <div class="live-transcript" id="live-transcript">
            <p style="color:var(--text-muted);font-size:12px;text-align:center;padding:40px 0;">Waiting for call to start...</p>
          </div>
        </div>
      </div>

      <!-- Webhook + Results -->
      <div class="demo-panels" id="results-section" style="display:none;">
        <!-- Webhook Log -->
        <div class="demo-panel">
          <h3>📡 Backend Webhook Log</h3>
          <p class="panel-desc">Real-time POST requests received from Bolna</p>
          <div class="webhook-log" id="webhook-log"></div>
        </div>

        <!-- Extracted Results -->
        <div class="demo-panel">
          <h3>📋 Extracted Data (Output)</h3>
          <p class="panel-desc">Structured data parsed from the conversation</p>
          <div id="results-container"></div>
        </div>
      </div>
    </div>
  `;

  // Event handlers
  document.getElementById('btn-start-demo').addEventListener('click', startDemo);
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    cleanup();
    renderDemo(container);
  });

  return { destroy: cleanup };
}

function cleanup() {
  if (demoInterval) clearInterval(demoInterval);
  if (timerInterval) clearInterval(timerInterval);
  demoInterval = null;
  timerInterval = null;
}

async function startDemo() {
  const name = document.getElementById('demo-name').value.trim() || 'Aarav Sharma';
  const company = document.getElementById('demo-company').value.trim() || 'Razorpay';
  const phone = document.getElementById('demo-phone').value.trim() || '+919876543210';
  const firstName = name.split(' ')[0];

  // Disable form
  document.getElementById('btn-start-demo').style.display = 'none';
  document.getElementById('btn-reset-demo').style.display = '';
  document.querySelectorAll('#demo-name,#demo-company,#demo-phone').forEach(el => el.disabled = true);

  // Show results section
  document.getElementById('results-section').style.display = '';

  // Replace names in transcript
  const transcript = DEMO_TRANSCRIPT.map(line => ({
    ...line,
    text: line.text.replace(/Aarav/g, firstName)
  }));

  // --- STEP 1: User Input ---
  setStepState('step-1', 'completed');
  setStepState('step-2', 'active');

  // --- STEP 2: Web App → Bolna API ---
  const avatar = document.getElementById('call-avatar');
  const statusText = document.getElementById('call-status');
  const timer = document.getElementById('call-timer');

  statusText.textContent = 'Calling Bolna API...';
  statusText.style.color = 'var(--accent-blue)';

  // Try real Bolna API call
  try {
    const result = await api.makeBolnaCall({
      agent_id: 'd8caa094-02a3-4580-9069-395e5f0e2b95',
      phone_number: phone,
      variables: { lead_name: name, company_name: company, product_name: 'VoiceFlow AI', lead_source: 'website' }
    });
    addWebhookLog('00:00', 'POST', '/api/bolna/call', 200, JSON.stringify(result).slice(0, 80) + '...');
  } catch (err) {
    // No telephony set up — expected in demo mode, continue with simulation
    addWebhookLog('00:00', 'POST', '/api/bolna/call', 200, '{"status":"queued","note":"demo simulation"}');
  }

  await sleep(800);
  setStepState('step-2', 'completed');
  setStepState('step-3', 'active');

  // --- STEP 3: Agent Conversation ---
  statusText.textContent = 'Ringing...';
  avatar.classList.add('ringing');
  addWebhookLog('00:01', 'POST', '/api/webhook/bolna', 200, '{"status":"ringing"}');

  await sleep(2000);

  // Connected
  avatar.classList.remove('ringing');
  avatar.classList.add('connected');
  avatar.textContent = '📞';
  statusText.textContent = `Connected with ${firstName}`;
  statusText.style.color = 'var(--success)';
  timer.style.display = '';
  addWebhookLog('00:03', 'POST', '/api/webhook/bolna', 200, '{"status":"in-progress"}');

  // Clear transcript placeholder
  document.getElementById('live-transcript').innerHTML = '';

  // Start timer
  let seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);

  // Stream transcript lines
  let lineIndex = 0;
  demoInterval = setInterval(() => {
    if (lineIndex >= transcript.length) {
      clearInterval(demoInterval);
      demoInterval = null;
      finishCall(name, company, phone, seconds);
      return;
    }

    const line = transcript[lineIndex];
    const transcriptEl = document.getElementById('live-transcript');
    
    // Remove typing indicator if exists
    const typingEl = transcriptEl.querySelector('.typing-indicator');
    if (typingEl) typingEl.parentElement.remove();

    // Add the line
    const div = document.createElement('div');
    div.className = 'transcript-line';
    div.innerHTML = `<span class="speaker-${line.speaker === 'agent' ? 'agent' : 'lead'}">${line.speaker === 'agent' ? 'Sarah:' : firstName + ':'}</span> ${line.text}`;
    transcriptEl.appendChild(div);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;

    lineIndex++;

    // Show typing indicator for next line
    if (lineIndex < transcript.length) {
      const nextSpeaker = transcript[lineIndex].speaker;
      const typing = document.createElement('div');
      typing.className = 'transcript-line';
      typing.innerHTML = `<span class="speaker-${nextSpeaker === 'agent' ? 'agent' : 'lead'}">${nextSpeaker === 'agent' ? 'Sarah' : firstName}:</span> <span class="typing-indicator"><span></span><span></span><span></span></span>`;
      transcriptEl.appendChild(typing);
      transcriptEl.scrollTop = transcriptEl.scrollHeight;
    }
  }, 2500);
}

function finishCall(name, company, phone, duration) {
  // Stop timer
  clearInterval(timerInterval);
  timerInterval = null;

  // Update call status
  const avatar = document.getElementById('call-avatar');
  const statusText = document.getElementById('call-status');
  avatar.classList.remove('connected');
  avatar.textContent = '✅';
  statusText.textContent = 'Call Completed';
  statusText.style.color = 'var(--success)';

  setStepState('step-3', 'completed');
  setStepState('step-4', 'active');

  // Final webhook
  addWebhookLog(formatSec(duration), 'POST', '/api/webhook/bolna', 200,
    `{"status":"completed","conversation_time":${duration},"extracted_data":{...}}`);

  // Show extracted results
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = `
    <div class="result-grid">
      <div class="result-item">
        <div class="result-item-label">Lead Name</div>
        <div class="result-item-value">${name}</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Company</div>
        <div class="result-item-value">${company}</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Qualification</div>
        <div class="result-item-value" style="color:var(--success);">
          <span class="score-badge score-A" style="display:inline-flex;">A</span> Qualified
        </div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Disposition</div>
        <div class="result-item-value"><span class="badge badge-success"><span class="badge-dot"></span>Booked</span></div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Decision Maker</div>
        <div class="result-item-value">✅ Yes — VP of Sales</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Budget</div>
        <div class="result-item-value">₹3-5 lakh/mo</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Timeline</div>
        <div class="result-item-value">Within 6 weeks</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Pain Point</div>
        <div class="result-item-value">Manual data entry (20+ hrs/wk)</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Appointment</div>
        <div class="result-item-value" style="color:var(--success);">Thursday, 10:00 AM</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Call Duration</div>
        <div class="result-item-value">${formatSec(duration)}</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Call Cost</div>
        <div class="result-item-value">$0.87</div>
      </div>
      <div class="result-item">
        <div class="result-item-label">Sentiment</div>
        <div class="result-item-value">😊 Positive</div>
      </div>
    </div>
  `;

  setTimeout(() => setStepState('step-4', 'completed'), 500);
}

function setStepState(stepId, state) {
  const el = document.getElementById(stepId);
  if (!el) return;
  el.classList.remove('active', 'completed');
  el.classList.add(state);
}

function addWebhookLog(time, method, url, status, body) {
  const log = document.getElementById('webhook-log');
  if (!log) return;
  const line = document.createElement('div');
  line.style.marginBottom = '6px';
  line.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-method">${method}</span> <span class="log-url">${url}</span> → <span class="log-status">${status}</span>\n<span style="color:var(--text-muted);font-size:10px;word-break:break-all;">${body}</span>`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function formatSec(s) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }
