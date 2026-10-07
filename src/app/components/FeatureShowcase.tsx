/**
 * FeatureShowcase — "Lihat MIRA bekerja": the features people don't expect,
 * each played as a short loop inside a phone. The screens are rebuilt from
 * the real app (same copy, colours, icons and flow as AddTransactionModal,
 * VoiceLive, Transaksi → Kalender, Split Bill, Insight and Target), so what
 * the landing shows is exactly what the app does.
 *
 * Auto-advances while the section is on screen; a tap picks a feature and
 * restarts it. With prefers-reduced-motion every demo shows its end state.
 */
import { useEffect, useRef, useState } from 'react';
import './FeatureShowcase.css';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Camera, Check, List, Mic, Sparkles, Square } from 'lucide-react';
import { MiraIcon, type IconName } from './icons/MiraIcon';

const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Step counter driven by a list of timestamps (ms): step = how many have passed. */
function useTimeline(marks: number[]) {
  const [step, setStep] = useState(() => (reduceMotion() ? marks.length : 0));
  useEffect(() => {
    if (reduceMotion()) return;
    const ts = marks.map((m, i) => setTimeout(() => setStep(i + 1), m));
    return () => ts.forEach(clearTimeout);
  }, []);
  return step;
}

const rp = (n: number) => 'Rp' + n.toLocaleString('id-ID');

/* ── 1. Voice: words appear while talking ─────────────────────────── */

const SPOKEN = 'makan siang 35 ribu pakai GoPay terus parkir 5 ribu'.split(' ');

function VoiceDemo() {
  // 0 idle · 1 tap mic · 2..(2+n) words · then done, proses, cards
  const wordStart = 900, wordGap = 330;
  const wordsEnd = wordStart + SPOKEN.length * wordGap;
  const step = useTimeline([400, ...SPOKEN.map((_, i) => wordStart + i * wordGap), wordsEnd + 500, wordsEnd + 1300, wordsEnd + 2600]);
  const words = Math.max(0, Math.min(SPOKEN.length, step - 1));
  const listening = step >= 1 && step <= SPOKEN.length + 1;
  const filled = step >= SPOKEN.length + 2;
  const thinking = step === SPOKEN.length + 3;
  const done = step >= SPOKEN.length + 4;

  return (
    <div className="fx-sheet">
      <div className="fx-sheet-hd">Catat Transaksi</div>
      <div className="fx-seg"><span className="on"><Sparkles size={11} /> Pakai AI</span><span>Manual</span></div>
      {!done ? (
        <>
          {listening ? (
            <div className="fx-vl">
              <div className="fx-vl-top"><i className="fx-dot" />MIRA lagi dengerin… <b>0:0{Math.min(9, 1 + Math.floor(words / 2))}</b></div>
              <div className="fx-vl-text">
                {SPOKEN.slice(0, Math.max(0, words - 1)).join(' ')}{' '}
                <span className="fx-int">{words > 0 ? SPOKEN[words - 1] : ''}</span>
                {words === 0 && <span className="fx-ph">Ngomong aja…</span>}<i className="fx-caret" />
              </div>
              <div className="fx-vl-acts"><span className="fx-btn ghost">Batal</span><span className="fx-btn red"><Square size={9} fill="currentColor" /> Selesai</span></div>
            </div>
          ) : (
            <div className="fx-field">
              <div className="fx-label">Ceritain aja ke MIRA</div>
              <div className={`fx-textarea${filled ? ' filled' : ''}`}>{filled ? SPOKEN.join(' ') : <span className="fx-ph">Misal: kopi 25rb pake gopay…</span>}</div>
            </div>
          )}
          <div className="fx-row">
            <span className="fx-ic"><Camera size={14} /></span>
            <span className={`fx-ic mic${step === 1 ? ' tap' : ''}${listening ? ' rec' : ''}`}>{listening ? <Square size={11} /> : <Mic size={14} />}</span>
            <span className={`fx-btn primary grow${thinking ? ' busy' : ''}${filled && !thinking ? ' pulse' : ''}`}>{thinking ? 'MIRA lagi baca…' : <><Sparkles size={12} /> Proses</>}</span>
          </div>
        </>
      ) : (
        <>
          <div className="fx-label">MIRA nemu 2 transaksi — cek dulu ya</div>
          {[
            { icon: 'noodles' as IconName, t: 'Makan siang', m: 'Makanan · GoPay', a: 35000 },
            { icon: 'scooter' as IconName, t: 'Parkir', m: 'Transport · GoPay', a: 5000 },
          ].map((c, i) => (
            <div className="fx-card fx-pop" style={{ animationDelay: `${i * 140}ms` }} key={c.t}>
              <MiraIcon name={c.icon} size={30} />
              <div className="fx-grow"><b>{c.t}</b><small>{c.m}</small></div>
              <b className="fx-amt">−{rp(c.a)}</b>
            </div>
          ))}
          <span className="fx-btn primary block fx-pop" style={{ animationDelay: '320ms' }}>Simpan 2 transaksi</span>
        </>
      )}
    </div>
  );
}

