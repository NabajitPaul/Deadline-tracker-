const TONE_HEX = {
  urgent: { bar: '#F43F5E', chip: 'rgba(244,63,94,0.16)', text: '#FB7185' },
  critical: { bar: '#EF4444', chip: 'rgba(239,68,68,0.14)', text: '#F87171' },
  high: { bar: '#F97316', chip: 'rgba(249,115,22,0.14)', text: '#FB923C' },
  medium: { bar: '#EAB308', chip: 'rgba(234,179,8,0.14)', text: '#FACC15' },
  safe: { bar: '#22C55E', chip: 'rgba(34,197,94,0.14)', text: '#4ADE80' },
  expired: { bar: '#4B5563', chip: 'rgba(75,85,99,0.16)', text: '#9CA3AF' },
};
const FILTERS = ['All', 'Closing Soon', 'Banking', 'Assam Government', 'Central Government', 'Technical / PSU', 'Applied', 'Not Applied'];

let state = { filter: 'All', query: '', confirmDeleteId: null };

function enrich(jobs) {
  return jobs.map(j => {
    const days = daysRemaining(j.lastDate);
    return Object.assign({}, j, {
      days, priority: priorityOf(days), countdown: countdownLabel(days),
      category: j.category || detectCategory(j.name)
    });
  }).sort((a, b) => (a.days === null ? 99999 : a.days) - (b.days === null ? 99999 : b.days));
}

function applyFilters(list) {
  let out = list;
  if (state.filter === 'Closing Soon') out = out.filter(j => j.days !== null && j.days >= 0 && j.days <= 7);
  else if (state.filter === 'Applied') out = out.filter(j => j.applied);
  else if (state.filter === 'Not Applied') out = out.filter(j => !j.applied);
  else if (['Banking', 'Assam Government', 'Central Government', 'Technical / PSU'].includes(state.filter)) out = out.filter(j => j.category === state.filter);
  if (state.query.trim()) {
    const q = state.query.trim().toLowerCase();
    out = out.filter(j => j.name.toLowerCase().includes(q));
  }
  return out;
}

function render() {
  const jobs = enrich(getJobs());
  const filtered = applyFilters(jobs);
  const dueToday = jobs.filter(j => j.days !== null && REMINDER_MILESTONES.includes(j.days) && !j.applied);
  const closingSoon = jobs.filter(j => j.days !== null && j.days >= 0 && j.days <= 7).length;

  document.getElementById('subtitle').innerHTML =
    jobs.length + ' tracked · <span style="color:' + (closingSoon ? '#FB923C' : '#8B93A7') + '">' + closingSoon + ' closing within 7 days</span>';

  renderBanner(dueToday);
  renderChips();
  renderJobs(filtered, jobs.length);
}

function renderBanner(dueToday) {
  const slot = document.getElementById('banner-slot');
  if (!dueToday.length) { slot.innerHTML = ''; return; }
  const pulse = dueToday.some(j => j.days <= 1) ? ' urgent-pulse' : '';
  const items = dueToday.map(j =>
    '<span style="color:#E8EAED">' + escapeHtml(j.name) + '</span> <span class="mono" style="color:' + TONE_HEX[j.priority.tone].text + '">(' + j.countdown + ')</span>'
  ).join(', ');
  slot.innerHTML =
    '<div class="banner"><svg class="' + pulse + '" style="vertical-align:-3px;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> ' +
    '<strong>Reminder' + (dueToday.length > 1 ? 's' : '') + ' due today: </strong>' + items + '</div>';
}

function renderChips() {
  const el = document.getElementById('chips');
  el.innerHTML = FILTERS.map(f =>
    '<button class="chip' + (state.filter === f ? ' active' : '') + '" data-filter="' + f + '">' + f + '</button>'
  ).join('');
  el.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => { state.filter = btn.dataset.filter; render(); });
  });
}

