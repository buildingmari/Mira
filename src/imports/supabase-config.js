/* ================================
SUPABASE CONFIG
================================ */
const SUPA_URL = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';

let SESSION_PHONE = sessionStorage.getItem('mira_phone') || null;

/* ================================
VERIFY OTP
================================ */
async function verifyOTP() {
const code = [0,1,2,3].map(i => document.getElementById('o'+i).value).join('');
if (code.length < 4) return;

try {
const res = await fetch('/webhook/verify-otp', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ phone_number: '62' + loginPh, otp: code })
});

```
const data = await res.json();

if (data.status !== 'success') return;

const user = data.user;

SESSION_PHONE = user.primary_phone;
sessionStorage.setItem('mira_phone', SESSION_PHONE);

// populate USER object
USER.name = user.name || 'User';
USER.phone = user.primary_phone;

await loadDashboardData();
```

} catch (e) {
return;
}
}

/* ================================
LOAD DASHBOARD DATA
================================ */
async function loadDashboardData() {
const phone = SESSION_PHONE;
if (!phone) return;

const from90 = new Date();
from90.setDate(from90.getDate() - 90);
const fromStr = from90.toISOString().split('T')[0];

const res = await fetch(
`${SUPA_URL}/rest/v1/expenses?phone_number=eq.${phone}&date=gte.${fromStr}&order=date.desc&limit=500`,
{
headers: {
'apikey': SUPA_ANON,
'Authorization': 'Bearer ' + SUPA_ANON
}
}
);

const expenses = await res.json();

allTxns = Array.isArray(expenses) ? expenses.map(e => ({
date: new Date(e.date),
item: e.item || '',
sub: e.merchant || '',
merchant: e.merchant || '',
cat: e.category || 'Others',
amount: Number(e.amount || 0),
method: e.wallet || '',
isIn: false
})) : [];

filtTxns = [...allTxns];

initApp();
}

/* ================================
REALTIME (POLLING VERSION)
================================ */
function subscribeRealtime() {
setInterval(async () => {
await loadDashboardData();
renderDashboard();
renderTxns();
}, 30000);
}

/* ================================
INIT APP
================================ */
function initApp() {
renderDashboard();
renderTxns();

subscribeRealtime();
}
