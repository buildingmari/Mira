/**
 * PendingAssessmentGate
 * Tampil fullscreen ketika account_status === 'pending_assessment'.
 * User (additional user Duo/Combo) harus isi assessment sebelum bisa masuk dashboard.
 * Flow: welcome → assessment → outcomes (+ background submit) → dashboard
 */
import { useState, useRef, useEffect } from 'react';
import { AssessmentPanel } from './modal/AssessmentPanel';
import { OutcomesPanel } from './modal/OutcomesPanel';
import { calcScore, getIncomeMonthly } from './modal/scoring';
import logo from 'figma:asset/8799174486cc1173a37d30ea2d006df3d31bf14e.png';

const SUPA_URL  = 'https://vhwissutkmxyzlyzkhyt.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod2lzc3V0a214eXpseXpraHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIxMTksImV4cCI6MjA4NzA1ODExOX0.pKVqCkDv8bsaMCPJSsjFx0pYTVN5FPg0KFyoKz4kLM0';

// ─── Label maps (sama dengan buildPayload.ts) ─────────────────────────────────
const MAP_INCOME_RANGE: Record<string, string> = {
  '<3jt':'< Rp3 juta','3-5jt':'Rp3–5 juta','5-10jt':'Rp5–10 juta',
  '10-20jt':'Rp10–20 juta','20-30jt':'Rp20–30 juta','30-50jt':'Rp30–50 juta','>50jt':'> Rp50 juta',
};
const MAP_INCOME_TYPE: Record<string, string> = {
  tetap:'Fixed monthly', freelance:'Variable / freelance', campuran:'Mixed',
};
const MAP_PAYDAY_TYPE: Record<string, string> = {
  tetap:'Fixed date', bervariasi:'Varies', harian:'Daily / weekly',
};
const MAP_MANDATORY: Record<string, string> = {
  sewa:'Rent / mortgage', listrik:'Electricity & utilities', transport:'Work transportation',
  asuransi:'Insurance', cicilan:'Debt installments', tanggungan:'Family dependents',
};
const MAP_BIGGEST: Record<string, string> = {
  makan:'Food & daily snacks', lifestyle:'Hangout & lifestyle',
  'belanja-online':'Online shopping', keluarga:'Family needs', 'ga-terasa':'Unknown / unnoticed',
};
const MAP_IMPULSE: Record<string, string> = {
  jarang:'Almost never', kadang:'Sometimes', sering:'Often', 'sangat-sering':'Very often',
};
const MAP_SAVING_GOALS: Record<string, string> = {
  darurat:'Emergency fund', rumah:'Buy a house', mobil:'Buy a vehicle',
  menikah:'Marriage', pendidikan:'Education', liburan:'Dream vacation',
  pensiun:'Retirement fund', bisnis:'Business capital', gadget:'Gadget / wishlist',
  'tidak-ada':'No specific goal',
};
const MAP_EMERGENCY: Record<string, string> = {
  'tidak-ada':'No emergency fund', '<1':'< 1 month', '1-3':'1–3 months',
  '3-6':'3–6 months', '>6':'> 6 months',
};
const MAP_INVEST_STATUS: Record<string, string> = {
  tidak:'Not investing', sesekali:'Yes, occasionally', rutin:'Yes, regularly',
};
const MAP_INVEST_INSTRUMENTS: Record<string, string> = {
  reksa:'Mutual funds', saham:'Stocks', emas:'Gold',
  crypto:'Crypto', properti:'Property', bisnis:'Business', tidak:'None',
};
const MAP_DEBT: Record<string, string> = {
  tidak:'No active debt', ringan:'Yes, light', besar:'Yes, substantial',
};
const MAP_PAYLATER_HABIT: Record<string, string> = {
  tidak:'Never', sesekali:'Occasionally',
  terkontrol:'Regularly but controlled', menumpuk:'Often & accumulating',
};
const MAP_BANK: Record<string, string> = {
  bri:'BRI', mandiri:'Mandiri', bni:'BNI', btn:'BTN', bca:'BCA',
  cimb:'CIMB Niaga', danamon:'Danamon', permata:'Permata Bank',
  ocbc:'OCBC NISP', panin:'Panin Bank', maybank:'Maybank', mega:'Mega Bank',
  sinarmas:'Sinarmas', bsi:'BSI', 'cimb-syariah':'CIMB Syariah',
  jago:'Bank Jago', jenius:'Jenius (BTPN)', seabank:'SeaBank',
  blu:'Blu by BCA', neo:'Neo Bank',
};
const MAP_EWALLET: Record<string, string> = {
  gopay:'GoPay', ovo:'OVO', dana:'DANA',
  shopeepay:'ShopeePay', linkaja:'LinkAja', astrapay:'AstraPay', lainnya:'Others',
};
const MAP_PAYLATER_ACTIVE: Record<string, string> = {
  'cc-bank':'Bank credit card', kredivo:'Kredivo', akulaku:'Akulaku',
  spaylater:'SPayLater', gopaylater:'GoPayLater',
  traveloka:'Traveloka PayLater', 'tidak-ada':'None',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapVal(val: any, map: Record<string, string>): string {
  return map[val] || val || '-';
}
function mapArr(arr: any, map: Record<string, string>): string {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return arr.map((item: any) => {
    const key = typeof item === 'object' && item !== null ? item.v : item;
    return map[key] || map[String(item)] || String(key);
  }).join(', ');
}
function rawArr(arr: any): string {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return arr.map((item: any) =>
    typeof item === 'object' && item !== null ? item.v : String(item)
  ).join(', ');
}
function rankingLabel(arr: any): string {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return arr.map((item: any) => {
    if (typeof item === 'object' && item !== null) {
      return item.l?.replace(/^[^\w\u00C0-\u024F]+/, '').trim() || item.v;
    }
    return String(item);
  }).join(' > ');
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserInfo {
  plan_name: string;
  expiry: string;
}
interface Props {
  phone: string;
  user: UserInfo | null;
  onComplete: () => void; // dipanggil setelah assessment berhasil → parent reload
}

type Screen = 'welcome' | 'assessment' | 'outcomes' | 'done' | 'error';
type SubmitState = 'idle' | 'pending' | 'done' | 'error';

// ─── Inline CSS untuk gate (scoped, tidak konflik) ────────────────────────────
const GATE_CSS = `
/* AssessmentPanel CSS variables — harus ada agar component bekerja */
:root {
  --blue:#2D4BFF;--blue-dark:#1F35B8;--blue-light:#6C82FF;--blue-ultra:#E9EDFF;
  --cyan:#22D3EE;--gradient:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%);
  --success:#16A34A;--success-bg:#DCFCE7;
  --border:#E2E8F0;--surface:#F8FAFC;
  --text-dark:#0F172A;--text-body:#334155;--text-muted:#64748B;
  --r:16px;
}
/* Override body overflow reset saat gate aktif */
.pending-gate-wrap { overflow:auto!important; }
/* AssessmentPanel core classes */
#assessment-panel { padding:0; }
.assess-progress { display:flex;align-items:center;gap:6px;margin-bottom:24px; }
.progress-step { flex:1;height:4px;border-radius:99px;background:var(--border);transition:background .3s; }
.progress-step.done { background:linear-gradient(135deg,#2D4BFF,#22D3EE); }
.progress-step.active { background:#6C82FF; }
.progress-label { font-size:.78rem;color:#94A3B8;margin-top:6px;margin-bottom:0; }
.step-content { margin-bottom:22px; }
.step-content.shake { animation:shakePG .3s ease; }
@keyframes shakePG { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 60%{transform:translateX(8px)} }
.step-header { margin-bottom:22px; }
.step-tag { display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.06em;
  color:#2D4BFF;background:#E9EDFF;border-radius:99px;padding:3px 12px;margin-bottom:10px; }
.step-header h3 { font-family:'Sora',sans-serif;font-size:1.18rem;font-weight:700;color:#0F172A;margin:0 0 8px; }
.step-header p { font-size:.9rem;color:#64748B;margin:0;line-height:1.55; }
.q-block { margin-top:18px; }
.q-label { font-size:.95rem;font-weight:600;color:#1E293B;margin-bottom:14px;line-height:1.45; }
.q-num { display:inline-flex;align-items:center;justify-content:center;
  width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#2D4BFF,#22D3EE);
  color:#fff;font-size:.75rem;font-weight:700;margin-right:8px;flex-shrink:0; }
/* Radio */
.radio-opts { display:flex;flex-direction:column;gap:10px; }
.radio-opt { display:flex;align-items:center;gap:13px;padding:13px 16px;border:1.5px solid #E2E8F0;
  border-radius:12px;cursor:pointer;transition:all .18s;background:#fff;font-size:.92rem;color:#334155;font-weight:500; }
.radio-opt:hover,.radio-opt.selected { border-color:#2D4BFF;background:#EEF1FF; }
.radio-dot { width:18px;height:18px;border-radius:50%;border:2px solid #CBD5E1;flex-shrink:0;transition:all .18s; }
.radio-opt.selected .radio-dot { border-color:#2D4BFF;background:#2D4BFF;box-shadow:inset 0 0 0 3px #fff; }
/* Checkbox */
.check-opts { display:flex;flex-direction:column;gap:9px; }
.check-opt { display:flex;align-items:center;gap:12px;padding:12px 14px;border:1.5px solid #E2E8F0;
  border-radius:12px;cursor:pointer;transition:all .18s;background:#fff;font-size:.9rem;color:#334155; }
.check-opt:hover { border-color:#93C5FD;background:#F0F7FF; }
.check-opt.checked { border-color:#2D4BFF;background:#EEF1FF; }
.check-box { width:18px;height:18px;border-radius:5px;border:2px solid #CBD5E1;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .18s; }
.check-opt.checked .check-box { border-color:#2D4BFF;background:#2D4BFF; }
/* Grouped */
.grp-label { font-size:.76rem;font-weight:700;color:#94A3B8;letter-spacing:.05em;
  text-transform:uppercase;margin:16px 0 8px; }
/* Ratio slider */
.ratio-slider-wrap { padding:8px 0; }
.rs-label { display:flex;justify-content:space-between;font-size:.82rem;font-weight:600;margin-bottom:10px; }
.rs-track { height:8px;border-radius:99px;background:#E2E8F0;position:relative;cursor:pointer; }
.rs-fill { height:100%;border-radius:99px;background:linear-gradient(90deg,#2D4BFF,#22D3EE);position:absolute;top:0;left:0; }
.rs-thumb { width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid #2D4BFF;
  position:absolute;top:50%;transform:translate(-50%,-50%);cursor:grab;box-shadow:0 2px 6px rgba(45,75,255,.25); }
.rs-hint { font-size:.8rem;color:#64748B;margin-top:10px;text-align:center; }
/* Ranking */
.rank-list { display:flex;flex-direction:column;gap:8px; }
.rank-item { display:flex;align-items:center;gap:12px;padding:13px 14px;
  background:#fff;border:1.5px solid #E2E8F0;border-radius:12px;cursor:grab; }
.rank-num { width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#2D4BFF,#22D3EE);
  color:#fff;font-size:.8rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
/* Nav */
.step-nav { display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px; }
.step-nav.nav-radio-mode { justify-content:flex-start; }
.step-counter { font-size:.78rem;color:#94A3B8;font-weight:500; }
.auto-advance-hint { font-size:.76rem;color:#94A3B8;margin-top:10px;text-align:center; }
/* Buttons used inside AssessmentPanel */
.btn { display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:linear-gradient(135deg,#2D4BFF 0%,#22D3EE 100%);color:#fff;
  padding:13px 26px;border-radius:100px;font-family:'Sora',sans-serif;
  font-weight:700;font-size:.9rem;border:none;cursor:pointer;
  transition:opacity .2s,transform .15s;width:100%;text-decoration:none;line-height:normal; }
.btn:hover { opacity:.92;transform:translateY(-1px); }
.btn:disabled { opacity:.4;cursor:not-allowed; }
.btn-outline { background:transparent!important;color:#2D4BFF!important;border:1.5px solid #2D4BFF!important; }
.btn-outline:hover { background:#E9EDFF!important; }
.btn-sm { padding:8px 20px!important;font-size:.82rem!important;width:auto!important; }
.btn-full { width:100%; }
`;

export function PendingAssessmentGate({ phone, user, onComplete }: Props) {
  const [screen, setScreen]           = useState<Screen>('welcome');
  const [answers, setAnswers]         = useState<Record<string, any>>({});
  const [errMsg, setErrMsg]           = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset body overflow yang di-lock oleh dashboard CSS
  useEffect(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Submit assessment ke Supabase (berjalan di background) ───────────────────
  const submitAssessment = async (finalAnswers: Record<string, any>) => {
    setSubmitState('pending');
    try {
      const score    = calcScore(finalAnswers);
      const { dims } = score;
      const expPct   = finalAnswers.q10_ratio ?? 70;
      const savPct   = 100 - expPct;
      const name     = finalAnswers.user_name || 'Pengguna';

      const payload: Record<string, any> = {
        name,
        account_status : 'active',
        submitted_at   : new Date().toISOString(),
        updated_at     : new Date().toISOString(),
        score_total              : score.total,
        score_income_stability   : Math.round(dims.income),
        score_expense_pressure   : Math.round(dims.expense),
        score_spending_control   : Math.round(dims.spending),
        score_saving_discipline  : Math.round(dims.saving),
        score_emergency_fund     : Math.round(dims.emergency),
        score_investment         : Math.round(dims.investment),
        score_debt               : Math.round(dims.debt),
        score_behavior           : Math.round(dims.behavior),
        income_range             : mapVal(finalAnswers.q1, MAP_INCOME_RANGE),
        income_range_raw         : finalAnswers.q1 || '-',
        income_estimated_idr     : getIncomeMonthly(finalAnswers),
        income_type              : mapVal(finalAnswers.q2, MAP_INCOME_TYPE),
        income_type_raw          : finalAnswers.q2 || '-',
        payday_pattern           : mapVal(finalAnswers.q3, MAP_PAYDAY_TYPE),
        payday_pattern_raw       : finalAnswers.q3 || '-',
        mandatory_expenses       : mapArr(finalAnswers.q5, MAP_MANDATORY),
        mandatory_expenses_raw   : rawArr(finalAnswers.q5),
        mandatory_expense_count  : Array.isArray(finalAnswers.q5) ? finalAnswers.q5.length : 0,
        biggest_spend_category   : mapVal(finalAnswers.q6, MAP_BIGGEST),
        biggest_spend_raw        : finalAnswers.q6 || '-',
        impulse_buy_frequency    : mapVal(finalAnswers.q7, MAP_IMPULSE),
        impulse_buy_raw          : finalAnswers.q7 || '-',
        expense_allocation_pct   : expPct,
        saving_allocation_pct    : savPct,
        saving_goals             : mapArr(finalAnswers.q11, MAP_SAVING_GOALS),
        saving_goals_raw         : rawArr(finalAnswers.q11),
        emergency_fund_duration  : mapVal(finalAnswers.q12, MAP_EMERGENCY),
        emergency_fund_raw       : finalAnswers.q12 || '-',
        investment_status        : mapVal(finalAnswers.q13, MAP_INVEST_STATUS),
        investment_status_raw    : finalAnswers.q13 || '-',
        investment_instruments   : mapArr(finalAnswers.q14, MAP_INVEST_INSTRUMENTS),
        investment_instruments_raw: rawArr(finalAnswers.q14),
        debt_status              : mapVal(finalAnswers.q16, MAP_DEBT),
        debt_status_raw          : finalAnswers.q16 || '-',
        paylater_habit           : mapVal(finalAnswers.q17, MAP_PAYLATER_HABIT),
        paylater_habit_raw       : finalAnswers.q17 || '-',
        banks_used               : mapArr(finalAnswers.q19_bank, MAP_BANK),
        banks_used_raw           : rawArr(finalAnswers.q19_bank),
        ewallets_used            : mapArr(finalAnswers.q20_ewallet, MAP_EWALLET),
        ewallets_used_raw        : rawArr(finalAnswers.q20_ewallet),
        paylater_active          : mapArr(finalAnswers.q21_paylater, MAP_PAYLATER_ACTIVE),
        paylater_active_raw      : rawArr(finalAnswers.q21_paylater),
        payment_method_ranking   : rankingLabel(finalAnswers.q22_rank),
      };
      if (finalAnswers.limit_nominal) payload.limit_nominal = finalAnswers.limit_nominal;

      const res = await fetch(
        `${SUPA_URL}/rest/v1/users?primary_phone=eq.${phone}`,
        {
          method : 'PATCH',
          headers: {
            'apikey'       : SUPA_ANON,
            'Authorization': 'Bearer ' + SUPA_ANON,
            'Content-Type' : 'application/json',
            'Prefer'       : 'return=minimal',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errTxt = await res.text().catch(() => '');
        throw new Error(`Gagal menyimpan (${res.status}): ${errTxt.slice(0, 100)}`);
      }

      // Generate affiliate_code
      const name4  = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
      const phone4 = phone.replace(/\D/g, '').slice(-4);
      const affCode = name4 + phone4;
      await fetch(`${SUPA_URL}/rest/v1/users?primary_phone=eq.${phone}`, {
        method : 'PATCH',
        headers: {
          'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + SUPA_ANON,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ affiliate_code: affCode }),
      });

      // Update sessionStorage
      try {
        const raw = sessionStorage.getItem('mira_user');
        if (raw) {
          const u = JSON.parse(raw);
          Object.assign(u, { name, account_status: 'active', affiliate_code: affCode, score_total: score.total });
          sessionStorage.setItem('mira_user', JSON.stringify(u));
        }
      } catch {}

      setSubmitState('done');
    } catch (err) {
      setSubmitState('error');
      setErrMsg(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
    }
  };

  // Dipanggil ketika AssessmentPanel selesai (semua pertanyaan terjawab)
  const handleAssessmentComplete = (finalAnswers: Record<string, any>) => {
    // Tampilkan outcomes screen DULU (user lihat skor)
    setScreen('outcomes');
    // Jalankan submit ke Supabase di background (tidak blocking UI)
    submitAssessment(finalAnswers);
    // Scroll ke atas
    setTimeout(() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, 50);
  };

  // Dipanggil ketika user klik "Masuk ke Dashboard" di outcomes screen
  const handleEnterDashboard = () => {
    if (submitState === 'pending') {
      // Submit masih jalan — tombol sudah disabled, tapi tangani jika dipaksa
      return;
    }
    if (submitState === 'error') {
      // Retry submit
      submitAssessment(answers);
      return;
    }
    // Submit sukses → masuk dashboard
    setScreen('done');
    setTimeout(() => { onComplete(); }, 1200);
  };

  // Wrapper style untuk fullscreen gate
  const wrapStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#F8FAFF', overflowY: 'auto',
    fontFamily: "'DM Sans', sans-serif",
  };

  // ── Welcome Screen ────────────────────────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <>
        <style>{GATE_CSS}</style>
        <div style={wrapStyle}>
          <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '32px 20px',
          }}>
            <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
              {/* Logo */}
              <img src={logo} alt="MIRA" style={{ height: 36, marginBottom: 32, opacity: .85 }} />

              {/* Icon */}
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 28px',
                boxShadow: '0 12px 40px rgba(45,75,255,0.28)',
              }}>
                <span style={{ fontSize: 36 }}>🎉</span>
              </div>

              {/* Judul */}
              <h1 style={{
                fontFamily: "'Sora', sans-serif", fontWeight: 800,
                fontSize: 'clamp(1.5rem, 5vw, 1.95rem)', lineHeight: 1.2,
                color: '#0F172A', margin: '0 0 14px',
              }}>
                Akun kamu sudah aktif!
              </h1>
              <p style={{
                fontSize: '.97rem', color: '#64748B', lineHeight: 1.65,
                margin: '0 auto 28px', maxWidth: 360,
              }}>
                Kamu didaftarkan ke MIRA. Lengkapi assessment singkat dulu supaya
                MIRA bisa kasih rekomendasi keuangan yang tepat untukmu.
              </p>

              {/* Info Plan */}
              {user && (
                <div style={{
                  background: '#F0F7FF', border: '1.5px solid #BFDBFE',
                  borderRadius: 14, padding: '14px 20px', marginBottom: 28,
                  display: 'inline-flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4, width: '100%', boxSizing: 'border-box',
                }}>
                  <div style={{ fontSize: '.76rem', color: '#3B82F6', fontWeight: 700, letterSpacing: '.05em' }}>
                    PAKET AKTIF
                  </div>
                  <div style={{
                    fontFamily: "'Sora', sans-serif", fontSize: '1.05rem',
                    fontWeight: 800, color: '#1E40AF',
                  }}>
                    ⭐ {user.plan_name}
                  </div>
                  {user.expiry && (
                    <div style={{ fontSize: '.8rem', color: '#64748B' }}>
                      Aktif hingga {user.expiry}
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => setScreen('assessment')}
                style={{
                  width: '100%', padding: '16px 28px', borderRadius: 100,
                  background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: '1rem',
                  boxShadow: '0 8px 28px rgba(45,75,255,0.3)',
                  transition: 'opacity .2s, transform .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                Mulai Assessment →
              </button>
              <p style={{ marginTop: 12, fontSize: '.78rem', color: '#94A3B8' }}>
                Hanya butuh ~3 menit. Tidak bisa dilewati.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Assessment Screen ─────────────────────────────────────────────────────────
  if (screen === 'assessment') {
    return (
      <>
        <style>{GATE_CSS}</style>
        <div style={wrapStyle}>
          {/* Header kecil */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: '#fff', borderBottom: '1px solid #E2E8F0',
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <img src={logo} alt="MIRA" style={{ height: 24, opacity: .8 }} />
            <span style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 700,
              fontSize: '.9rem', color: '#0F172A',
            }}>
              Assessment Keuangan
            </span>
          </div>

          {/* Body — harus punya class modal-body supaya AssessmentPanel bisa scroll ke top */}
          <div
            className="modal-body"
            ref={scrollRef}
            style={{
              maxWidth: 560, margin: '0 auto', padding: '28px 20px 60px',
              overflowY: 'auto',
            }}
          >
            <AssessmentPanel
              answers={answers}
              setAnswers={setAnswers}
              onComplete={() => handleAssessmentComplete(answers)}
            />
          </div>
        </div>
      </>
    );
  }

  // ── Outcomes / Skor Screen ────────────────────────────────────────────────────
  if (screen === 'outcomes') {
    const ctaLabel = submitState === 'pending'
      ? '⏳ Menyimpan data…'
      : submitState === 'error'
      ? '⚠️ Gagal simpan — Coba lagi & Masuk Dashboard'
      : '🚀 Masuk ke Dashboard →';

    return (
      <>
        <style>{GATE_CSS}</style>
        <div style={wrapStyle}>
          {/* Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: '#fff', borderBottom: '1px solid #E2E8F0',
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <img src={logo} alt="MIRA" style={{ height: 24, opacity: .8 }} />
            <span style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 700,
              fontSize: '.9rem', color: '#0F172A', flex: 1,
            }}>
              📊 Hasil Kesehatan Finansialmu
            </span>
            {submitState === 'pending' && (
              <span style={{ fontSize: '.75rem', color: '#64748B', background: '#F1F5F9', borderRadius: 99, padding: '3px 10px' }}>
                ⏳ Menyimpan…
              </span>
            )}
            {submitState === 'done' && (
              <span style={{ fontSize: '.75rem', color: '#16A34A', background: '#F0FDF4', borderRadius: 99, padding: '3px 10px' }}>
                ✅ Tersimpan
              </span>
            )}
            {submitState === 'error' && (
              <span style={{ fontSize: '.75rem', color: '#DC2626', background: '#FEF2F2', borderRadius: 99, padding: '3px 10px' }}>
                ❌ Gagal simpan
              </span>
            )}
          </div>

          <div
            className="modal-body"
            ref={scrollRef}
            style={{ maxWidth: 560, margin: '0 auto', padding: '24px 20px 80px', overflowY: 'auto' }}
          >
            <OutcomesPanel
              answers={answers}
              hidePricingBanner={true}
              ctaLabel={ctaLabel}
              ctaDisabled={submitState === 'pending'}
              onNext={handleEnterDashboard}
            />
          </div>
        </div>
      </>
    );
  }

  // ── Success / Done Screen ─────────────────────────────────────────────────────
  if (screen === 'done') {
    return (
      <>
        <style>{GATE_CSS}</style>
        <div style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 32, maxWidth: 360 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 12px 36px rgba(45,75,255,0.3)',
            }}>
              <span style={{ fontSize: 36 }}>✅</span>
            </div>
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: '1.4rem', color: '#0F172A', margin: '0 0 10px',
            }}>
              Yeay, selesai! 🎉
            </h2>
            <p style={{ fontSize: '.9rem', color: '#64748B', margin: '0 0 6px' }}>
              Membuka dashboard…
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Error Screen ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GATE_CSS}</style>
      <div style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 32, maxWidth: 360 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
          <h2 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 700,
            fontSize: '1.15rem', color: '#0F172A', margin: '0 0 10px',
          }}>
            Gagal Menyimpan
          </h2>
          <p style={{ fontSize: '.88rem', color: '#EF4444', margin: '0 0 22px', lineHeight: 1.6 }}>
            {errMsg}
          </p>
          <button
            onClick={() => { setScreen('assessment'); setErrMsg(''); setSubmitState('idle'); }}
            style={{
              padding: '13px 28px', borderRadius: 100,
              background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: "'Sora', sans-serif", fontWeight: 700,
              fontSize: '.9rem', width: '100%',
            }}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </>
  );
}