function renderJobs(filtered, totalCount) {
  const el = document.getElementById('job-list');
  if (!filtered.length) {
    el.innerHTML = '<div class="empty">' +
      (totalCount === 0
        ? 'No jobs tracked yet. Share a notification from your browser, or tap Add.'
        : 'No jobs match this filter.') +
      '</div>';
    return;
  }
  el.innerHTML = filtered.map(job => {
    const tone = TONE_HEX[job.priority.tone];
    const nameCls = job.applied ? 'job-name applied' : 'job-name';
    const linkHtml = job.link
      ? '<a href="' + escapeAttr(job.link) + '" target="_blank" rel="noopener noreferrer"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg> Notification</a>'
      : '';
    const deleteHtml = state.confirmDeleteId === job.id
      ? '<button class="icon-btn" style="color:#F87171;border-color:#F87171" data-confirm-del="' + job.id + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg></button>' +
        '<button class="icon-btn" data-cancel-del="1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>'
      : '<button class="icon-btn" data-del="' + job.id + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg></button>';

    return '<div class="job-card">' +
      '<div class="job-bar" style="background:' + tone.bar + '"></div>' +
      '<div class="job-body">' +
        '<div style="flex:1 1 200px; min-width:0;">' +
          '<span class="' + nameCls + '">' + escapeHtml(job.name) + '</span><span class="job-cat">' + job.category + '</span>' +
          '<div class="job-meta"><span class="mono">Last date: ' + formatDisplayDate(job.lastDate) + '</span>' + linkHtml + '</div>' +
        '</div>' +
        '<div class="job-actions">' +
          '<div class="countdown-chip" style="background:' + tone.chip + '">' +
            '<div class="cd mono" style="color:' + tone.text + '">' + job.countdown + '</div>' +
            '<div class="pr" style="color:' + tone.text + '">' + job.priority.dot + ' ' + job.priority.label.toUpperCase() + '</div>' +
          '</div>' +
          '<button class="pill-toggle' + (job.applied ? ' applied' : '') + '" data-toggle="' + job.id + '">' + (job.applied ? 'Applied' : 'Not Applied') + '</button>' +
          '<button class="icon-btn" data-ics="' + job.id + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></button>' +
          deleteHtml +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  el.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const jobs = getJobs();
    const j = jobs.find(x => x.id === btn.dataset.toggle);
    if (j) { j.applied = !j.applied; saveJobs(jobs); render(); }
  }));
  el.querySelectorAll('[data-ics]').forEach(btn => btn.addEventListener('click', () => {
    const j = getJobs().find(x => x.id === btn.dataset.ics);
    if (j) downloadICS(j);
  }));
  el.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
    state.confirmDeleteId = btn.dataset.del; render();
  }));
  el.querySelectorAll('[data-cancel-del]').forEach(btn => btn.addEventListener('click', () => {
    state.confirmDeleteId = null; render();
  }));
  el.querySelectorAll('[data-confirm-del]').forEach(btn => btn.addEventListener('click', () => {
    const jobs = getJobs().filter(x => x.id !== btn.dataset.confirmDel);
    saveJobs(jobs); state.confirmDeleteId = null; render();
  }));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

/* ---------------- search ---------------- */
document.getElementById('search-input').addEventListener('input', e => { state.query = e.target.value; render(); });

/* ---------------- add modal ---------------- */
const addOverlay = document.getElementById('add-overlay');
document.getElementById('add-btn').addEventListener('click', () => { openAddModal(); });
document.getElementById('close-add').addEventListener('click', () => { addOverlay.style.display = 'none'; });
addOverlay.addEventListener('click', e => { if (e.target === addOverlay) addOverlay.style.display = 'none'; });

function openAddModal() {
  document.getElementById('paste-box').value = '';
  document.getElementById('m-name').value = '';
  document.getElementById('m-date').value = '';
  document.getElementById('m-link').value = '';
  addOverlay.style.display = 'flex';
}

document.getElementById('paste-box').addEventListener('paste', e => {
  const text = e.clipboardData.getData('text');
  setTimeout(() => {
    const nameEl = document.getElementById('m-name');
    const dateEl = document.getElementById('m-date');
    const linkEl = document.getElementById('m-link');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (!nameEl.value && lines.length) nameEl.value = lines[0].slice(0, 140);
    const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
    if (urlMatch && !linkEl.value) linkEl.value = urlMatch[0];
    const d = parseDateFromText(text);
    if (d && !dateEl.value) dateEl.value = toInputDate(d);
  }, 0);
});

document.getElementById('save-add').addEventListener('click', () => {
  const name = document.getElementById('m-name').value.trim();
  const lastDate = document.getElementById('m-date').value;
  const link = document.getElementById('m-link').value.trim();
  if (!name || !lastDate) { alert('Please fill in the job name and last date.'); return; }
  addJob({ id: makeId(), name, lastDate, link, category: detectCategory(name), applied: false, createdAt: new Date().toISOString() });
  addOverlay.style.display = 'none';
  render();
});

/* ---------------- notification permission (best-effort, only fires while app is open) ---------------- */
function maybeAskNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    // Ask quietly after first meaningful interaction, not on cold load.
  }
}

/* ---------------- service worker ---------------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}

render();
