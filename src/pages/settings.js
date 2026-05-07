import { api } from '../utils/api.js';

export async function renderSettings(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const [config, payload] = await Promise.all([
      api.getAgentConfig(),
      api.getBolnaPayload()
    ]);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Agent Settings</h2>
          <p>Configure your Bolna Voice AI agent</p>
        </div>
        <button class="btn btn-primary" id="btn-save-config">💾 Save Changes</button>
      </div>

      <div class="settings-grid">
        <!-- Agent Identity -->
        <div class="settings-section">
          <h3>Agent Identity</h3>
          <p class="section-desc">Basic agent configuration</p>
          <div class="form-group">
            <label class="form-label">Agent Name</label>
            <input class="form-input" id="cfg-agent-name" value="${config.agent_name || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Voice Provider</label>
            <select class="form-select" id="cfg-voice-provider">
              <option value="elevenlabs" ${config.voice_provider === 'elevenlabs' ? 'selected' : ''}>ElevenLabs</option>
              <option value="aws_polly" ${config.voice_provider === 'aws_polly' ? 'selected' : ''}>AWS Polly</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Voice Name</label>
            <input class="form-input" id="cfg-voice-name" value="${config.voice_name || 'Sarah'}" />
          </div>
          <div class="form-group">
            <label class="form-label">LLM Model</label>
            <select class="form-select" id="cfg-llm-model">
              <option value="gpt-4o-mini" ${config.llm_model === 'gpt-4o-mini' ? 'selected' : ''}>GPT-4o Mini</option>
              <option value="gpt-4o" ${config.llm_model === 'gpt-4o' ? 'selected' : ''}>GPT-4o</option>
              <option value="gpt-4-turbo" ${config.llm_model === 'gpt-4-turbo' ? 'selected' : ''}>GPT-4 Turbo</option>
            </select>
          </div>
        </div>

        <!-- Webhook & API -->
        <div class="settings-section">
          <h3>Integration</h3>
          <p class="section-desc">Webhook and API configuration</p>
          <div class="form-group">
            <label class="form-label">Webhook URL</label>
            <div class="webhook-url-display">
              <span id="webhook-url">${config.webhook_url}</span>
              <button class="copy-btn" id="btn-copy-webhook">Copy</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Bolna API Key</label>
            <div class="api-key-input">
              <input class="form-input" id="cfg-api-key" type="password" value="${config.bolna_api_key_masked}" readonly />
              <button class="api-key-toggle" id="btn-toggle-key">Show</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Bolna Agent ID</label>
            <input class="form-input" id="cfg-bolna-agent-id" value="${config.bolna_agent_id || ''}" placeholder="Will be populated after agent creation" />
          </div>
          <div style="margin-top:12px;">
            <button class="btn btn-secondary" id="btn-create-agent">🤖 Create Agent on Bolna</button>
          </div>
        </div>

        <!-- Welcome Message -->
        <div class="settings-section">
          <h3>Welcome Message</h3>
          <p class="section-desc">First thing the agent says when the call connects</p>
          <div class="form-group">
            <textarea class="form-textarea" id="cfg-welcome-msg" rows="4">${config.welcome_message || ''}</textarea>
          </div>
          <p style="font-size:11px;color:var(--text-muted);">Variables: {lead_name}, {company_name}, {product_name}, {lead_source}</p>
        </div>

        <!-- System Prompt -->
        <div class="settings-section">
          <h3>System Prompt</h3>
          <p class="section-desc">The brain of your agent — instructions, personality, and guardrails</p>
          <div class="form-group">
            <textarea class="form-textarea" id="cfg-system-prompt" rows="12" style="font-size:12px;line-height:1.7;min-height:280px;">${config.system_prompt || ''}</textarea>
          </div>
        </div>

        <!-- API Payload Preview -->
        <div class="settings-section full-width">
          <h3>Bolna API Payload Preview</h3>
          <p class="section-desc">This is the JSON config that would be sent to Bolna's API when creating/updating the agent</p>
          <div class="config-preview" id="config-preview">${syntaxHighlight(JSON.stringify(payload, null, 2))}</div>
        </div>
      </div>
    `;

    // --- Event Handlers ---

    // Copy webhook
    document.getElementById('btn-copy-webhook')?.addEventListener('click', () => {
      const url = document.getElementById('webhook-url').textContent;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btn-copy-webhook');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    });

    // Toggle API key visibility
    document.getElementById('btn-toggle-key')?.addEventListener('click', () => {
      const input = document.getElementById('cfg-api-key');
      const btn = document.getElementById('btn-toggle-key');
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
      } else {
        input.type = 'password';
        btn.textContent = 'Show';
      }
    });

    // Save config
    document.getElementById('btn-save-config')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-save-config');
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        await api.updateAgentConfig({
          agent_name: document.getElementById('cfg-agent-name').value,
          voice_provider: document.getElementById('cfg-voice-provider').value,
          voice_name: document.getElementById('cfg-voice-name').value,
          llm_model: document.getElementById('cfg-llm-model').value,
          welcome_message: document.getElementById('cfg-welcome-msg').value,
          system_prompt: document.getElementById('cfg-system-prompt').value,
          bolna_agent_id: document.getElementById('cfg-bolna-agent-id').value
        });

        // Refresh payload preview
        const newPayload = await api.getBolnaPayload();
        document.getElementById('config-preview').innerHTML = syntaxHighlight(JSON.stringify(newPayload, null, 2));

        btn.textContent = '✅ Saved!';
        setTimeout(() => { btn.textContent = '💾 Save Changes'; btn.disabled = false; }, 2000);
      } catch (err) {
        btn.textContent = '❌ Error';
        setTimeout(() => { btn.textContent = '💾 Save Changes'; btn.disabled = false; }, 2000);
      }
    });

    // Create agent
    document.getElementById('btn-create-agent')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-create-agent');
      btn.textContent = 'Creating...';
      btn.disabled = true;

      try {
        const result = await api.createBolnaAgent();
        if (result.agent_id) {
          document.getElementById('cfg-bolna-agent-id').value = result.agent_id;
        }
        btn.textContent = '✅ Agent Created!';
        setTimeout(() => { btn.textContent = '🤖 Create Agent on Bolna'; btn.disabled = false; }, 3000);
      } catch (err) {
        btn.textContent = '❌ Failed';
        setTimeout(() => { btn.textContent = '🤖 Create Agent on Bolna'; btn.disabled = false; }, 3000);
      }
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error</h3><p>${err.message}</p></div>`;
  }

  return {};
}

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-number">$1</span>');
}
