import { useState } from 'react';
import { X, Check } from 'lucide-react';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';
const HW = {
  apikey: SUPA_ANON,
  Authorization: 'Bearer ' + SUPA_ANON,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const CATEGORIES = [
  'Makanan', 'Transport', 'Belanja', 'Tagihan',
  'Kesehatan', 'Hiburan', 'Pemasukan', 'Lainnya',
];
const WALLETS = [
  'BCA', 'BRI', 'Mandiri', 'BNI', 'CIMB', 'Jenius',
  'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Cash',
];

const CAT_TO_DB: Record<string, string> = {
  Makanan: 'food', Transport: 'transport', Belanja: 'shopping',
  Tagihan: 'bills', Kesehatan: 'health', Hiburan: 'entertainment',
  Pemasukan: 'income', Lainnya: 'others',
};

const MODAL_CSS = `
  .atm-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  @media (min-width: 600px) {
    .atm-overlay { align-items: center; }
  }
  .atm-sheet {
    background: #fff; width: 100%; max-width: 480px;
    border-radius: 24px 24px 0 0; padding: 0 0 32px;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
    font-family: 'DM Sans', sans-serif;
    max-height: 92vh; overflow-y: auto;
  }
  @media (min-width: 600px) {
    .atm-sheet { border-radius: 20px; max-height: 88vh; }
  }
  .atm-handle {
    width: 36px; height: 4px; background: #E5E7EB;
    border-radius: 99px; margin: 12px auto 0; display: block;
  }
  .atm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
  }
  .atm-title {
    font-family: 'Sora', sans-serif; font-size: 16px;
    font-weight: 600; color: #111827; margin: 0;
  }
  .atm-close {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(0,0,0,0.10); background: #F8F9FB;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .atm-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .atm-label {
    display: block; font-size: 12px; font-weight: 500;
    color: #6B7280; margin-bottom: 6px; letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .atm-input {
    height: 46px; width: 100%; border: 1px solid rgba(0,0,0,0.10);
    border-radius: 10px; padding: 0 14px; font-size: 15px;
    font-family: 'DM Sans', sans-serif; background: #F8F9FB;
    outline: none; box-sizing: border-box; color: #111827;
  }
  .atm-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); background: #fff; }
  .atm-select {
    height: 46px; width: 100%; border: 1px solid rgba(0,0,0,0.10);
    border-radius: 10px; padding: 0 14px; font-size: 15px;
    font-family: 'DM Sans', sans-serif; background: #F8F9FB;
    outline: none; cursor: pointer; box-sizing: border-box; color: #111827;
  }
  .atm-select:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  .atm-type-row { display: flex; gap: 8px; }
  .atm-type-btn {
    flex: 1; height: 42px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.10);
    font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif;
    cursor: pointer; background: #F8F9FB; color: #6B7280; transition: all .15s;
  }
  .atm-type-btn.active-expense {
    background: #FEF2F2; border-color: #EF4444; color: #DC2626; font-weight: 600;
  }
  .atm-type-btn.active-income {
    background: #F0FDF4; border-color: #16A34A; color: #15803D; font-weight: 600;
  }
  .atm-amount-wrap { position: relative; }
  .atm-amount-prefix {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    font-size: 15px; font-weight: 500; color: #6B7280; pointer-events: none;
  }
  .atm-amount-input {
    height: 54px; width: 100%; border: 1.5px solid rgba(0,0,0,0.10);
    border-radius: 12px; padding: 0 14px 0 42px; font-size: 20px;
    font-family: 'Sora', sans-serif; font-weight: 600; background: #F8F9FB;
    outline: none; box-sizing: border-box; color: #111827; letter-spacing: -0.5px;
  }
  .atm-amount-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); background: #fff; }
  .atm-submit {
    width: 100%; height: 50px; background: #2563EB; color: #fff;
    border: none; border-radius: 12px; font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .15s, transform .1s; margin-top: 4px;
  }
  .atm-submit:hover:not(:disabled) { background: #1D4ED8; }
  .atm-submit:active:not(:disabled) { transform: scale(0.98); }
  .atm-submit:disabled { opacity: 0.65; cursor: not-allowed; }
  .atm-submit.ok { background: #16A34A; }
  .atm-err {
    font-size: 13px; color: #EF4444; background: #FEF2F2;
    border-radius: 8px; padding: 10px 14px;
  }
`;

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddTransactionModal({ onClose, onSuccess }: Props) {
  const phone = localStorage.getItem('mira_phone') || '';

  const today = new Date().toISOString().split('T')[0];
  const [type,     setType]     = useState<'expense' | 'income'>('expense');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('Makanan');
  const [merchant, setMerchant] = useState('');
  const [wallet,   setWallet]   = useState(() => {
    try { const u = localStorage.getItem('mira_user'); if (u) return JSON.parse(u).primary_wallet || 'GoPay'; } catch {}
    return 'GoPay';
  });
  const [date,     setDate]     = useState(today);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  // Inject CSS once
  if (!document.getElementById('atm-css')) {
    const s = document.createElement('style');
    s.id = 'atm-css'; s.textContent = MODAL_CSS;
    document.head.appendChild(s);
  }

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { setErr('Masukkan nominal yang valid.'); return; }
    if (!phone) { setErr('Sesi tidak ditemukan. Silakan login ulang.'); return; }

    setSaving(true); setErr(null);
    try {
      const payload = {
        phone_number:     phone,
        amount:           Number(amount),
        category:         CAT_TO_DB[category] || 'others',
        merchant:         merchant.trim() || category,
        wallet,
        date,
        transaction_type: type,
        created_at:       new Date().toISOString(),
      };
      const r = await fetch(`${SUPA_URL}/rest/v1/expenses`, {
        method: 'POST',
        headers: { ...HW, Prefer: 'return=minimal' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        throw new Error(txt || 'Gagal menyimpan transaksi');
      }
      setDone(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1000);
    } catch (e: any) {
      setErr(e.message || 'Terjadi kesalahan. Coba lagi.');
    }
    setSaving(false);
  };

  return (
    <div className="atm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="atm-sheet">
        <span className="atm-handle" />

        <div className="atm-header">
          <h2 className="atm-title">Catat Transaksi</h2>
          <button className="atm-close" onClick={onClose}>
            <X style={{ width: 16, height: 16, color: '#6B7280' }} />
          </button>
        </div>

        <div className="atm-body">
          {/* Type toggle */}
          <div>
            <span className="atm-label">Jenis</span>
            <div className="atm-type-row">
              <button
                className={`atm-type-btn${type === 'expense' ? ' active-expense' : ''}`}
                onClick={() => { setType('expense'); if (category === 'Pemasukan') setCategory('Makanan'); }}
              >Pengeluaran</button>
              <button
                className={`atm-type-btn${type === 'income' ? ' active-income' : ''}`}
                onClick={() => { setType('income'); setCategory('Pemasukan'); }}
              >Pemasukan</button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <span className="atm-label">Nominal</span>
            <div className="atm-amount-wrap">
              <span className="atm-amount-prefix">Rp</span>
              <input
                className="atm-amount-input"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="atm-label">Kategori</span>
            <select
              className="atm-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {(type === 'income' ? ['Pemasukan'] : CATEGORIES.filter(c => c !== 'Pemasukan')).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Merchant / Description */}
          <div>
            <span className="atm-label">Merchant / Keterangan</span>
            <input
              className="atm-input"
              type="text"
              placeholder={type === 'income' ? 'e.g. Gaji, Freelance' : 'e.g. Warung Bu Sari'}
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
            />
          </div>

          {/* Wallet + Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span className="atm-label">Wallet</span>
              <select className="atm-select" value={wallet} onChange={e => setWallet(e.target.value)}>
                {WALLETS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <span className="atm-label">Tanggal</span>
              <input className="atm-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {err && <div className="atm-err">{err}</div>}

          <button
            className={`atm-submit${done ? ' ok' : ''}`}
            onClick={handleSubmit}
            disabled={saving || done}
          >
            {done
              ? <><Check style={{ width: 16, height: 16 }} /> Tersimpan!</>
              : saving ? 'Menyimpan...' : 'Simpan Transaksi'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