/* ── 2. Receipt photo → item lines ─────────────────────────────────── */

const RECEIPT = [
  { n: 'Susu UHT 1L', q: 2, p: 18000 },
  { n: 'Beras 5kg', q: 1, p: 75000 },
  { n: 'Telur 1kg', q: 1, p: 29000 },
];

function ReceiptDemo() {
  const step = useTimeline([300, 2300, 2700, 3100, 3500, 4300]);
  const scanning = step >= 1 && step < 2;
  const items = Math.max(0, step - 2);
  return (
    <div className="fx-pad">
      <div className={`fx-receipt${step >= 2 ? ' small' : ''}`}>
        <div className="fx-rc-head">INDOMARET</div>
        <div className="fx-rc-sub">Jl. Kemang Raya · 07/10/26</div>
        {RECEIPT.map((r) => (
          <div className="fx-rc-line" key={r.n}><span>{r.n}{r.q > 1 ? ` x${r.q}` : ''}</span><span>{(r.q * r.p).toLocaleString('id-ID')}</span></div>
        ))}
        <div className="fx-rc-total"><span>TOTAL</span><span>140.000</span></div>
        <div className="fx-rc-sub">QRIS · GoPay</div>
        {scanning && <div className="fx-scan" />}
      </div>
      {step >= 2 && (
        <div className="fx-result fx-pop">
          <div className="fx-res-top">
            <MiraIcon name="shopping-bag" size={36} />
            <div className="fx-grow"><b>Indomaret</b><small>Belanja · GoPay · hari ini</small></div>
            <b className="fx-amt">−Rp140.000</b>
          </div>
          <div className="fx-items-hd"><span>Rincian item</span><span>{RECEIPT.length} item</span></div>
          {RECEIPT.slice(0, items).map((r) => (
            <div className="fx-item fx-pop" key={r.n}>
              <div className="fx-grow"><b>{r.n}</b><small>{r.q} × {rp(r.p)}</small></div>
              <b>{rp(r.q * r.p)}</b>
            </div>
          ))}
          {step >= 6 && <div className="fx-saved fx-pop"><Check size={12} /> Tersimpan — rinciannya bisa diedit kapan aja</div>}
        </div>
      )}
    </div>
  );
}

/* ── 3. Transactions calendar ──────────────────────────────────────── */

// October 2026 starts on a Thursday (Monday-first grid → 3 blanks).
const SPEND: Record<number, number> = { 1: 85, 2: 250, 3: 420, 4: 120, 5: 60, 6: 95, 7: 140, 8: 35, 9: 310, 10: 520, 11: 180 };

