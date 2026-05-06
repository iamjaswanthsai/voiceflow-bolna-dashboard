import { api } from '../utils/api.js';
import { formatDuration, formatRelativeTime, getDispositionBadge, getStatusBadge } from '../utils/helpers.js';

let expandedRow = null;

export async function renderCalls(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const calls = await api.getCallLogs();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Call Logs</h2>
          <p>View all call executions, transcripts, and extracted data</p>
        </div>
      </div>

      <div class="calls-filters">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input class="search-input" id="call-search" placeholder="Search by name, phone, or company..." />
        </div>
        <select class="filter-select" id="filter-status">
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="no-answer">No Answer</option>
          <option value="failed">Failed</option>
        </select>
        <select class="filter-select" id="filter-disposition">
          <option value="">All Dispositions</option>
          <option value="qualified_booked">Booked</option>
          <option value="qualified_interested">Interested</option>
          <option value="not_qualified">Not Qualified</option>
          <option value="not_interested">Not Interested</option>
          <option value="callback_requested">Callback</option>
          <option value="no_answer">No Answer</option>
        </select>
      </div>

      <div class="data-table-wrapper glass-card" style="padding:0;">
        <table class="data-table" id="calls-table">
          <thead>
            <tr>
              <th style="width:30px;"></th>
              <th>Lead</th>
              <th>Company</th>
              <th>Status</th>
              <th>Disposition</th>
              <th>Score</th>
              <th>Duration</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody id="calls-tbody"></tbody>
        </table>
      </div>
    `;

    renderCallRows(calls);

    // Filter handlers
    let debounce;
    const applyFilters = () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const filters = {
          search: document.getElementById('call-search').value,
          status: document.getElementById('filter-status').value,
          disposition: document.getElementById('filter-disposition').value
        };
        const filtered = await api.getCallLogs(filters);
        renderCallRows(filtered);
      }, 300);
    };

    document.getElementById('call-search').addEventListener('input', applyFilters);
    document.getElementById('filter-status').addEventListener('change', applyFilters);
    document.getElementById('filter-disposition').addEventListener('change', applyFilters);

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error</h3><p>${err.message}</p></div>`;
  }

  return { destroy: () => { expandedRow = null; } };
}

function renderCallRows(calls) {
  const tbody = document.getElementById('calls-tbody');
  if (!tbody) return;

  if (calls.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state" style="padding:40px;"><h3>No calls found</h3><p>Adjust your filters or wait for calls to come in.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = calls.map(call => {
    const status = getStatusBadge(call.status);
    const disp = getDispositionBadge(call.disposition);
    const scoreClass = call.qualification_score ? `score-${call.qualification_score}` : '';

    return `
      <tr class="call-row-expandable" data-call-id="${call.id}">
        <td><span class="call-expand-icon">▸</span></td>
        <td><strong>${call.lead_name || '—'}</strong><br><span style="font-size:11px;color:var(--text-muted);">${call.lead_phone || ''}</span></td>
        <td>${call.lead_company || '—'}</td>
        <td><span class="badge ${status.class}"><span class="badge-dot"></span>${status.label}</span></td>
        <td><span class="badge ${disp.class}">${disp.label}</span></td>
        <td>${call.qualification_score ? `<span class="score-badge ${scoreClass}">${call.qualification_score}</span>` : '—'}</td>
        <td>${formatDuration(call.duration_seconds)}</td>
        <td style="font-size:12px;color:var(--text-muted);">${formatRelativeTime(call.created_at)}</td>
      </tr>
      <tr class="call-detail-row" id="detail-${call.id}" style="display:none;">
        <td colspan="8">
          <div class="call-detail-content" id="detail-content-${call.id}">
            <div class="loading-spinner" style="margin:20px auto;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Expand/collapse handlers
  tbody.querySelectorAll('.call-row-expandable').forEach(row => {
    row.addEventListener('click', async () => {
      const callId = row.dataset.callId;
      const detailRow = document.getElementById(`detail-${callId}`);

      if (expandedRow && expandedRow !== callId) {
        const prev = document.getElementById(`detail-${expandedRow}`);
        if (prev) prev.style.display = 'none';
        document.querySelector(`[data-call-id="${expandedRow}"]`)?.classList.remove('expanded');
      }

      if (detailRow.style.display === 'none') {
        detailRow.style.display = '';
        row.classList.add('expanded');
        expandedRow = callId;
        await loadCallDetail(callId);
      } else {
        detailRow.style.display = 'none';
        row.classList.remove('expanded');
        expandedRow = null;
      }
    });
  });
}

async function loadCallDetail(callId) {
  const contentEl = document.getElementById(`detail-content-${callId}`);
  if (!contentEl) return;

  try {
    const call = await api.getCallLog(callId);
    const ed = call.extracted_data || {};

    contentEl.innerHTML = `
      <div class="call-detail-grid">
        <div class="call-detail-section">
          <h4>Extracted Data</h4>
          ${Object.keys(ed).length > 0 ? Object.entries(ed).map(([key, val]) => `
            <div class="detail-item">
              <span class="detail-label">${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
              <span class="detail-value">${typeof val === 'boolean' ? (val ? '✅ Yes' : '❌ No') : val}</span>
            </div>
          `).join('') : '<p style="font-size:12px;color:var(--text-muted);">No extracted data available</p>'}
        </div>
        <div class="call-detail-section">
          <h4>Call Info</h4>
          <div class="detail-item"><span class="detail-label">Call ID</span><span class="detail-value" style="font-size:11px;font-family:monospace;">${call.id.slice(0, 12)}...</span></div>
          <div class="detail-item"><span class="detail-label">Duration</span><span class="detail-value">${formatDuration(call.duration_seconds)}</span></div>
          <div class="detail-item"><span class="detail-label">Cost</span><span class="detail-value">$${call.cost?.toFixed(2) || '0.00'}</span></div>
          ${call.appointment_date ? `<div class="detail-item"><span class="detail-label">Appointment</span><span class="detail-value" style="color:var(--success);">${new Date(call.appointment_date).toLocaleDateString()}</span></div>` : ''}
        </div>
      </div>
      ${call.transcript ? `
        <div style="margin-top:16px;">
          <h4 style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Transcript</h4>
          <div class="transcript-box">${formatTranscript(call.transcript)}</div>
        </div>
      ` : ''}
    `;
  } catch (err) {
    contentEl.innerHTML = `<p style="color:var(--error);font-size:13px;">Failed to load details: ${err.message}</p>`;
  }
}

function formatTranscript(text) {
  if (!text) return '';
  return text
    .replace(/Sarah:/g, '<strong>Sarah:</strong>')
    .replace(/\n/g, '<br>');
}
