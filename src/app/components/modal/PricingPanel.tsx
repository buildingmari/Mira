import { useState } from 'react';
import { plans, TRIAL_DAYS, TRIAL_DURATION, TRIAL_VOUCHER } from './pricingData';
import './PricingPanel.css';
import { MiraIcon } from '../icons/MiraIcon';

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
  const isTrial = selectedDuration === TRIAL_DURATION;

  const handleApplyVoucher = async (typed?: string) => {
    const code = (typed ?? voucherInput).trim().toUpperCase();
    if (!code) return;
    if (typed) setVoucherInput(typed);

    setVoucherLoading(true);
    try {
      // Step 1: Cek tabel vouchers dulu
      const voucherRes = await fetch(
        `${SUPA_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true&limit=1`,
        {
          headers: {
            'apikey'       : SUPA_ANON,
            'Authorization': 'Bearer ' + SUPA_ANON,
            'Accept'       : 'application/json',
          },
        }
      );

      if (voucherRes.ok) {
        const voucherData = await voucherRes.json();
        if (Array.isArray(voucherData) && voucherData.length > 0) {
          const voucher = voucherData[0];
          const discountPercent = Number(voucher.discount_percent || 0);
          setVoucherDiscount(discountPercent);
          setActiveVoucher(voucher.code);
          setAffiliateReferrerPhone('');
          if (voucher.code === TRIAL_VOUCHER) {
            // This exact code is the free trial, never a discount on the
            // selected plan — force-select the hidden trial entry so 100%
            // off can't be combined with a paid duration.
            setSelectedDuration(TRIAL_DURATION);
            setVoucherMsg({ type: 'ok', text: `Trial gratis ${TRIAL_DAYS} hari aktif! Semua fitur MIRA langsung bisa kamu pakai.` });
          } else {
            if (isTrial) setSelectedDuration('12');
            setVoucherMsg({ type: 'ok', text: `Voucher berhasil! Diskon ${discountPercent}% diterapkan.` });
          }
          setVoucherLoading(false);
          return;
        }
      }

      // Step 2: Fallback — cek affiliate code di tabel users
      const affiliateRes = await fetch(
        `${SUPA_URL}/rest/v1/users?affiliate_code=eq.${encodeURIComponent(code)}&select=primary_phone,name`,
        {
          headers: {
            'apikey'       : SUPA_ANON,
            'Authorization': 'Bearer ' + SUPA_ANON,
            'Accept'       : 'application/json',
          },
        }
      );

      if (affiliateRes.ok) {
        const affiliateData = await affiliateRes.json();
        if (Array.isArray(affiliateData) && affiliateData.length > 0) {
          const referrer = affiliateData[0];
          if (isTrial) setSelectedDuration('12');
          setVoucherDiscount(10);
          setActiveVoucher(code);
          setAffiliateReferrerPhone(referrer.primary_phone || '');
          setVoucherMsg({ type: 'ok', text: `Kode affiliate valid! Diskon 10% diterapkan. Referral dari: ${referrer.name || code}` });
          setVoucherLoading(false);
          return;
        }
      }

      // Tidak ditemukan di mana-mana
      setVoucherDiscount(0);
      setActiveVoucher('');
      setAffiliateReferrerPhone('');
      setVoucherMsg({ type: 'err', text: 'Kode voucher tidak valid atau sudah kadaluarsa.' });
    } catch {
      setVoucherMsg({ type: 'err', text: 'Gagal terhubung ke server. Coba lagi.' });
    }
    setVoucherLoading(false);
  };

  return (
    <div id="pricing-panel" className="show">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <MiraIcon name="sparkle" size={22} tile={false} />
          Pilih Paketmu
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
          Mulai Lebih Sehat Hari Ini
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
          Harga terjangkau, manfaat maksimal.
        </p>
      </div>

      <div className="pricing-tabs">
        {Object.keys(plans).filter((key) => key === 'personal').map((key) => (
          <button
            key={key}
            className={`ptab ${selectedPlan === key ? 'active' : ''}`}
            onClick={() => {
              setSelectedPlan(key);
              setSelectedDuration('12');
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MiraIcon name={plans[key].icon} size={24} tile={false} />{plans[key].name}
            </span>
          </button>
        ))}
      </div>

      <div className="plan-card current-plan">
        <div className="plan-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MiraIcon name={currentPlan.icon} size={30} />{currentPlan.name}
          </h3>
          <p>{currentPlan.desc}</p>
        </div>
        <div className="duration-opts">
          {currentPlan.durations
            .filter((d) => d.id !== TRIAL_DURATION || isTrial)
            .map((d) => {
              const isFreeTrial = d.id === TRIAL_DURATION;
              return (
            <div
              key={d.id}
              className={`dur-opt ${selectedDuration === d.id ? 'selected' : ''}`}
              style={isFreeTrial ? { cursor: 'default' } : undefined}
              onClick={() => {
                if (isFreeTrial) return; // locked while the free-trial voucher is active
                setSelectedDuration(d.id);
                if (activeVoucher === TRIAL_VOUCHER) {
                  // Picking a paid plan ends the trial choice and drops the
                  // 100%-off voucher, so it can't leak onto a paid plan.
                  setVoucherDiscount(0);
                  setActiveVoucher('');
                  setVoucherMsg(null);
                }
              }}
            >
              <div className="dur-left">
                <div className="dur-check"></div>
                <div>
                  <div className="dur-name" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {d.label}{d.best && <MiraIcon name="sparkle" size={20} tile={false} />}
                  </div>
                  <div className="dur-per" dangerouslySetInnerHTML={{ __html: d.per + (d.note ? ` · <em>${d.note}</em>` : '') }} />
                  {d.vsPersonal && (
                    <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700, marginTop: '3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MiraIcon name="piggy" size={18} tile={false} />{d.vsPersonal}
                    </div>
                  )}
                </div>
              </div>
              <div className="dur-right">
                <div className="dur-price">{isFreeTrial ? 'Gratis' : `Rp${d.price.toLocaleString('id-ID')}`}</div>
                {d.save && <div className="dur-save">{d.save}</div>}
              </div>
            </div>
              );
            })}
        </div>
      </div>

      {!activeVoucher && (
        <div className="trial-hint">
          <MiraIcon name="gift" size={36} />
          <div className="trial-hint-txt">
            <strong>Mau coba dulu?</strong> Pakai kode <span className="trial-code">{TRIAL_VOUCHER}</span> — gratis {TRIAL_DAYS} hari, semua fitur, tanpa kartu kredit.
          </div>
          <button className="btn btn-sm" onClick={() => void handleApplyVoucher(TRIAL_VOUCHER)} disabled={voucherLoading}>
            Pakai
          </button>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <MiraIcon name="tag" size={26} />
          Kode Voucher (opsional)
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
          <button className="btn btn-sm btn-outline" onClick={() => void handleApplyVoucher()} disabled={voucherLoading}>
            {voucherLoading ? 'Memverifikasi...' : 'Terapkan'}
          </button>
        </div>
        {voucherMsg && (
          <div className={`voucher-msg ${voucherMsg.type}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MiraIcon name={voucherMsg.type === 'ok' ? 'check-badge' : 'alert'} size={20} tile={false} />
            <span>{voucherMsg.text}</span>
          </div>
        )}
      </div>

      <div className="order-summary">
        <div className="order-row">
          <span>{isTrial ? `MIRA ${currentDuration?.label}` : `Paket ${currentPlan.name} · ${currentDuration?.label}`}</span>
          <span>Rp{price.toLocaleString('id-ID')}</span>
        </div>
        {discount > 0 && (
          <div className="order-row" style={{ color: 'var(--success)' }}>
            <span>Voucher {activeVoucher} ({voucherDiscount}%)</span>
            <span>- Rp{discount.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="order-row total">
          <span>Total</span>
          <span style={{ color: 'var(--blue)' }}>Rp{final.toLocaleString('id-ID')}</span>
        </div>
        {isTrial && (
          <div className="order-note">
            Setelah {TRIAL_DAYS} hari, pilih paket buat lanjut — mulai Rp20 ribuan/bulan. Nggak ada tagihan otomatis.
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button className="btn btn-full btn-lg" onClick={onNext}>
          {isTrial ? 'Mulai Trial Gratis →' : 'Lanjut →'}
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