function CalendarDemo() {
  const step = useTimeline([200, 2200, 2800]);
  const max = 520;
  return (
    <div className="fx-pad">
      <div className="fx-tx-top">
        <div className="fx-seg2"><span><List size={12} /></span><span className="on"><CalendarDays size={12} /></span></div>
        <b>‹ Oktober 2026 ›</b>
      </div>
      <div className="fx-sum3">
        <div><small>Pengeluaran</small><b>Rp2,2jt</b></div>
        <div><small>Pemasukan</small><b className="g">Rp8jt</b></div>
        <div><small>Selisih</small><b className="g">+Rp5,8jt</b></div>
      </div>
      <div className="fx-cal">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => <i key={d}>{d}</i>)}
        {Array.from({ length: 3 }).map((_, i) => <span key={`b${i}`} className="blank" />)}
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
          const v = SPEND[d] || 0;
          const shown = step >= 1 && v > 0;
          return (
            <span key={d} className={`${d === 10 && step >= 2 ? 'sel' : ''}${d === 11 ? ' today' : ''}`}
              style={{ ['--heat' as string]: shown ? 0.06 + 0.24 * (v / max) : 0, transitionDelay: `${d * 45}ms` }}>
              <em>{d}</em>{shown && <small style={{ transitionDelay: `${d * 45}ms` }}>{v}rb</small>}
            </span>
          );
        })}
      </div>
      {step >= 3 && (
        <div className="fx-list fx-up">
          <div className="fx-day"><span>Sabtu, 10 Okt</span><span>−Rp520.000</span></div>
          <div className="fx-tx"><MiraIcon name="noodles" size={28} /><div className="fx-grow"><b>Iga Bang Mus</b><small>Makan malam · <span className="fx-pill">4 item</span></small></div><b>−Rp385.000</b></div>
          <div className="fx-tx"><MiraIcon name="ticket" size={28} /><div className="fx-grow"><b>CGV</b><small>Hiburan · BCA</small></div><b>−Rp135.000</b></div>
        </div>
      )}
    </div>
  );
}

/* ── 4. Split bill ─────────────────────────────────────────────────── */

const PEOPLE = [{ n: 'Kamu', a: 52000, me: true }, { n: 'Budi', a: 58000 }, { n: 'Adi', a: 46000 }];

function SplitDemo() {
  const step = useTimeline([300, 1700, 2300, 2900, 3600]);
  return (
    <div className="fx-pad">
      <div className="fx-story">
        <div className="fx-label">Ceritain ke MIRA</div>
        <div className="fx-textarea filled small">"Solaria 156rb bertiga sama Budi &amp; Adi. Gua nasgor, Budi mie ayam + es teh, Adi ayam bakar"</div>
        <span className={`fx-btn primary block${step === 1 ? ' busy' : ''}`}>{step === 1 ? 'MIRA lagi ngitung…' : <><Sparkles size={12} /> Bagi pakai MIRA</>}</span>
      </div>
      {step >= 2 && (
        <div className="fx-result fx-pop">
          <div className="fx-res-top"><MiraIcon name="duo" size={34} /><div className="fx-grow"><b>Solaria</b><small>Bagi per item · 3 orang</small></div><b>Rp156.000</b></div>
          {PEOPLE.map((p, i) => (
            <div className={`fx-person${step >= 2 + i ? ' in' : ''}`} key={p.n}>
              <span className={`fx-av${p.me ? ' me' : ''}`}>{p.n[0]}</span>
              <span className="fx-grow">{p.n}{!p.me && <small>jadi piutang</small>}</span>
              <b>{rp(p.a)}</b>
            </div>
          ))}
        </div>
      )}
      {step >= 5 && (
        <div className="fx-note fx-pop">
          <MiraIcon name="money-bag" size={26} />
          <span><b>Piutang aktif:</b> Budi Rp58.000 · Adi Rp46.000 — tinggal tandai lunas pas mereka bayar.</span>
        </div>
      )}
    </div>
  );
}

/* ── 5. Insight against the plan ───────────────────────────────────── */

const DOWS = [{ d: 'Sen', v: 62 }, { d: 'Sel', v: 55 }, { d: 'Rab', v: 70 }, { d: 'Kam', v: 64 }, { d: 'Jum', v: 98 }, { d: 'Sab', v: 300 }, { d: 'Min', v: 140 }];

