import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, Wallet, Bell, Shield, Save, AlertTriangle, Check, PiggyBank, CreditCard } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HR = { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, Accept: 'application/json' };
const HW = { ...HR, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

const BANKS    = ['BCA','BRI','Mandiri','BNI','CIMB','Jenius','BSI','Permata'];
const EWALLETS = ['GoPay','OVO','DANA','ShopeePay','LinkAja'];
const PAYLATER = ['GoPay Later','OVO Later','Akulaku','Kredivo','Shopee PayLater','Indodana'];

function decodeUnicode(str: string): string {
  if (!str) return str;
  try { return str.replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16))); } catch {}
  return str;
}

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function encodeList(arr: string[]): string | null {
  return arr.length > 0 ? arr.join(', ') : null;
}

const SET_CSS = `
  .set-wrap       { padding: 28px 32px 80px; max-width: 680px; margin: 0 auto;
                    font-family: 'DM Sans', sans-serif; }
  .set-card       { background: #fff; border: 1px solid rgba(0,0,0,0.07);
                    border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
  .set-card-hdr   { padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.07);
                    display: flex; align-items: center; gap: 8px; }
  .set-card-hdr h3 { margin: 0; font-family: 'Sora', sans-serif; font-size: 14px;
                     font-weight: 600; color: #111827; }
  .set-card-body  { padding: 18px 20px; }
  .set-field      { margin-bottom: 16px; }
  .set-field:last-child { margin-bottom: 0; }
  .set-label      { display: block; font-size: 13px; font-weight: 500;
                    color: #374151; margin-bottom: 6px; }
  .set-input      { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10);
                    border-radius: 10px; padding: 0 14px; font-size: 14px;
                    font-family: 'DM Sans', sans-serif; background: #F8F9FB;
                    outline: none; box-sizing: border-box; }
  .set-input:focus  { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .set-input:disabled { opacity: 0.55; cursor: not-allowed; background: #F1F4F8; }
  .set-hint       { font-size: 12px; color: #9CA3AF; margin: 5px 0 0; }
  .set-trow       { display: flex; align-items: center; justify-content: space-between;
                    padding: 13px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .set-trow:last-child { border-bottom: none; padding-bottom: 0; }
  .set-save-btn   { width: 100%; height: 48px; background: #2563EB; color: #fff;
                    border: none; border-radius: 12px; font-size: 15px; font-weight: 600;
                    font-family: 'DM Sans', sans-serif; cursor: pointer; margin-bottom: 12px;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: background .15s, transform .1s; }
  .set-save-btn:hover:not(:disabled) { background: #1D4ED8; }
  .set-save-btn:active:not(:disabled) { transform: scale(0.98); }
  .set-save-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  .set-save-btn.ok { background: #16A34A; }
  .set-del-btn    { height: 44px; padding: 0 20px; background: transparent;
                    color: #EF4444; border: 1px solid #EF4444; border-radius: 10px;
                    font-size: 14px; font-family: 'DM Sans', sans-serif; cursor: pointer;
                    display: flex; align-items: center; gap: 6px; transition: background .15s; }
  .set-del-btn:hover { background: #FEF2F2; }
  .set-err        { font-size: 13px; color: #EF4444; padding: 10px 14px;
                    background: #FEF2F2; border-radius: 8px; margin-bottom: 12px; }
  .set-chips      { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .set-chip       { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
                    cursor: pointer; border: 1.5px solid rgba(0,0,0,0.10);
                    font-family: 'DM Sans', sans-serif; transition: all .15s; background: #F8F9FB; color: #374151; }
  .set-chip.active { background: #EFF6FF; border-color: #2563EB; color: #1D4ED8; }

  /* ─── Savings Slider ───────────────────────────────────────────── */
  .savings-slider-wrap { margin: 12px 0 6px; }
  .savings-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 6px; border-radius: 99px; outline: none; cursor: pointer;
    background: linear-gradient(to right, #2563EB 0%, #2563EB var(--thumb-pct, 20%), #E5E7EB var(--thumb-pct, 20%), #E5E7EB 100%);
    transition: background .05s;
  }
  .savings-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 22px; height: 22px; border-radius: 50%; background: #fff;
    border: 2.5px solid #2563EB; box-shadow: 0 2px 8px rgba(37,99,235,0.3);
    cursor: grab; transition: transform .1s;
  }
  .savings-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); }
  .savings-slider::-moz-range-thumb {
    width: 22px; height: 22px; border-radius: 50%; background: #fff;
    border: 2.5px solid #2563EB; box-shadow: 0 2px 8px rgba(37,99,235,0.3); cursor: grab;
  }
  .savings-ratio-labels { display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; }
  .dark .set-card  { background: #1E293B; border-color: rgba(255,255,255,0.08); }
  .dark .set-card-hdr { border-color: rgba(255,255,255,0.08); }
  .dark .set-card-hdr h3 { color: #F1F5F9; }
  .dark .set-label { color: #CBD5E1; }
  .dark .set-input { background: #0F172A; border-color: rgba(255,255,255,0.12); color: #F1F5F9; }
  .dark .set-chip  { background: #0F172A; border-color: rgba(255,255,255,0.12); color: #CBD5E1; }
  .dark .set-chip.active { background: #1E3A5F; border-color: #3B82F6; color: #93C5FD; }
  .dark .set-trow  { border-color: rgba(255,255,255,0.05); }
  .dark .savings-slider {
    background: linear-gradient(to right, #3B82F6 0%, #3B82F6 var(--thumb-pct, 20%), #334155 var(--thumb-pct, 20%), #334155 100%);
  }
  @media (max-width: 900px) { .set-wrap { padding: 16px 16px 100px; } }
`;

