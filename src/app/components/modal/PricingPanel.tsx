import { useState } from 'react';
import { plans } from './pricingData';
import './PricingPanel.css';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';

interface PricingPanelProps {
  selectedPlan: string;
  setSelectedPlan: (plan: string) => void;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  voucherDiscount: number;
  setVoucherDiscount: (discount: number) => void;
  activeVoucher: string;
  setActiveVoucher: (voucher: string) => void;
  setAffiliateReferrerPhone: (phone: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PricingPanel({
  selectedPlan,
  setSelectedPlan,
  selectedDuration,
  setSelectedDuration,
  voucherDiscount,
  setVoucherDiscount,
  activeVoucher,
  setActiveVoucher,
  setAffiliateReferrerPhone,
  onNext,
  onBack
}: PricingPanelProps) {
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherMsg, setVoucherMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  const currentPlan = plans[selectedPlan];
  const currentDuration = currentPlan.durations.find((d) => d.id === selectedDuration);
  const price = currentDuration?.price || 0;
  const discount = Math.round((price * voucherDiscount) / 100);
  const final = price - discount;

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;

    // Validasi ke Supabase: cek apakah kode ini adalah affiliate_code yang valid
    setVoucherLoading(true);
    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/users?affiliate_code=eq.${code}&select=primary_phone,name`,
        {
          headers: {
            'apikey'       : SUPA_ANON,
            'Authorization': 'Bearer ' + SUPA_ANON,
            'Accept'       : 'application/json',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const referrer = data[0];
          setVoucherDiscount(10);
          setActiveVoucher(code);
          setAffiliateReferrerPhone(referrer.primary_phone || '');
          setVoucherMsg({ type: 'ok', text: `✅ Kode affiliate valid! Diskon 10% diterapkan. Referral dari: ${referrer.name || code}` });
        } else {
          setVoucherDiscount(0);
          setActiveVoucher('');
          setAffiliateReferrerPhone('');
          setVoucherMsg({ type: 'err', text: '❌ Kode voucher tidak valid atau sudah kadaluarsa.' });
        }
      } else {
        setVoucherMsg({ type: 'err', text: '❌ Gagal memverifikasi kode. Coba lagi.' });
      }
    } catch {
      setVoucherMsg({ type: 'err', text: '❌ Gagal terhubung ke server. Coba lagi.' });
    }
    setVoucherLoading(false);
  };

  return (
    <div id="pricing-panel" className="show">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '6px' }}>
          🔥 Pilih Paketmu
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
          Mulai Lebih Sehat Hari Ini
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
          Harga terjangkau, manfaat maksimal.
        </p>
      </div>

      <div className="pricing-tabs">
        {Object.keys(plans).map((key) => (
          <button
            key={key}
            className={`ptab ${selectedPlan === key ? 'active' : ''}`}
            onClick={() => {
              setSelectedPlan(key);
              setSelectedDuration('12');
            }}
          >
            {plans[key].icon} {plans[key].name}
          </button>
        ))}
      </div>

      <div className="plan-card current-plan">
        <div className="plan-card-header">
          <h3>
            {currentPlan.icon} {currentPlan.name}
          </h3>
          <p>{currentPlan.desc}</p>
        </div>
        <div className="duration-opts">
          {currentPlan.durations.map((d) => (
            <div
              key={d.id}
              className={`dur-opt ${selectedDuration === d.id ? 'selected' : ''}`}
              onClick={() => setSelectedDuration(d.id)}
            >
              <div className="dur-left">
                <div className="dur-check"></div>
                <div>
                  <div className="dur-name">{d.label}</div>
                  <div className="dur-per" dangerouslySetInnerHTML={{ __html: d.per + (d.note ? ` · <em>${d.note}</em>` : '') }} />
                  {d.vsPersonal && (
                    <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700, marginTop: '3px' }}>
                      💚 {d.vsPersonal}
                    </div>
                  )}
                </div>
              </div>
              <div className="dur-right">
                <div className="dur-price">Rp{d.price.toLocaleString('id-ID')}</div>
                {d.save && <div className="dur-save">{d.save}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: '8px' }}>
          🏷️ Kode Voucher (opsional)
        </div>
        <div className="voucher-row">
          <input
            type="text"
            className="voucher-input"
            placeholder="Masukkan kode voucher"
            value={voucherInput}
            onChange={(e) => {
              setVoucherInput(e.target.value);
              setVoucherMsg(null);
            }}
          />
          <button className="btn btn-sm btn-outline" onClick={handleApplyVoucher} disabled={voucherLoading}>
            {voucherLoading ? 'Memverifikasi...' : 'Terapkan'}
          </button>
        </div>
        {voucherMsg && (
          <div className={`voucher-msg ${voucherMsg.type}`}>{voucherMsg.text}</div>
        )}
      </div>

      <div className="order-summary">
        <div className="order-row">
          <span>Paket {currentPlan.icon} {currentPlan.name} · {currentDuration?.label}</span>
          <span>Rp{price.toLocaleString('id-ID')}</span>
        </div>
        {discount > 0 && (
          <div className="order-row" style={{ color: 'var(--success)' }}>
            <span>🏷️ Voucher {activeVoucher} ({voucherDiscount}%)</span>
            <span>- Rp{discount.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="order-row total">
          <span>Total</span>
          <span style={{ color: 'var(--blue)' }}>Rp{final.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button className="btn btn-full btn-lg" onClick={onNext}>
          Lanjut →
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: '#94A3B8', textDecoration: 'underline' }}
          onClick={onBack}
        >
          ← Lihat kembali hasil assessment
        </button>
      </div>
    </div>
  );
}