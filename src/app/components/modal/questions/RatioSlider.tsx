import { useState, useEffect, useRef } from 'react';
import './Questions.css';

interface RatioSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function getRatioHint(spendPct: number) {
  if (spendPct <= 40) return '🏆 Luar biasa! Tabunganmu sangat tinggi';
  if (spendPct <= 55) return '✅ Bagus! Proporsi tabunganmu sehat';
  if (spendPct <= 70) return '🟡 Masih oke, tapi coba naikkan tabungan';
  if (spendPct <= 85) return '🟠 Tabungan terlalu kecil, perlu diperbaiki';
  return '🔴 Hampir semua habis untuk pengeluaran';
}

export function RatioSlider({ value, onChange }: RatioSliderProps) {
  const [spendPct, setSpendPct] = useState(value);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const savePct = 100 - spendPct;

  const updateValue = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    let pct = Math.round(((clientX - rect.left) / rect.width) * 100);
    pct = Math.max(10, Math.min(90, pct));
    setSpendPct(pct);
    onChange(pct);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) updateValue(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragging) updateValue(e.touches[0].clientX);
    };

    const handleEnd = () => setDragging(false);

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [dragging]);

  return (
    <div className="ratio-slider-wrap">
      <div className="ratio-values">
        <div>
          <div className="ratio-val spend">{spendPct}%</div>
          <div style={{ fontSize: '0.76rem', color: '#EF4444' }}>Pengeluaran</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>vs</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="ratio-val save">{savePct}%</div>
          <div style={{ fontSize: '0.76rem', color: '#16A34A' }}>Tabungan</div>
        </div>
      </div>
      <div
        className="ratio-track"
        ref={trackRef}
        onMouseDown={(e) => {
          setDragging(true);
          updateValue(e.clientX);
        }}
        onTouchStart={(e) => {
          setDragging(true);
          updateValue(e.touches[0].clientX);
        }}
      >
        <div className="ratio-fill-left" style={{ width: `${spendPct}%` }} />
        <div className="ratio-fill-right" style={{ width: `${savePct}%` }} />
        <div className="ratio-handle" style={{ left: `${spendPct}%` }} />
      </div>
      <div className="ratio-labels">
        <span className="ratio-label-spend">🔴 Pengeluaran</span>
        <span className="ratio-label-save">Tabungan 🟢</span>
      </div>
      <div className="ratio-center-label">{getRatioHint(spendPct)}</div>
    </div>
  );
}
