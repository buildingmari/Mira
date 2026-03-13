import { useState, useEffect } from 'react';
import './Questions.css';

interface RankItem {
  v: string;
  l: string;
}

interface RankingQuestionProps {
  answers: Record<string, any>;
  value: RankItem[] | undefined;
  onChange: (value: RankItem[]) => void;
}

function buildRankItems(answers: Record<string, any>): RankItem[] {
  const items: RankItem[] = [];
  const banks   = answers.q19_bank    || [];
  const ewallets = answers.q20_ewallet || [];
  const paylater = answers.q21_paylater || [];

  // ── Bank: semua bank individual (tidak digabung) ──────────────────
  const BANK_MAP: Record<string, string> = {
    bri          : '💳 BRI',
    mandiri      : '💳 Mandiri',
    bni          : '💳 BNI',
    btn          : '💳 BTN',
    bca          : '💳 BCA',
    cimb         : '🏦 CIMB Niaga',
    danamon      : '🏦 Danamon',
    permata      : '🏦 Permata Bank',
    ocbc         : '🏦 OCBC NISP',
    panin        : '🏦 Panin Bank',
    maybank      : '🏦 Maybank',
    mega         : '🏦 Mega Bank',
    sinarmas     : '🏦 Sinarmas',
    bsi          : '🕌 BSI',
    'cimb-syariah': '🕌 CIMB Syariah',
    jago         : '📱 Bank Jago',
    jenius       : '📱 Jenius (BTPN)',
    seabank      : '📱 SeaBank',
    blu          : '📱 Blu by BCA',
    neo          : '📱 Neo Bank',
  };
  banks.forEach((b: string) => {
    if (BANK_MAP[b]) items.push({ v: b, l: BANK_MAP[b] });
  });

  // ── E-wallet ─────────────────────────────────────────────────────
  const EWALLET_MAP: Record<string, string> = {
    gopay    : '🟢 GoPay',
    ovo      : '🟣 OVO',
    dana     : '🔵 DANA',
    shopeepay: '🟠 ShopeePay',
    linkaja  : '🔴 LinkAja',
    astrapay : '🔷 AstraPay',
    lainnya  : '➕ E-wallet lainnya',
  };
  ewallets.forEach((e: string) => {
    if (EWALLET_MAP[e]) items.push({ v: e, l: EWALLET_MAP[e] });
  });

  // ── PayLater / Kartu Kredit ───────────────────────────────────────
  const PAYLATER_MAP: Record<string, string> = {
    'cc-bank'  : '💳 Kartu Kredit',
    kredivo    : '🔵 Kredivo',
    akulaku    : '🟡 Akulaku',
    spaylater  : '🟠 SPayLater',
    gopaylater : '🟢 GoPayLater',
    traveloka  : '🔷 Traveloka PayLater',
  };
  paylater.forEach((p: string) => {
    if (PAYLATER_MAP[p]) items.push({ v: p, l: PAYLATER_MAP[p] });
  });

  // Fallback jika tidak ada yang dipilih sama sekali
  if (items.length === 0) {
    return [
      { v: 'tunai',  l: '💵 Tunai' },
      { v: 'debit',  l: '💳 Kartu Debit' },
      { v: 'ewallet', l: '📱 E-wallet' },
    ];
  }

  return items; // tidak dibatasi — tampilkan semua yang dipilih
}

export function RankingQuestion({ answers, value, onChange }: RankingQuestionProps) {
  const initialItems = value || buildRankItems(answers);
  const [items, setItems] = useState<RankItem[]>(initialItems);
  const [moved, setMoved] = useState<string | null>(null);

  useEffect(() => {
    onChange(items);
  }, [items]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    setMoved(newItems[index - 1].v);
    setTimeout(() => setMoved(null), 400);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    setMoved(newItems[index + 1].v);
    setTimeout(() => setMoved(null), 400);
  };

  return (
    <div>
      <div className="rank-list">
        {items.map((item, i) => (
          <div
            key={item.v}
            className={`rank-item ${moved === item.v ? 'rank-moved' : ''}`}
          >
            <span className="rank-num">{i + 1}</span>
            <span className="rank-text">{item.l}</span>
            <div className="rank-btns">
              <button
                className="rank-btn"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                aria-label="Naikan"
                title="Naikan"
              >
                ▲
              </button>
              <button
                className="rank-btn"
                onClick={() => moveDown(i)}
                disabled={i === items.length - 1}
                aria-label="Turunkan"
                title="Turunkan"
              >
                ▼
            </button>
            </div>
          </div>
        ))}
      </div>
      <div className="rank-hint">
        💡 Ketuk ▲ ▼ untuk mengubah urutan dari yang paling sering dipakai
      </div>
    </div>
  );
}