function InsightDemo() {
  const step = useTimeline([300, 1700, 2600, 3600]);
  return (
    <div className="fx-pad">
      <div className="fx-panel">
        <div className="fx-panel-hd"><b>Pengeluaran bulan ini</b><small>hari ke-11 dari 31</small></div>
        <div className="fx-big">{step >= 1 ? 'Rp1.750.000' : 'Rp0'} <small>dari rencana Rp5.600.000</small></div>
        <div className="fx-plan"><div style={{ width: step >= 1 ? '31%' : '0%' }} /><i style={{ left: '35.5%' }} /></div>
        {step >= 2 && <div className="fx-ok fx-pop">Aman. Perkiraan akhir bulan Rp4.931.818, masih Rp668.182 di bawah rencana. Jatah per hari tersisa Rp183.333.</div>}
      </div>
      <div className="fx-panel">
        <div className="fx-panel-hd"><b>Rata-rata per hari</b><small>6 bulan</small></div>
        <div className="fx-bars">
          {DOWS.map((x, i) => (
            <div key={x.d}>
              <span className={x.d === 'Sab' ? 'peak' : ''} style={{ height: step >= 3 ? `${(x.v / 300) * 100}%` : '4%', transitionDelay: `${i * 70}ms` }} />
              <i>{x.d}</i>
            </div>
          ))}
        </div>
      </div>
      {step >= 4 && (
        <div className="fx-note amber fx-pop">
          <MiraIcon name="calendar-star" size={26} />
          <span><b>Hari paling boros: Sabtu</b> — rata-rata Rp300.000, 3× hari biasa.</span>
        </div>
      )}
    </div>
  );
}

/* ── 6. Target with history ────────────────────────────────────────── */

