/* ---------------- category detection ---------------- */
const CATEGORY_RULES = [
  { key: 'Banking', words: ['ibps', 'sbi', 'rbi', 'nabard', 'bank', 'sidbi', 'nabfins', 'pnb', 'canara', 'bank of baroda', 'regional rural bank', 'niacl', 'lic '] },
  { key: 'Assam Government', words: ['assam', 'apsc', 'slprb', 'dme assam', 'ahsec', 'sebae', 'guwahati', 'dhemaji', 'apdcl', 'ashigher', 'dhs assam'] },
  { key: 'Central Government', words: ['upsc', 'ssc', 'railway', 'rrb', 'csir', 'afcat', 'nda ', 'cds', 'staff selection', 'central government', 'cgl', 'chsl', 'mts', 'income tax', 'passport'] },
  { key: 'Technical / PSU', words: ['ongc', 'ntpc', 'isro', 'drdo', 'bhel', 'psu', 'nlc', 'coal india', 'gail', 'pgcil', 'sail', 'iocl', 'bpcl', 'hpcl', 'junior engineer', ' je ', 'engineer', 'technician', 'navratna', 'ordnance'] },
];
function detectCategory(name) {
  const n = ' ' + (name || '').toLowerCase() + ' ';
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some(w => n.includes(w))) return rule.key;
  }
  return 'Other';
}

/* ---------------- date parsing ---------------- */
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
function parseDateFromText(text) {
  if (!text) return null;
  const monthPat = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
  const re1 = new RegExp('(\\d{1,2})(?:st|nd|rd|th)?\\s+(' + monthPat + ')\\.?,?\\s+(\\d{4})', 'i');
  const m1 = text.match(re1);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const key3 = m1[2].toLowerCase().slice(0, 3) === 'sep' ? 'sep' : m1[2].toLowerCase().slice(0, 3);
    const mo = MONTHS[key3];
    const yr = parseInt(m1[3], 10);
    if (mo !== undefined) return new Date(yr, mo, day);
  }
  const re2 = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/;
  const m2 = text.match(re2);
  if (m2) {
    const day = parseInt(m2[1], 10), mo = parseInt(m2[2], 10) - 1, yr = parseInt(m2[3], 10);
    if (mo >= 0 && mo < 12) return new Date(yr, mo, day);
  }
  return null;
}
function toInputDate(d) {
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function fromInputDate(s) {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function formatDisplayDate(dateStr) {
  const d = fromInputDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---------------- countdown / priority ---------------- */
function daysRemaining(dateStr) {
  const d = fromInputDate(dateStr);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}
function countdownLabel(days) {
  if (days === null) return '—';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Deadline today';
  if (days === 1) return 'Deadline tomorrow';
  return days + ' days remaining';
}
function priorityOf(days) {
  if (days === null) return { label: 'Unknown', tone: 'expired', dot: '⚪' };
  if (days < 0) return { label: 'Expired', tone: 'expired', dot: '⚫' };
  if (days === 0) return { label: 'URGENT', tone: 'urgent', dot: '🔴' };
  if (days <= 3) return { label: 'Critical', tone: 'critical', dot: '🔴' };
  if (days <= 7) return { label: 'High', tone: 'high', dot: '🟠' };
  if (days <= 14) return { label: 'Medium', tone: 'medium', dot: '🟡' };
  return { label: 'Safe', tone: 'safe', dot: '🟢' };
}
const REMINDER_MILESTONES = [14, 7, 3, 1, 0];

/* ---------------- .ics reminder file ---------------- */
function buildICS(job) {
  const dt = fromInputDate(job.lastDate);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = dt.getFullYear() + pad(dt.getMonth() + 1) + pad(dt.getDate());
  const nextDay = new Date(dt); nextDay.setDate(nextDay.getDate() + 1);
  const endStr = nextDay.getFullYear() + pad(nextDay.getMonth() + 1) + pad(nextDay.getDate());
  const now = new Date();
  const stamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + 'T' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()) + 'Z';
  const triggers = ['-P14D', '-P7D', '-P3D', '-P1D', 'PT9H'];
  const valarms = triggers.map(t =>
    'BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:' + job.name + ' - application deadline reminder\r\nTRIGGER:' + t + '\r\nEND:VALARM'
  ).join('\r\n');
  const desc = (job.link ? ('Notification link: ' + job.link) : 'Job application deadline').replace(/\n/g, ' ');
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Deadline Tracker//EN\r\nBEGIN:VEVENT\r\nUID:' + job.id + '@deadline-tracker\r\nDTSTAMP:' + stamp + '\r\nDTSTART;VALUE=DATE:' + dateStr + '\r\nDTEND;VALUE=DATE:' + endStr + '\r\nSUMMARY:' + job.name + ' - Application Deadline\r\nDESCRIPTION:' + desc + '\r\n' + valarms + '\r\nEND:VEVENT\r\nEND:VCALENDAR';
}
function downloadICS(job) {
  const ics = buildICS(job);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = job.name.replace(/[^a-z0-9]/gi, '_').slice(0, 60) + '.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------- storage (localStorage, on-device only) ---------------- */
const STORAGE_KEY = 'deadlineTrackerJobs';
function getJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function saveJobs(jobs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs)); } catch (e) { console.error('save failed', e); }
}
function addJob(job) {
  const jobs = getJobs();
  jobs.push(job);
  saveJobs(jobs);
  return jobs;
}
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
