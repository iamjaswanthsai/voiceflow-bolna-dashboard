/**
 * Bolna API Client Service
 * Wraps Bolna REST API calls. Falls back to demo responses when DEMO_MODE=true.
 */

const BOLNA_API_URL = process.env.BOLNA_API_URL || 'https://api.bolna.ai';
const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

async function bolnaFetch(path, options = {}) {
  if (DEMO_MODE) {
    return getDemoResponse(path, options.method || 'GET');
  }

  const res = await fetch(`${BOLNA_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BOLNA_API_KEY}`,
      ...options.headers
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bolna API error ${res.status}: ${body}`);
  }

  return res.json();
}

// --- Agent Management ---

export async function createAgent(config) {
  return bolnaFetch('/v2/agent', {
    method: 'POST',
    body: JSON.stringify(config)
  });
}

export async function getAgent(agentId) {
  return bolnaFetch(`/v2/agent/${agentId}`);
}

export async function updateAgent(agentId, config) {
  return bolnaFetch(`/v2/agent/${agentId}`, {
    method: 'PUT',
    body: JSON.stringify(config)
  });
}

export async function deleteAgent(agentId) {
  return bolnaFetch(`/v2/agent/${agentId}`, { method: 'DELETE' });
}

export async function listAgents() {
  return bolnaFetch('/v2/agent');
}

// --- Phone Calls ---

export async function makeCall(agentId, phoneNumber, variables = {}) {
  return bolnaFetch('/v2/call', {
    method: 'POST',
    body: JSON.stringify({
      agent_id: agentId,
      phone_number: phoneNumber,
      variables
    })
  });
}

export async function stopCall(callId) {
  return bolnaFetch(`/v2/call/${callId}/stop`, { method: 'POST' });
}

// --- Execution Data ---

export async function getExecution(executionId) {
  return bolnaFetch(`/v2/execution/${executionId}`);
}

export async function getExecutions(agentId, limit = 50) {
  return bolnaFetch(`/v2/agent/${agentId}/executions?limit=${limit}`);
}

// --- Build Agent Config Payload ---

export function buildAgentPayload(config) {
  return {
    agent_config: {
      agent_name: config.agent_name || 'LeadQualifier-Sarah',
      agent_type: 'other',
      agent_welcome_message: config.welcome_message || 'Hi! This is Sarah. Do you have a quick minute to chat?',
      webhook_url: config.webhook_url || '',
      tasks: [
        {
          task_type: 'conversation',
          toolchain: {
            execution: 'parallel',
            pipelines: [['transcriber', 'llm', 'synthesizer']]
          },
          tools_config: {
            transcriber: {
              provider: 'deepgram',
              model: 'nova-3',
              language: 'en'
            },
            llm_agent: {
              agent_type: 'simple_llm_agent',
              provider: config.llm_provider || 'openai',
              llm_config: {
                provider: config.llm_provider || 'openai',
                model: config.llm_model || 'gpt-4o-mini',
                request_json: false
              },
              agent_flow_type: 'streaming'
            },
            synthesizer: {
              provider: config.voice_provider || 'elevenlabs',
              provider_config: {
                voice: config.voice_name || 'Sarah',
                voice_id: config.voice_id || 'EXAVITQu4vr4xnSDxMaL',
                model: 'eleven_turbo_v2_5'
              }
            }
          },
          task_config: {
            hangup_after_silence: 20.0,
            number_of_words_for_interruption: 2,
            backchanneling: true,
            optimize_latency: true
          }
        }
      ]
    },
    agent_prompts: {
      task_1: {
        system_prompt: config.system_prompt || ''
      }
    }
  };
}

// --- Demo Mode Responses ---

function getDemoResponse(path, method) {
  if (path.includes('/v2/agent') && method === 'POST') {
    return {
      agent_id: 'demo_agent_' + Date.now(),
      status: 'created',
      message: 'Demo agent created successfully'
    };
  }

  if (path.includes('/v2/call') && method === 'POST') {
    return {
      execution_id: 'demo_exec_' + Date.now(),
      status: 'queued',
      message: 'Demo call queued'
    };
  }

  if (path.includes('/v2/agent')) {
    return {
      agent_id: 'demo_agent_001',
      agent_name: 'LeadQualifier-Sarah',
      status: 'active',
      created_at: new Date().toISOString()
    };
  }

  return { status: 'ok', demo: true };
}

export default {
  createAgent,
  getAgent,
  updateAgent,
  deleteAgent,
  listAgents,
  makeCall,
  stopCall,
  getExecution,
  getExecutions,
  buildAgentPayload
};
