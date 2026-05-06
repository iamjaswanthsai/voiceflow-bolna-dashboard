/**
 * Utility Helpers
 */

export function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function getDispositionBadge(disposition) {
  const map = {
    'qualified_booked': { label: 'Booked', class: 'badge-success' },
    'qualified_interested': { label: 'Interested', class: 'badge-info' },
    'not_qualified': { label: 'Not Qualified', class: 'badge-warning' },
    'not_interested': { label: 'Not Interested', class: 'badge-neutral' },
    'callback_requested': { label: 'Callback', class: 'badge-info' },
    'no_answer': { label: 'No Answer', class: 'badge-neutral' },
    'voicemail': { label: 'Voicemail', class: 'badge-neutral' },
    'error': { label: 'Error', class: 'badge-error' }
  };
  return map[disposition] || { label: disposition || '—', class: 'badge-neutral' };
}

export function getStatusBadge(status) {
  const map = {
    'draft': { label: 'Draft', class: 'badge-neutral' },
    'active': { label: 'Active', class: 'badge-success' },
    'paused': { label: 'Paused', class: 'badge-warning' },
    'completed': { label: 'Completed', class: 'badge-info' },
    'initiated': { label: 'Initiated', class: 'badge-info' },
    'ringing': { label: 'Ringing', class: 'badge-warning' },
    'in-progress': { label: 'In Progress', class: 'badge-success' },
    'failed': { label: 'Failed', class: 'badge-error' },
    'no-answer': { label: 'No Answer', class: 'badge-neutral' },
    'busy': { label: 'Busy', class: 'badge-warning' }
  };
  return map[status] || { label: status || '—', class: 'badge-neutral' };
}

export function animateCounter(element, target, duration = 1200) {
  const start = 0;
  const startTime = performance.now();
  const isDecimal = String(target).includes('.');

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
    const current = start + (target - start) * eased;

    element.textContent = isDecimal ? current.toFixed(1) : Math.round(current).toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