function GoalDemo() {
  const step = useTimeline([600, 1300, 2600, 3300]);
  const saved = step >= 2 ? 5_700_000 : 4_700_000;
  const pct = (saved / 15_000_000) * 100;
  return (
    <div className="fx-pad">
      <div className="fx-goal">
        <div className="fx-res-top"><MiraIcon name="plane" size={40} /><div className="fx-grow"><b>Liburan ke Jepang</b><small>Target Rp15.000.000</small></div><span className="fx-badge">{Math.round(pct)}%</span></div>
        <div className="fx-plan"><div style={{ width: `${pct}%` }} /></div>
        <div className="fx-goal-amt"><span><b>{rp(saved)}</b> terkumpul</span><small>≈ Rp1,55jt/bulan</small></div>
        <div className="fx-row">
          <span className={`fx-btn green grow${step === 1 ? ' tap' : ''}`}><ArrowDownLeft size={12} /> Nabung</span>
          <span className="fx-btn ghost grow"><ArrowUpRight size={12} /> Ambil</span>
        </div>
      </div>
      <div className="fx-label" style={{ marginTop: 12 }}>Riwayat</div>
      <div className="fx-hist">
        {step >= 2 && <div className="fx-hrow fx-up"><span className="in"><ArrowDownLeft size={12} /></span><div className="fx-grow"><b>Sisa gaji</b><small>7 Okt 2026</small></div><b className="g">+Rp1.000.000</b></div>}
        <div className="fx-hrow"><span className="out"><ArrowUpRight size={12} /></span><div className="fx-grow"><b>Tiket kereta</b><small>21 Sep 2026</small></div><b className="o">−Rp300.000</b></div>
        <div className="fx-hrow"><span className="in"><ArrowDownLeft size={12} /></span><div className="fx-grow"><b>Gajian</b><small>25 Sep 2026</small></div><b className="g">+Rp2.000.000</b></div>
        {step >= 4 && <div className="fx-saved fx-pop">Semua setoran & penarikan tercatat — bisa diedit</div>}
      </div>
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────── */

const FEATURES: { key: string; icon: IconName; title: string; desc: string; ms: number; Demo: () => JSX.Element }[] = [
  { key: 'voice', icon: 'chat', title: 'Ngomong, langsung jadi teks', desc: 'Kata-katamu muncul live saat bicara, lalu AI pecah jadi transaksi lengkap dengan kategori & dompet.', ms: 9600, Demo: VoiceDemo },
  { key: 'receipt', icon: 'receipt', title: 'Foto struk, item kebaca semua', desc: 'Total, toko, metode bayar sampai rincian per barang — tersimpan dan bisa diedit.', ms: 7200, Demo: ReceiptDemo },
  { key: 'calendar', icon: 'calendar-star', title: 'Kalender pengeluaran', desc: 'Lihat hari mana yang paling boros sekilas mata, tap tanggal untuk detailnya.', ms: 6400, Demo: CalendarDemo },
  { key: 'split', icon: 'duo', title: 'Split bill sekali cerita', desc: 'Ceritain siapa makan apa — MIRA bagi per orang dan langsung catat piutangnya.', ms: 7400, Demo: SplitDemo },
  { key: 'insight', icon: 'growth', title: 'Insight dari rencanamu', desc: 'Dibandingkan dengan rencana dari assessment: aman atau kebablasan, plus hari paling boros.', ms: 7000, Demo: InsightDemo },
  { key: 'goal', icon: 'target', title: 'Target dengan riwayat nabung', desc: 'Setiap setoran dan penarikan tercatat, MIRA hitung butuh nabung berapa per bulan.', ms: 6200, Demo: GoalDemo },
];

export function FeatureShowcase({ onCTAClick }: { onCTAClick: () => void }) {
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0); // remounts the demo → replays it
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduce = reduceMotion();

  // Phones show the features as a sideways chip row — keep the active one in view.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.children[active] as HTMLElement | undefined;
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.clientWidth) / 2, behavior: 'smooth' });
  }, [active]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Next feature when this one has played (only while on screen).
  useEffect(() => {
    if (!visible || reduce) return;
    const t = setTimeout(() => { setActive((a) => (a + 1) % FEATURES.length); setRun((r) => r + 1); }, FEATURES[active].ms + 1400);
    return () => clearTimeout(t);
  }, [active, run, visible, reduce]);

  const pick = (i: number) => { setActive(i); setRun((r) => r + 1); };
  const f = FEATURES[active];
  const Demo = f.Demo;

  return (
    <section className="fx-section" id="fitur-canggih" ref={sectionRef}>
      <div className="fx-inner">
        <div className="fx-head">
          <span className="section-label">Fitur Canggih</span>
          <h2 className="section-title">Lihat MIRA kerja beneran</h2>
          <p className="section-desc">Bukan konsep — semua yang di sini ada di aplikasinya dan bisa kamu coba hari ini.</p>
        </div>

        <div className="fx-stage">
          <div className="fx-list-col" role="tablist" aria-label="Fitur MIRA" ref={listRef}>
            {FEATURES.map((x, i) => (
              <button key={x.key} role="tab" aria-selected={i === active} className={`fx-feat${i === active ? ' on' : ''}`} onClick={() => pick(i)}>
                <MiraIcon name={x.icon} size={40} />
                <span className="fx-feat-txt">
                  <b>{x.title}</b>
                  <small>{x.desc}</small>
                </span>
                {i === active && !reduce && visible && (
                  <i className="fx-progress" key={run} style={{ animationDuration: `${x.ms + 1400}ms` }} />
                )}
              </button>
            ))}
          </div>

          <div className="fx-phone-col">
            <div className="fx-phone" aria-hidden="true">
              <div className="fx-screen">
                <div className="fx-island" />
                <div className="fx-status"><b>9:41</b><span className="fx-status-ic"><i /><i /><i /><em /></span></div>
                <div className="fx-app">
                  {visible || reduce ? <Demo key={`${f.key}-${run}`} /> : null}
                </div>
                <div className="fx-home" />
              </div>
            </div>
            <div className="fx-caption">
              <b>{f.title}</b>
              <span>{f.desc}</span>
            </div>
          </div>
        </div>

        <div className="fx-cta">
          <button className="btn btn-lg" onClick={onCTAClick}>Coba semuanya gratis 7 hari →</button>
          <small>Pakai kode <b>MIRA100</b> di halaman paket · tanpa kartu kredit</small>
        </div>
      </div>
    </section>
  );
}
