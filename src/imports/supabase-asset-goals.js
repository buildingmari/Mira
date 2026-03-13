Di dashboard ini ada 2 halaman baru: "Aset & Net Worth" dan "Goals".
Keduanya sudah punya UI lengkap tapi masih pakai data dummy (ASET_DATA dan GOALS hardcoded).
Tugas: hubungkan keduanya ke Supabase dengan CRUD lengkap.

Supabase URL: https://vhwissutkmxyzlyzkhyt.supabase.co
Gunakan SB (Supabase client) yang sudah ada di dashboard.

═══════════════════════════════════════
BAGIAN 1 — ASET & NET WORTH
═══════════════════════════════════════

--- LOAD DATA ---

Ganti variabel dummy ASET_DATA dengan fetch dari tabel `user_assets`:

async function loadAsetData() {
  const { data, error } = await SB
    .from('user_assets')
    .select('*')
    .eq('phone_number', currentUser.primary_phone)
    .order('created_at', { ascending: false });

  if (error || !data) return;

  Object.keys(ASET_DATA).forEach(k => ASET_DATA[k] = []);

  data.forEach(row => {
    const cat = row.category;
    if (ASET_DATA[cat]) {
      ASET_DATA[cat].push({
        id: row.id,
        name: row.name,
        subtype: row.subtype,
        value: Number(row.value),
        date: row.updated_date || new Date().toISOString().split('T')[0]
      });
    }
  });

  const { data: liab } = await SB
    .from('user_liabilities')
    .select('amount')
    .eq('phone_number', currentUser.primary_phone);

  TOTAL_UTANG = (liab || []).reduce((s, l) => s + Number(l.amount || 0), 0);
}

Ubah TOTAL_UTANG dari const menjadi let:
let TOTAL_UTANG = 0;

Ubah NW_HISTORY dari const menjadi let:
let NW_HISTORY = [];

Panggil loadAsetData() di initAsetPage() sebelum render:
async function initAsetPage() {
  await loadAsetData();
  await loadNWHistory();
  updateNWHero();
  renderAsetCats();
  renderAsetSummary();
  renderNWTrend();
  if (!asetInited) { renderAsetDonut(); asetInited = true; }
}

--- NW HISTORY ---

async function loadNWHistory() {
  const { data } = await SB
    .from('user_nw_history')
    .select('month_label, net_worth')
    .eq('phone_number', currentUser.primary_phone)
    .order('snapshot_date', { ascending: true })
    .limit(6);
  if (data && data.length) {
    NW_HISTORY = data.map(r => ({ m: r.month_label, nw: Number(r.net_worth) }));
  }
}

--- SAVE ASET BARU ---

async function saveAset() {
  const cat = document.getElementById('ma-cat').value;
  const sub = document.getElementById('ma-sub').value;
  const name = document.getElementById('ma-name').value || sub;
  const value = parseFloat(document.getElementById('ma-val').value) || 0;
  const date = document.getElementById('ma-date').value;

  const { data, error } = await SB.from('user_assets').insert({
    phone_number: currentUser.primary_phone,
    category: cat, subtype: sub, name, value, updated_date: date
  }).select().single();

  if (error) { toast('Gagal menyimpan: ' + error.message, 'red'); return; }

  ASET_DATA[cat].push({ id: data.id, name, subtype: sub, value, date });
  renderAsetCats(); renderAsetSummary(); updateNWHero();
  if (asetChartInst) { asetInited = false; renderAsetDonut(); asetInited = true; }
  closeModal('modal-aset');
  toast('Aset berhasil ditambahkan ✓', 'green');
}

--- EDIT ASET ---

async function saveAsetEdit(key, idx) {
  const name = document.getElementById('aif-name-' + key + '-' + idx).value.trim();
  const value = parseFloat(document.getElementById('aif-val-' + key + '-' + idx).value) || 0;
  const subtype = document.getElementById('aif-sub-' + key + '-' + idx).value.trim();
  const date = document.getElementById('aif-date-' + key + '-' + idx).value;
  if (!name) { toast('Nama tidak boleh kosong', 'red'); return; }

  const item = ASET_DATA[key][idx];
  if (item.id) {
    const { error } = await SB.from('user_assets')
      .update({ name, value, subtype, updated_date: date })
      .eq('id', item.id);
    if (error) { toast('Gagal update: ' + error.message, 'red'); return; }
  }

  ASET_DATA[key][idx] = { ...item, name, value, subtype, date };
  renderAsetCats(); renderAsetSummary(); updateNWHero();
  if (asetChartInst) { asetInited = false; renderAsetDonut(); asetInited = true; }
  const el = document.getElementById('citems-' + key);
  const ch = document.getElementById('chev-' + key);
  if (el) { el.style.display = 'block'; ch.classList.add('open'); }
  toast('Aset berhasil diperbarui ✓', 'green');
}

