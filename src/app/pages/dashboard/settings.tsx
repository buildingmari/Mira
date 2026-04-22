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
const WALLETS  = ['BCA','BRI','Mandiri','BNI','CIMB','Jenius','GoPay','OVO','DANA','ShopeePay','LinkAja','Cash'];

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
  .set-select     { height: 44px; width: 100%; border: 1px solid rgba(0,0,0,0.10);
                    border-radius: 10px; padding: 0 14px; font-size: 14px;
                    font-family: 'DM Sans', sans-serif; background: #F8F9FB;
                    outline: none; cursor: pointer; box-sizing: border-box; }
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
  .set-ratio-bar  { height: 10px; border-radius: 99px; background: #F1F4F8; overflow: hidden; margin: 10px 0 4px; }
  @media (max-width: 900px) {
    .set-wrap { padding: 16px 16px 100px; }
  }
`;

export function DashboardSettings() {
  const navigate = useNavigate();
  const [phone,         setPhone]         = useState('');
  const [name,          setName]          = useState('');
  const [primaryWallet, setPrimaryWallet] = useState('GoPay');
  const [monthlyLimit,  setMonthlyLimit]  = useState('5000000');
  const [savingsRatio,  setSavingsRatio]  = useState('20');
  const [activeBanks,   setActiveBanks]   = useState<string[]>([]);
  const [activeEwallets,setActiveEwallets]= useState<string[]>([]);
  const [activePaylater,setActivePaylater]= useState<string[]>([]);
  const [reminder,      setReminder]      = useState(true);
  const [weeklyReport,  setWeeklyReport]  = useState(true);
  const [budgetAlert,   setBudgetAlert]   = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [err,           setErr]           = useState<string | null>(null);

  useEffect(() => {
    const id = 'mira-set-css';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = SET_CSS;
      document.head.appendChild(s);
    }
    return () => { document.getElementById('mira-set-css')?.remove(); };
  }, []);

  useEffect(() => {
    const ph = localStorage.getItem('mira_phone');
    if (!ph) { navigate('/', { replace: true }); return; }
    setPhone(ph);

    try {
      const raw = localStorage.getItem('mira_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.name)            setName(u.name);
        if (u.primary_wallet)  setPrimaryWallet(u.primary_wallet);
        if (u.monthly_limit)   setMonthlyLimit(String(u.monthly_limit));
        if (u.savings_ratio)   setSavingsRatio(String(u.savings_ratio));
        if (Array.isArray(u.active_banks))    setActiveBanks(u.active_banks);
        if (Array.isArray(u.active_ewallets)) setActiveEwallets(u.active_ewallets);
        if (Array.isArray(u.active_paylater)) setActivePaylater(u.active_paylater);
      }
    } catch {}

    (async () => {
      try {
        const r = await fetch(
          `${SUPA_URL}/rest/v1/users?primary_phone=eq.${ph}&select=*`,
          { headers: HR }
        );
        if (r.ok) {
          const a = await r.json();
          if (Array.isArray(a) && a.length > 0) {
            const u = a[0];
            setName(u.name || '');
            setPrimaryWallet(u.primary_wallet || 'GoPay');
            setMonthlyLimit(String(u.monthly_limit || 5000000));
            setSavingsRatio(String(u.savings_ratio || 20));
            if (Array.isArray(u.active_banks))    setActiveBanks(u.active_banks);
            if (Array.isArray(u.active_ewallets)) setActiveEwallets(u.active_ewallets);
            if (Array.isArray(u.active_paylater)) setActivePaylater(u.active_paylater);
            localStorage.setItem('mira_user', JSON.stringify(u));
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
      const payload = {
        name:            name.trim() || null,
        primary_wallet:  primaryWallet,
        monthly_limit:   Number(monthlyLimit) || 5000000,
        savings_ratio:   Number(savingsRatio) || 20,
        active_banks:    activeBanks,
        active_ewallets: activeEwallets,
        active_paylater: activePaylater,
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
        const raw = localStorage.getItem('mira_user');
        if (raw) {
          localStorage.setItem('mira_user', JSON.stringify({ ...JSON.parse(raw), ...payload }));
        }
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
        fetch(`${SUPA_URL}/rest/v1/users?primary_phone=eq.${phone}`,    { method: 'DELETE', headers: HW }),
        fetch(`${SUPA_URL}/rest/v1/expenses?phone_number=eq.${phone}`, { method: 'DELETE', headers: HW }),
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

  const ratioNum = Math.min(Math.max(Number(savingsRatio) || 0, 0), 100);
  const spendRatio = 100 - ratioNum;

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

      {/* Ratio Tabungan */}
      <div className="set-card">
        <div className="set-card-hdr">
          <PiggyBank style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Ratio Tabungan vs Pengeluaran</h3>
        </div>
        <div className="set-card-body">
          <div className="set-field">
            <label className="set-label">Target Tabungan (%)</label>
            <input
              className="set-input"
              type="number" min="0" max="100"
              placeholder="20"
              value={savingsRatio}
              onChange={e => setSavingsRatio(e.target.value)}
            />
            <div className="set-ratio-bar">
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #2563EB 0%, #10B981 100%)',
                width: `${ratioNum}%`, transition: 'width .4s',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280' }}>
              <span style={{ color: '#2563EB', fontWeight: 500 }}>Tabungan {ratioNum}%</span>
              <span>Pengeluaran {spendRatio}%</span>
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
                className={`set-chip${activeBanks.includes(b) ? ' active' : ''}`}
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
                className={`set-chip${activeEwallets.includes(w) ? ' active' : ''}`}
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
                className={`set-chip${activePaylater.includes(p) ? ' active' : ''}`}
                onClick={() => toggleChip(activePaylater, setActivePaylater, p)}
              >{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Wallet Utama */}
      <div className="set-card">
        <div className="set-card-hdr">
          <Wallet style={{ width: 15, height: 15, color: '#6B7280', flexShrink: 0 }} />
          <h3>Wallet Utama</h3>
        </div>
        <div className="set-card-body">
          <div className="set-field" style={{ marginBottom: 0 }}>
            <label className="set-label">Default wallet untuk transaksi baru</label>
            <select
              className="set-select"
              value={primaryWallet}
              onChange={e => setPrimaryWallet(e.target.value)}
            >
              {WALLETS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
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
          <a
            href="/privacy-policy"
            style={{ fontSize: 13, color: '#2563EB', fontWeight: 500, textDecoration: 'none' }}
          >
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
