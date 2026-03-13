/**
 * scoring.ts — Kalkulasi skor assessment MIRA
 *
 * Field key mapping (instruction Q# → actual answer key):
 *   Q1→q1  Q2→q2  Q3→q3  Q4→q5  Q5→q6  Q6→q7
 *   Q7→q10_ratio (expense_allocation_pct, left slider)
 *   Q8→saving% = 100 - q10_ratio
 *   Q9→q11 (no score, only prediction trigger)
 *   Q10→q12  Q11→q13  Q12→q14 (no score)
 *   Q13→q16  Q14→q17
 *   Q15 (jarang/diskon-menarik/saldo-menipis/sehari-hari) → tidak ada di form → bonus/trig = 0
 *   Q18→q21_paylater
 */

export function calcScore(answers: Record<string, any>) {
  let income = 0, expense = 0, spending = 0, saving = 0,
      emergency = 0, investment = 0, debt = 0, behavior = 0;

  // ── Dimensi 1: Income Stability · Maks: 20 ───────────────────────────────
  const incomeBaseMap: Record<string, number> = {
    '<3jt': 1, '3-5jt': 4, '5-10jt': 8, '10-20jt': 11,
    '20-30jt': 13, '30-50jt': 14, '>50jt': 15,
  };
  income += incomeBaseMap[answers.q1] ?? 0;
  // Q2 bonus: tetap→+3, campuran→+1, freelance→+0
  if (answers.q2 === 'tetap') income += 3;
  else if (answers.q2 === 'campuran') income += 1;
  // Q3 bonus: tanggal-tetap→+2, bervariasi→+1, harian→+0
  if (answers.q3 === 'tetap') income += 2;
  else if (answers.q3 === 'bervariasi') income += 1;
  income = Math.min(income, 20);

  // ── Dimensi 2: Expense Pressure · hanya penalti ──────────────────────────
  // Hitung dari COUNT item Q4 (q5, multi-select)
  const q4Count = Array.isArray(answers.q5) ? answers.q5.length : 0;
  if (q4Count >= 5) expense = -3;
  else if (q4Count >= 3) expense = -1;
  else expense = 0;

  // ── Dimensi 3: Spending Control · Maks: 15 ───────────────────────────────
  // Q5 base (q6): makan-jajan→12, kebutuhan-keluarga→11, nongkrong-lifestyle→6,
  //               belanja-online→5, tidak-terasa→3
  const spendBaseMap: Record<string, number> = {
    'makan': 12, 'keluarga': 11, 'lifestyle': 6,
    'belanja-online': 5, 'ga-terasa': 3,
  };
  // Q6 bonus (q7): hampir-tidak-pernah(jarang)→+3, kadang-kadang→+1, sering→+0
  const spendBonusMap: Record<string, number> = {
    'jarang': 3, 'kadang': 1, 'sering': 0, 'sangat-sering': 0,
  };
  spending = (spendBaseMap[answers.q6] ?? 7) + (spendBonusMap[answers.q7] ?? 0);
  spending = Math.min(spending, 15);

  // ── Dimensi 4: Saving Discipline · Maks: 15 ──────────────────────────────
  // Q7 (q10_ratio = expense_allocation_pct) → base score
  const expPct = answers.q10_ratio ?? 70;
  const savPct = 100 - expPct; // saving_allocation_pct
  let savBase: number;
  if (expPct < 30) savBase = 12;
  else if (expPct < 50) savBase = 9;
  else if (expPct < 70) savBase = 5;
  else savBase = 2;
  // Q8 (saving_allocation_pct) → bonus
  let savBonus: number;
  if (savPct >= 30) savBonus = 3;
  else if (savPct >= 20) savBonus = 2;
  else if (savPct >= 10) savBonus = 1;
  else savBonus = 0;
  // PENTING: Q9 (q11 saving_goals) TIDAK ada efek skor — hanya trigger prediksi
  saving = Math.min(savBase + savBonus, 15);

  // ── Dimensi 5: Emergency Resilience · Maks: 10 ───────────────────────────
  const emMap: Record<string, number> = {
    'tidak-ada': 0, '<1': 1, '1-3': 4, '3-6': 7, '>6': 10,
  };
  emergency = emMap[answers.q12] ?? 0;

  // ── Dimensi 6: Investment Readiness · Maks: 10 ───────────────────────────
  // Q11 base (q13): tidak→0, ya-sesekali→4, ya-rutin→8
  const invBaseMap: Record<string, number> = { 'tidak': 0, 'sesekali': 4, 'rutin': 8 };
  // Q15 (trigger pembelian) tidak ada di form → bonus = 0
  // Q12 (q14 instrumen) = kontekstual, tidak ada efek skor
  investment = Math.min(10, invBaseMap[answers.q13] ?? 0); // Bug #6 fix: clamp to 10

  // ── Dimensi 7: Debt Risk · Maks: 13 · Floor: 0 ───────────────────────────
  // RUMUS WAJIB: max(0, min(13, debtBase - (4 - plMap) + trigMap))
  const debtBaseMap: Record<string, number> = {
    'tidak': 13, 'ringan': 6, 'besar': 2,
  };
  const plValMap: Record<string, number> = {
    'tidak': 4, 'sesekali': 3, 'terkontrol': 2, 'menumpuk': 0,
  };
  // Q15 trigMap tidak ada di form → 0
  const debtBaseVal = debtBaseMap[answers.q16] ?? 6;
  const plVal = plValMap[answers.q17] ?? 2;
  const trigMap = 0;
  debt = Math.max(0, Math.min(13, debtBaseVal - (4 - plVal) + trigMap)); // Bug #3 fix

  // ── Dimensi 8: Behavioral Risk · hanya penalti ───────────────────────────
  // Q18 (q21_paylater): -2 jika ada item selain 'tidak-ada'
  const paylaterActive = Array.isArray(answers.q21_paylater) ? answers.q21_paylater : [];
  behavior = paylaterActive.some((v: string) => v !== 'tidak-ada') ? -2 : 0;

  // ── Total ─────────────────────────────────────────────────────────────────
  const total = Math.round(
    income + expense + spending + saving + emergency + investment + debt + behavior
  );
  return {
    total: Math.min(Math.max(total, 0), 100),
    dims: { income, expense, spending, saving, emergency, investment, debt, behavior },
  };
}

