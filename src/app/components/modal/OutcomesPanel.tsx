import { useEffect, useState, useRef } from 'react';
import { calcScore, getIncomeMonthly, calcDailyLimit } from './scoring';
import './OutcomesPanel.css';

interface OutcomesPanelProps {
  answers: Record<string, any>;
  onNext: () => void;
  /** Jika diisi, ganti label tombol CTA bawah */
  ctaLabel?: string;
  /** Jika true, sembunyikan pkg-cta-banner (blok harga Rp29.000) */
  hidePricingBanner?: boolean;
  /** Jika true, tombol CTA disabled (misal saat submit masih berlangsung) */
  ctaDisabled?: boolean;
}

export function OutcomesPanel({ answers, onNext, ctaLabel, hidePricingBanner, ctaDisabled }: OutcomesPanelProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { total, dims } = calcScore(answers);
  const income = getIncomeMonthly(answers);
  const calcedLimit = calcDailyLimit(income, answers);

  // ── Editable daily limit ──────────────────────────────────────────────────
  const [dailyLimit, setDailyLimit]     = useState(calcedLimit);
  const [editingLimit, setEditingLimit] = useState(false);
  const [inputVal, setInputVal]         = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setInputVal(String(dailyLimit));
    setEditingLimit(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const num = parseInt(inputVal.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) setDailyLimit(num);
    setEditingLimit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditingLimit(false);
  };

  useEffect(() => {
    let n = 0;
    const interval = setInterval(() => {
      n = Math.min(n + 2, total);
      setAnimatedScore(n);
      if (n >= total) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [total]);

  const getCategoryInfo = () => {
    if (total <= 40) return { cat: '🔴 Rentan',          color: '#DC2626', sub: 'Kondisi keuangan perlu perhatian serius.' };
    if (total <= 60) return { cat: '🟠 Perlu Perhatian', color: '#F59E0B', sub: 'Ada beberapa area yang bisa diperbaiki.' };
    if (total <= 75) return { cat: '🟢 Cukup Sehat',     color: '#16A34A', sub: 'Keuanganmu cukup sehat, tetap pertahankan!' };
    return                 { cat: '💎 Sangat Sehat',     color: '#2D4BFF', sub: 'Finansialmu sangat solid. Terus tingkatkan!' };
  };

  const { cat, color, sub } = getCategoryInfo();
  const circumference = 364.4;
  const offset = circumference - (circumference * animatedScore / 100);

  // ── Headline berdasarkan score_total ─────────────────────────────────────
  const headline = total > 60
    ? '✅ Kamu di jalur yang tepat! Pertahankan kebiasaan baik dan tingkatkan area yang masih kurang optimal.'
    : '📊 Kondisi finansialmu masih bisa ditingkatkan. Beberapa kebiasaan pengeluaran bisa diperbaiki agar lebih stabil ke depannya.';

  const headlineBg    = total > 60 ? '#F0FDF4' : '#FFF7ED';
  const headlineBorder = total > 60 ? '#BBF7D0' : '#FED7AA';
  const headlineColor  = total > 60 ? '#166534' : '#92400E';

  // ── 6 OUTCOME CARDS ──────────────────────────────────────────────────────

  const outcomeCards: { type: string; icon: string; title: string; body: string }[] = [];

  // Card 1 — Pemasukan (dari score_income)
  if (dims.income >= 12)
    outcomeCards.push({ type: 'ok',   icon: '✅', title: 'Pemasukan Stabil',             body: 'Arus kas cukup stabil dan konsisten.' });
  else if (dims.income >= 7)
    outcomeCards.push({ type: 'warn', icon: '🟡', title: 'Pemasukan Perlu Diperhatikan', body: 'Ketidakstabilan penghasilan bisa mempersulit perencanaan keuangan.' });
  else
    outcomeCards.push({ type: 'bad',  icon: '🔴', title: 'Pemasukan Tidak Menentu',      body: 'Penghasilan tidak tetap meningkatkan risiko cashflow. MIRA bisa bantu pantau.' });

  // Card 2 — Beban Wajib (dari COUNT ITEM Q4/q5, BUKAN score_expense) — Bug #1 fix
  const q4Count = Array.isArray(answers.q5) ? answers.q5.length : 0;
  if (q4Count <= 2)
    outcomeCards.push({ type: 'ok',   icon: '✅', title: 'Beban Pengeluaran Ringan', body: 'Pengeluaran wajibmu proporsional dengan penghasilan.' });
  else if (q4Count <= 4)
    outcomeCards.push({ type: 'warn', icon: '🟡', title: 'Beban Moderat',            body: 'Cukup besar. Waspadai pengeluaran di luar pos wajib.' });
  else
    outcomeCards.push({ type: 'bad',  icon: '🔴', title: 'Beban Tinggi',             body: 'Lebih dari separuh penghasilan habis untuk kewajiban. Risiko cashflow tinggi.' });

  // Card 3 — Kontrol Belanja — ADA FLAG OVERRIDE — Bug #2 fix
  const hasImpulseFlag = answers.q7 === 'sering' || answers.q7 === 'sangat-sering' || answers.q6 === 'ga-terasa';
  if (hasImpulseFlag)
    outcomeCards.push({ type: 'bad',  icon: '⚠️', title: 'Risiko Impulsif Terdeteksi',  body: 'Pola belanja impulsif atau micro-spending tanpa sadar terdeteksi.' });
  else if (dims.spending >= 12)
    outcomeCards.push({ type: 'ok',   icon: '✅', title: 'Pengeluaran Terkontrol',       body: 'Kamu relatif disiplin dalam berbelanja. Pertahankan!' });
  else
    outcomeCards.push({ type: 'warn', icon: '🟡', title: 'Pengeluaran Perlu Dijaga',     body: 'Ada potensi kebocoran kecil yang perlu dipantau.' });

  // Card 4 — Disiplin Nabung (dari score_saving)
  if (dims.saving >= 12)
    outcomeCards.push({ type: 'ok',   icon: '✅', title: 'Disiplin Menabung',             body: 'Kamu punya kebiasaan menabung yang baik. Lanjutkan!' });
  else if (dims.saving >= 6)
    outcomeCards.push({ type: 'warn', icon: '🟡', title: 'Tabungan Perlu Ditingkatkan',   body: 'Menabung ada tapi kurang konsisten. MIRA bisa kirim pengingat nabung.' });
  else
    outcomeCards.push({ type: 'bad',  icon: '🔴', title: 'Belum Rutin Menabung',          body: 'Tanpa tabungan rutin, sulit membangun keamanan finansial jangka panjang.' });

  // Card 5 — Dana Darurat (dari score_emergency)
  if (dims.emergency >= 7)
    outcomeCards.push({ type: 'ok',   icon: '✅', title: 'Dana Darurat Aman',         body: 'Dana darurat cukup menanggung risiko jangka pendek. (≥ 3 bulan)' });
  else if (dims.emergency >= 4)
    outcomeCards.push({ type: 'warn', icon: '🟡', title: 'Dana Darurat Perlu Ditambah', body: '1–3 bulan masih kurang ideal. Target minimal 3–6 bulan pengeluaran.' });
  else
    outcomeCards.push({ type: 'bad',  icon: '🔴', title: 'Tidak Ada Dana Darurat',    body: 'Risiko terbesar. Satu masalah bisa bikin kondisi finansial ambruk.' });

  // Card 6 — Risiko Kredit (dari score_debt)
  if (dims.debt >= 8)
    outcomeCards.push({ type: 'ok',   icon: '✅', title: 'Risiko Kredit Rendah',          body: 'Penggunaan kredit & PayLater kamu terkontrol.' });
  else if (dims.debt >= 5)
    outcomeCards.push({ type: 'warn', icon: '🟡', title: 'Perhatikan Penggunaan Kredit',  body: 'PayLater atau cicilan perlu dipantau agar tidak menumpuk.' });
  else
    outcomeCards.push({ type: 'bad',  icon: '🔴', title: 'Risiko Kredit Tinggi',          body: 'Penggunaan PayLater/kredit berisiko menimbulkan stres finansial. MIRA bisa bantu monitor.' });

  // ── REKOMENDASI PRIORITAS — STATIC ───────────────────────────────────────
  const staticRecos: string[] = [
    '💬 Catat pengeluaran, pemasukan, semua lewat WhatsApp.',
    '📊 Laporan keuangan bulanan otomatis beserta grafik dalam Excel.',
    '🛒 Spending Alert di MIRA — notifikasi tiap kali pengeluaran mendekati batas harian.',
    '🏦 Dashboard lengkap untuk mengontrol aset, net worth, dan tren finansial.',
  ];
  // Kondisional: hutang/cicilan aktif (q16 !== 'tidak')
  if (answers.q16 !== 'tidak') {
    staticRecos.push('💳 Pantau PayLater & cicilan — MIRA mendeteksi pola penggunaan kredit berisiko.');
  }
  // Kondisional: user berinvestasi (q13 !== 'tidak')
  if (answers.q13 !== 'tidak') {
    staticRecos.push('📈 Lacak alokasi investasi dan kelola portofolio dengan MIRA.');
  }

  const helps = ['💬 Spending Alerts harian', '🏦 Saving Nudges otomatis', '📊 Laporan Excel bulanan otomatis'];

  return (
    <div id="outcomes-panel" className="show">
      <div className="score-ring-wrap">
        <div className="score-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle className="ring-bg" cx="70" cy="70" r="58" />
            <circle
              className="ring-fill"
              cx="70" cy="70" r="58"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ stroke: color }}
            />
          </svg>
          <div className="ring-text">
            <span className="ring-num">{animatedScore}</span>
            <span className="ring-label">/ 100</span>
          </div>
        </div>
        <div className="score-cat" style={{ color }}>{cat}</div>
        <p style={{ fontSize: '0.83rem', color: '#64748B', marginTop: '6px' }}>{sub}</p>
      </div>

      {/* ── Headline berdasarkan score_total ── */}
      <div style={{ marginTop: '12px', background: headlineBg, border: `1px solid ${headlineBorder}`, borderRadius: '12px', padding: '12px 16px', fontSize: '0.84rem', color: headlineColor }}>
        {headline}
      </div>

      {/* ── PROMINENT CTA — only shown when hidePricingBanner is false ── */}
      {!hidePricingBanner && (
        <div className="pkg-cta-banner">
          <div className="pkg-cta-badge">🎯 Berdasarkan Profil Keuanganmu</div>
          <p className="pkg-cta-headline">
            Paket MIRA mulai <strong>Rp29.000<span className="pkg-cta-per">/bulan</span></strong>
          </p>
          <p className="pkg-cta-sub">Kurang dari secangkir kopi — langsung aktif di WhatsApp</p>
          <button className="btn btn-lg btn-full pkg-cta-btn" onClick={onNext}>
            🔥 Lihat Paket yang Cocok Untukmu →
          </button>
          <div className="pkg-cta-badges">
            <span>✓ Tanpa download app</span>
            <span>✓ Aktif dalam 5 menit</span>
            <span>✓ Garansi puas</span>
          </div>
        </div>
      )}

      {/* ── Batas Aman Harian ── */}
      <div className="daily-limit-box">
        <div className="dl-label">💰 Batas Aman Pengeluaran Harian</div>
        <div className="dl-amount">
          {editingLimit ? (
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="dl-input"
            />
          ) : (
            <span className="dl-value">Rp{dailyLimit.toLocaleString('id-ID')} / hari</span>
          )}
          <button
            className="dl-edit-btn"
            onClick={editingLimit ? commitEdit : startEdit}
          >
            {editingLimit ? 'Simpan' : 'Ubah'}
          </button>
        </div>
        <div className="dl-sub">estimasi berdasarkan penghasilan & alokasi pengeluaranmu</div>
      </div>

      {/* ── 6 Outcome Cards ── */}
      <div className="outcome-cards">
        {outcomeCards.map((c, i) => (
          <div key={i} className={`oc ${c.type}`}>
            <div className="oc-title">{c.icon} {c.title}</div>
            <div className="oc-body">{c.body}</div>
          </div>
        ))}
      </div>

      {/* ── Rekomendasi Prioritas — Static ── */}
      <div style={{ marginTop: '18px' }}>
        <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '0.95rem', marginBottom: '10px' }}>
          🎯 Rekomendasi Prioritas
        </div>
        <div className="reco-list">
          {staticRecos.map((text, i) => (
            <div key={i} className="reco-item">
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '18px', background: 'var(--blue-ultra)', borderRadius: '12px', padding: '14px 16px', fontSize: '0.84rem', color: 'var(--text-body)' }}>
        <strong style={{ color: 'var(--blue)' }}>🤖 MIRA Bisa Membantu Dengan:</strong>
        <br />
        {helps.map((h, i) => (
          <span key={i} style={{ display: 'inline-block', background: '#fff', border: '1px solid var(--border)', borderRadius: '99px', padding: '3px 10px', margin: '3px 3px 3px 0', fontSize: '0.8rem' }}>
            {h}
          </span>
        ))}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '14px' }}>
          Yuk mulai kelola keuangan lebih sehat bersama MIRA!
        </p>
        <button
          className="btn btn-lg btn-full"
          onClick={onNext}
          disabled={ctaDisabled}
          style={{ opacity: ctaDisabled ? 0.6 : 1, cursor: ctaDisabled ? 'not-allowed' : 'pointer' }}
        >
          {ctaDisabled ? '⏳ Menyimpan…' : (ctaLabel || 'Lihat Pilihan Paket →')}
        </button>
      </div>
    </div>
  );
}