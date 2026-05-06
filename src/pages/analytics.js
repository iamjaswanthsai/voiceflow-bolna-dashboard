import { api } from '../utils/api.js';
import { animateCounter } from '../utils/helpers.js';

let chartInstances = [];

export async function renderAnalytics(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const data = await api.getAnalytics();
    const { kpis, dispositionBreakdown, qualificationBreakdown, callsByDay, callsByHour } = data;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h2>Analytics</h2>
          <p>Deep insights into your voice AI performance</p>
        </div>
      </div>

      <div class="analytics-kpi-row">
        <div class="analytics-kpi animate-in stagger-1">
          <div class="analytics-kpi-value" data-counter="${kpis.totalCalls}">0</div>
          <div class="analytics-kpi-label">Total Calls</div>
        </div>
        <div class="analytics-kpi animate-in stagger-2">
          <div class="analytics-kpi-value" style="color:var(--success);" data-counter="${kpis.conversionRate}">0</div>
          <div class="analytics-kpi-label">Conversion Rate %</div>
        </div>
        <div class="analytics-kpi animate-in stagger-3">
          <div class="analytics-kpi-value" style="color:var(--warning);">$<span data-counter="${kpis.totalCost}">0</span></div>
          <div class="analytics-kpi-label">Total Spend</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card animate-in stagger-4">
          <h3>Calls Over Time</h3>
          <div class="chart-container"><canvas id="chart-calls-time"></canvas></div>
        </div>
        <div class="chart-card animate-in stagger-5">
          <h3>Disposition Breakdown</h3>
          <div class="chart-container"><canvas id="chart-disposition"></canvas></div>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-card animate-in stagger-6">
          <h3>Qualification Scores</h3>
          <div class="chart-container"><canvas id="chart-qualification"></canvas></div>
        </div>
        <div class="chart-card animate-in stagger-6">
          <h3>Calls by Hour of Day</h3>
          <div class="chart-container"><canvas id="chart-hourly"></canvas></div>
        </div>
      </div>
    `;

    // Animate counters
    container.querySelectorAll('[data-counter]').forEach(el => {
      animateCounter(el, parseFloat(el.dataset.counter));
    });

    // Build charts after a small delay to let DOM render
    setTimeout(() => buildCharts(data), 100);

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error</h3><p>${err.message}</p></div>`;
  }

  return {
    destroy: () => {
      chartInstances.forEach(c => c.destroy());
      chartInstances = [];
    }
  };
}

function buildCharts(data) {
  const { dispositionBreakdown, qualificationBreakdown, callsByDay, callsByHour } = data;

  const chartDefaults = {
    color: '#94a3b8',
    borderColor: 'rgba(148,163,184,0.1)',
    font: { family: 'Inter' }
  };

  Chart.defaults.color = chartDefaults.color;
  Chart.defaults.font.family = 'Inter';

  // --- Calls Over Time (Line) ---
  const ctxTime = document.getElementById('chart-calls-time');
  if (ctxTime) {
    const c = new Chart(ctxTime, {
      type: 'line',
      data: {
        labels: callsByDay.map(d => {
          const dt = new Date(d.date);
          return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Calls',
          data: callsByDay.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#3b82f6',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { font: { size: 10 } } },
          y: { grid: { color: 'rgba(148,163,184,0.06)' }, beginAtZero: true, ticks: { font: { size: 10 } } }
        }
      }
    });
    chartInstances.push(c);
  }

  // --- Disposition Donut ---
  const ctxDisp = document.getElementById('chart-disposition');
  if (ctxDisp) {
    const colors = {
      'qualified_booked': '#10b981',
      'qualified_interested': '#3b82f6',
      'not_qualified': '#f59e0b',
      'not_interested': '#64748b',
      'callback_requested': '#06b6d4',
      'no_answer': '#475569',
      'voicemail': '#334155',
      'error': '#ef4444'
    };
    const labels = dispositionBreakdown.map(d => (d.disposition || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));

    const c = new Chart(ctxDisp, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: dispositionBreakdown.map(d => d.count),
          backgroundColor: dispositionBreakdown.map(d => colors[d.disposition] || '#475569'),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
          }
        }
      }
    });
    chartInstances.push(c);
  }

  // --- Qualification Scores (Bar) ---
  const ctxQual = document.getElementById('chart-qualification');
  if (ctxQual) {
    const scoreColors = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#fb923c', F: '#ef4444' };
    const c = new Chart(ctxQual, {
      type: 'bar',
      data: {
        labels: qualificationBreakdown.map(q => `Score ${q.qualification_score}`),
        datasets: [{
          label: 'Leads',
          data: qualificationBreakdown.map(q => q.count),
          backgroundColor: qualificationBreakdown.map(q => scoreColors[q.qualification_score] || '#475569'),
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11, weight: 600 } } },
          y: { grid: { color: 'rgba(148,163,184,0.06)' }, beginAtZero: true }
        }
      }
    });
    chartInstances.push(c);
  }

  // --- Calls by Hour (Bar) ---
  const ctxHourly = document.getElementById('chart-hourly');
  if (ctxHourly) {
    const c = new Chart(ctxHourly, {
      type: 'bar',
      data: {
        labels: callsByHour.map(h => `${h.hour}:00`),
        datasets: [{
          label: 'Calls',
          data: callsByHour.map(h => h.count),
          backgroundColor: 'rgba(99,102,241,0.6)',
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 16
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: 'rgba(148,163,184,0.06)' }, beginAtZero: true }
        }
      }
    });
    chartInstances.push(c);
  }
}