export function getIncomeMonthly(answers: Record<string, any>): number {
  const m: Record<string, number> = {
    '<3jt': 2500000,
    '3-5jt': 4000000,
    '5-10jt': 7500000,
    '10-20jt': 15000000,
    '20-30jt': 25000000,
    '30-50jt': 40000000,
    '>50jt': 60000000,
  };
  return m[answers.q1] || 5000000;
}

export function calcDailyLimit(_income: number, answers: Record<string, any>): number {
  // Ambil batas bawah bracket penghasilan dari Q1 (q1)
  const incomeLowerBound: Record<string, number> = {
    '<3jt':    0,
    '3-5jt':   3000000,
    '5-10jt':  5000000,
    '10-20jt': 10000000,
    '20-30jt': 20000000,
    '30-50jt': 30000000,
    '>50jt':   50000000,
  };
  const lowerBound = incomeLowerBound[answers.q1] ?? 0;

  // expenseRatio dari slider Q7 → q10_ratio (expense_allocation_pct, 0–100)
  const expensePct = Number(answers.q10_ratio ?? 70) / 100;

  // R1 = batas bawah penghasilan dikurangi porsi pengeluaran wajib, dibulatkan ke atas
  const R1 = Math.ceil(lowerBound - (expensePct * lowerBound));

  // Batas aman = R1 / 25
  const rawLimit = R1 / 25;

  // Floor: minimum Rp30.000; jika >= 30.000 → round up ke kelipatan 5.000 terdekat
  if (rawLimit < 30000) return 30000;
  return Math.ceil(rawLimit / 5000) * 5000;
}