--- DELETE ASET ---

async function deleteAset(key, idx) {
  const it = ASET_DATA[key][idx];
  if (!confirm('Hapus "' + it.name + '" (' + fmtRp(it.value) + ')?')) return;

  if (it.id) {
    const { error } = await SB.from('user_assets').delete().eq('id', it.id);
    if (error) { toast('Gagal hapus: ' + error.message, 'red'); return; }
  }

  ASET_DATA[key].splice(idx, 1);
  renderAsetCats(); renderAsetSummary(); updateNWHero();
  if (asetChartInst) { asetInited = false; renderAsetDonut(); asetInited = true; }
  const el = document.getElementById('citems-' + key);
  const ch = document.getElementById('chev-' + key);
  if (el && ASET_DATA[key].length) { el.style.display = 'block'; ch.classList.add('open'); }
  toast('Aset dihapus', '');
}

═══════════════════════════════════════
BAGIAN 2 — GOALS
═══════════════════════════════════════

Ubah let GOALS = [...dummy data...] menjadi:
let GOALS = [];

--- LOAD DATA ---

async function loadGoals() {
  const { data, error } = await SB
    .from('user_goals')
    .select('*')
    .eq('phone_number', currentUser.primary_phone)
    .order('created_at', { ascending: true });

  if (error || !data) return;

  GOALS = data.map(row => ({
    id: row.id,
    name: row.name,
    cat: row.category,
    icon: row.icon || '🎯',
    color: row.color || 'gc-blue',
    target: Number(row.target_amount),
    achieved: Number(row.achieved_amount),
    deadline: row.deadline,
    monthly: Number(row.monthly_target || 0),
    sources: row.sources ? (typeof row.sources === 'string' ? JSON.parse(row.sources) : row.sources) : []
  }));
}

async function initGoalsPage() {
  await loadGoals();
  updateGoalsHero();
  renderGoals();
}

--- SAVE GOAL BARU ---

async function saveGoal() {
  const name = document.getElementById('mg-name').value.trim();
  if (!name) { toast('Nama goal tidak boleh kosong', 'red'); return; }

  const target = parseFloat(document.getElementById('mg-target').value) || 0;
  const alloc = parseFloat(document.getElementById('mg-alloc').value) || 0;
  const deadline = document.getElementById('mg-deadline').value || '2027-12-31';
  const src = document.getElementById('mg-src').value;
  const color = GOAL_COLORS[GOALS.length % GOAL_COLORS.length];
  const sources = alloc > 0 ? [{ name: src, value: alloc, dot: '#2D4BFF' }] : [];

  const { data, error } = await SB.from('user_goals').insert({
    phone_number: currentUser.primary_phone,
    name,
    category: document.getElementById('mg-cat').value,
    icon: document.getElementById('mg-icon').value,
    color,
    target_amount: target,
    achieved_amount: alloc,
    deadline,
    monthly_target: Math.round(target / 12),
    sources: JSON.stringify(sources)
  }).select().single();

  if (error) { toast('Gagal simpan: ' + error.message, 'red'); return; }

  GOALS.push({ id: data.id, name, cat: data.category, icon: data.icon, color, target, achieved: alloc, deadline, monthly: data.monthly_target, sources });
  renderGoals(); updateGoalsHero();
  closeModal('modal-goals');
  toast('Goal berhasil dibuat 🎯', 'green');
  document.getElementById('mg-name').value = '';
  document.getElementById('mg-target').value = '';
  document.getElementById('mg-alloc').value = '';
}

--- DELETE GOAL ---

async function deleteGoal(id) {
  if (!confirm('Hapus goal ini?')) return;

  const { error } = await SB.from('user_goals').delete().eq('id', id);
  if (error) { toast('Gagal hapus: ' + error.message, 'red'); return; }

  GOALS = GOALS.filter(g => g.id !== id);
  renderGoals(); updateGoalsHero();
  toast('Goal dihapus', '');
}