export function DashboardSettings() {
  const navigate = useNavigate();
  const [phone,          setPhone]          = useState('');
  const [name,           setName]           = useState('');
  const [monthlyLimit,   setMonthlyLimit]   = useState('0');
  const [savingsRatio,   setSavingsRatio]   = useState(20);
  const [activeBanks,    setActiveBanks]    = useState<string[]>([]);
  const [activeEwallets, setActiveEwallets] = useState<string[]>([]);
  const [activePaylater, setActivePaylater] = useState<string[]>([]);
  const [reminder,       setReminder]       = useState(true);
  const [weeklyReport,   setWeeklyReport]   = useState(true);
  const [budgetAlert,    setBudgetAlert]    = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [err,            setErr]            = useState<string | null>(null);

  useEffect(() => {
    const id = 'mira-set-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = SET_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-set-css')?.remove(); };
  }, []);

  const hydrateUser = (u: Record<string, any>) => {
    if (u.name)                          setName(decodeUnicode(u.name));
    if (u.limit_nominal != null)         setMonthlyLimit(String(u.limit_nominal));
    if (u.saving_allocation_pct != null) setSavingsRatio(Number(u.saving_allocation_pct));
    setActiveBanks(parseList(u.banks_used));
    setActiveEwallets(parseList(u.ewallets_used));
    setActivePaylater(parseList(u.paylater_active));
  };

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);

    try {
      const raw = localStorage.getItem('mira_user');
      if (raw) hydrateUser(JSON.parse(raw));
    } catch {}

    (async () => {
      try {
        const r = await fetch(
          `${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=name,limit_nominal,saving_allocation_pct,expense_allocation_pct,banks_used,ewallets_used,paylater_active`,
          { headers: HR }
        );
        if (r.ok) {
          const a = await r.json();
          if (Array.isArray(a) && a.length > 0) {
            hydrateUser(a[0]);
            try {
              const existing = JSON.parse(localStorage.getItem('mira_user') || '{}');
              localStorage.setItem('mira_user', JSON.stringify({ ...existing, ...a[0] }));
            } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  const toggleChip = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  const handleSave = async () => {
    setSaving(true); setErr(null);
    try {
      const ratioNum = Math.min(Math.max(savingsRatio, 0), 100);
      const payload: Record<string, any> = {
        name:                   name.trim() || null,
        limit_nominal:          Number(monthlyLimit) || 0,
        saving_allocation_pct:  ratioNum,
        expense_allocation_pct: 100 - ratioNum,
        banks_used:             encodeList(activeBanks),
        ewallets_used:          encodeList(activeEwallets),
        paylater_active:        encodeList(activePaylater),
        updated_at:             new Date().toISOString(),
      };
      const r = await fetch(
        `${SUPA_URL}/rest/v1/users?primary_phone=eq.${phone}`,
        { method: 'PATCH', headers: HW, body: JSON.stringify(payload) }
      );
      if (!r.ok) {
        const text = await r.text().catch(() => 'Gagal menyimpan');
        throw new Error(text || 'Gagal menyimpan');
      }
      try {
        const existing = JSON.parse(localStorage.getItem('mira_user') || '{}');
        localStorage.setItem('mira_user', JSON.stringify({ ...existing, ...payload }));
      } catch {}
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e.message || 'Terjadi kesalahan. Coba lagi.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      'Apakah kamu yakin ingin menghapus akun?\n\nSemua data transaksi akan dihapus permanen dan tidak bisa dikembalikan.'
    );
    if (!confirmed) return;
    try {
      await Promise.allSettled([
        fetch(`${SUPA_URL}/rest/v1/users?primary_phone=eq.${phone}`,     { method: 'DELETE', headers: HW }),
        fetch(`${SUPA_URL}/rest/v1/expenses?phone_number=eq.${phone}`,   { method: 'DELETE', headers: HW }),
        fetch(`${SUPA_URL}/rest/v1/user_goals?phone_number=eq.${phone}`, { method: 'DELETE', headers: HW }),
        fetch(`${SUPA_URL}/rest/v1/user_assets?phone_number=eq.${phone}`,{ method: 'DELETE', headers: HW }),
      ]);
    } catch {}
    localStorage.removeItem('mira_phone');
    localStorage.removeItem('mira_user');
    navigate('/');
  };

  function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <button
        onClick={onChange}
        style={{
          width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
          background: value ? '#2563EB' : '#D1D5DB', transition: 'background .2s',
          position: 'relative', flexShrink: 0, padding: 0,
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: value ? 23 : 3,
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    );
  }

  const spendRatio = 100 - savingsRatio;

  return (
    <div className="set-wrap">

      {/* Profile */}
      <div className="set-card">
        <div className="set-card-hdr">
          <User style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Informasi Profil</h3>
        </div>
        <div className="set-card-body">
          <div className="set-field">
            <label className="set-label">Nomor WhatsApp</label>
            <input className="set-input" value={phone || '—'} disabled />
            <p className="set-hint">Nomor WhatsApp tidak bisa diubah</p>
          </div>
          <div className="set-field">
            <label className="set-label">Nama (Opsional)</label>
            <input
              className="set-input"
              placeholder="Masukkan nama kamu"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Ratio Tabungan — SLIDER */}
      <div className="set-card">
        <div className="set-card-hdr">
          <PiggyBank style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Ratio Tabungan vs Pengeluaran</h3>
        </div>
        <div className="set-card-body">
          <div className="set-field">
            <label className="set-label">
              Target Tabungan —&nbsp;
              <span style={{ fontFamily: "'Sora',sans-serif", color: '#2563EB', fontWeight: 700 }}>
                {savingsRatio}%
              </span>
            </label>

            {/* Slider */}
            <div className="savings-slider-wrap">
              <input
                type="range"
                className="savings-slider"
                min={0} max={100} step={1}
                value={savingsRatio}
                style={{ '--thumb-pct': `${savingsRatio}%` } as React.CSSProperties}
                onChange={e => setSavingsRatio(Number(e.target.value))}
              />
            </div>

            {/* Dual label */}
            <div className="savings-ratio-labels">
              <span style={{ color: '#2563EB', fontWeight: 600 }}>💰 Tabungan {savingsRatio}%</span>
              <span style={{ color: '#6B7280' }}>💸 Pengeluaran {spendRatio}%</span>
            </div>

            {/* Visual split bar */}
            <div style={{
              display: 'flex', borderRadius: 99, overflow: 'hidden', height: 10, marginTop: 10,
              transition: 'all .3s',
            }}>
              <div style={{
                flex: savingsRatio, background: 'linear-gradient(90deg,#2563EB,#10B981)',
                transition: 'flex .3s',
              }} />
              <div style={{
                flex: spendRatio, background: '#F1F4F8',
                transition: 'flex .3s',
              }} />
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {[0, 10, 20, 30, 40, 50].map(v => (
                <button key={v} onClick={() => setSavingsRatio(v)} style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  border: `1.5px solid ${savingsRatio === v ? '#2563EB' : 'rgba(0,0,0,0.1)'}`,
                  background: savingsRatio === v ? '#EFF6FF' : '#F8F9FB',
                  color: savingsRatio === v ? '#1D4ED8' : '#374151',
                  cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                }}>
                  {v}%
                </button>
              ))}
            </div>
          </div>

          <div className="set-field">
            <label className="set-label">Limit Pengeluaran Bulanan (Rp)</label>
            <input
              className="set-input"
              type="number"
              placeholder="5000000"
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(e.target.value)}
            />
            <p className="set-hint">
              Saat ini: Rp {(Number(monthlyLimit) || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Bank Aktif */}
      <div className="set-card">
        <div className="set-card-hdr">
          <Wallet style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Bank Aktif</h3>
        </div>
        <div className="set-card-body">
          <p className="set-hint" style={{ marginBottom: 0 }}>Pilih bank yang kamu gunakan untuk transaksi</p>
          <div className="set-chips">
            {BANKS.map(b => (
              <button
                key={b}
                className={`set-chip${activeBanks.some(x => x.toLowerCase().includes(b.toLowerCase())) ? ' active' : ''}`}
                onClick={() => toggleChip(activeBanks, setActiveBanks, b)}
              >{b}</button>
            ))}
          </div>
        </div>
      </div>

      {/* E-Wallet */}
      <div className="set-card">
        <div className="set-card-hdr">
          <Wallet style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>E-Wallet Aktif</h3>
        </div>
        <div className="set-card-body">
          <p className="set-hint" style={{ marginBottom: 0 }}>Pilih e-wallet yang kamu gunakan</p>
          <div className="set-chips">
            {EWALLETS.map(w => (
              <button
                key={w}
                className={`set-chip${activeEwallets.some(x => x.toLowerCase().includes(w.toLowerCase())) ? ' active' : ''}`}
                onClick={() => toggleChip(activeEwallets, setActiveEwallets, w)}
              >{w}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Paylater / Kartu Kredit */}
      <div className="set-card">
        <div className="set-card-hdr">
          <CreditCard style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Paylater & Kartu Kredit</h3>
        </div>
        <div className="set-card-body">
          <p className="set-hint" style={{ marginBottom: 0 }}>Pilih paylater atau kartu kredit yang aktif</p>
          <div className="set-chips">
            {PAYLATER.map(p => (
              <button
                key={p}
                className={`set-chip${activePaylater.some(x => x.toLowerCase().includes(p.toLowerCase())) ? ' active' : ''}`}
                onClick={() => toggleChip(activePaylater, setActivePaylater, p)}
              >{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifikasi */}
      <div className="set-card">
        <div className="set-card-hdr">
          <Bell style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Notifikasi</h3>
        </div>
        <div className="set-card-body">
          {([
            { label: 'Spending Reminder', desc: 'Notifikasi ketika mendekati limit',  val: reminder,     set: () => setReminder(!reminder) },
            { label: 'Weekly Report',     desc: 'Laporan mingguan via WhatsApp',       val: weeklyReport, set: () => setWeeklyReport(!weeklyReport) },
            { label: 'Budget Alert',      desc: 'Alert ketika over budget',            val: budgetAlert,  set: () => setBudgetAlert(!budgetAlert) },
          ] as const).map(({ label, desc, val, set }) => (
            <div key={label} className="set-trow">
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#111827' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>{desc}</p>
              </div>
              <Toggle value={val} onChange={set} />
            </div>
          ))}
        </div>
      </div>

      {/* Privasi */}
      <div className="set-card">
        <div className="set-card-hdr">
          <Shield style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Keamanan & Privasi</h3>
        </div>
        <div className="set-card-body">
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
            Data kamu di-enkripsi dan aman. Kami tidak akan membagikan data ke pihak ketiga.
          </p>
          <a href="/privacy-policy" style={{ fontSize: 13, color: '#2563EB', fontWeight: 500, textDecoration: 'none' }}>
            Lihat Privacy Policy →
          </a>
        </div>
      </div>

      {err && <div className="set-err">{err}</div>}
      <button
        className={`set-save-btn${saved ? ' ok' : ''}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          'Menyimpan...'
        ) : saved ? (
          <><Check style={{ width: 16, height: 16 }} /> Tersimpan!</>
        ) : (
          <><Save style={{ width: 16, height: 16 }} /> Simpan Perubahan</>
        )}
      </button>

      <div className="set-card" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="set-card-hdr">
          <AlertTriangle style={{ width: 15, height: 15, color: '#EF4444', flexShrink: 0 }} />
          <h3 style={{ color: '#EF4444' }}>Danger Zone</h3>
        </div>
        <div className="set-card-body">
          <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#EF4444' }}>Hapus Akun</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
              Aksi ini tidak bisa dibatalkan. Semua data akan dihapus permanen.
            </p>
          </div>
          <button className="set-del-btn" onClick={handleDelete}>
            <AlertTriangle style={{ width: 14, height: 14 }} />
            Hapus Akun
          </button>
        </div>
      </div>
    </div>
  );
}
