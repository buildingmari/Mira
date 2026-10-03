/**
 * Financial scoring — ported verbatim from the n8n workflow's "Build Context"
 * code node (same workflow that powers the WhatsApp bot) so the web chat's
 * personalization/insight context matches WhatsApp exactly, not an
 * approximation of it.
 */

export interface FinancialScores {
  income: number;
  spending: number;
  saving: number;
  emergency: number;
  investment: number;
  debt: number;
  total: number;
}

export interface OutcomeCards {
  income: 'OK' | 'WARN' | 'BAD';
  spending: 'OK' | 'WARN' | 'BAD';
  saving: 'OK' | 'WARN' | 'BAD';
  emergency: 'OK' | 'WARN' | 'BAD';
  investment: 'OK' | 'WARN' | 'BAD';
  debt: 'OK' | 'WARN' | 'BAD';
}

export interface ScoringInput {
  income_range?: string | null;
  income_type?: string | null;
  biggest_spend_category?: string | null;
  impulse_buy_frequency?: string | null;
  saving_allocation_pct?: number | string | null;
  saving_goals?: string | null;
  emergency_fund_duration?: string | null;
  investment_status?: string | null;
  debt_status?: string | null;
  paylater_habit?: string | null;
  expense_allocation_pct?: number | string | null;
}

export interface ScoringResult {
  financial_scores: FinancialScores;
  outcome_cards: OutcomeCards;
  daily_safe_limit: number;
  income_monthly_est: number;
}

export function computeFinancialScores(ctx: ScoringInput): ScoringResult {
  let incomeScore = 0;
  const ir = ctx.income_range || '';
  if (ir.includes('> Rp50') || ir.includes('>50')) incomeScore = 15;
  else if (ir.includes('30') && ir.includes('50')) incomeScore = 14;
  else if (ir.includes('20') && ir.includes('30')) incomeScore = 13;
  else if (ir.includes('10') && ir.includes('20')) incomeScore = 11;
  else if (ir.includes('5') && ir.includes('10')) incomeScore = 8;
  else if (ir.includes('3') && ir.includes('5')) incomeScore = 4;
  else if (ir.includes('< Rp3') || ir.includes('<3')) incomeScore = 1;
  const incomeType = (ctx.income_type || '').toLowerCase();
  if (incomeType.includes('tetap') || incomeType.includes('gaji')) incomeScore += 3;
  else if (incomeType.includes('campuran')) incomeScore += 1;

  let spendingScore = 0;
  const bigSpend = (ctx.biggest_spend_category || '').toLowerCase();
  if (bigSpend.includes('makan') || bigSpend.includes('food')) spendingScore = 12;
  else if (bigSpend.includes('keluarga') || bigSpend.includes('family')) spendingScore = 11;
  else if (bigSpend.includes('nongkrong') || bigSpend.includes('lifestyle')) spendingScore = 6;
  else if (bigSpend.includes('online') || bigSpend.includes('belanja') || bigSpend.includes('shopping')) spendingScore = 5;
  else if (bigSpend.includes('tidak') || bigSpend.includes('tanpa')) spendingScore = 3;
  else spendingScore = 7;
  const impulse = (ctx.impulse_buy_frequency || '').toLowerCase();
  if (impulse.includes('almost never') || impulse.includes('hampir tidak') || impulse.includes('jarang')) spendingScore += 3;
  else if (impulse.includes('occasional') || impulse.includes('kadang')) spendingScore += 1;

  let savingScore = 0;
  const savePct = Number(ctx.saving_allocation_pct || 15);
  if (savePct >= 50) savingScore = 15;
  else if (savePct >= 21) savingScore = 10;
  else if (savePct >= 1) savingScore = 5;
  const goals = (ctx.saving_goals || '').toLowerCase();
  if (goals.includes('dana darurat') || goals.includes('pensiun')) savingScore += 3;
  if (goals.includes('rumah') || goals.includes('pendidikan')) savingScore += 2;
  if (goals.length > 3 && !goals.includes('tidak ada')) savingScore += 1;

  let emergencyScore = 0;
  const emDur = (ctx.emergency_fund_duration || '').toLowerCase();
  if (emDur.includes('> 6') || emDur.includes('>6')) emergencyScore = 10;
  else if (emDur.includes('3') && emDur.includes('6')) emergencyScore = 7;
  else if (emDur.includes('1') && emDur.includes('3')) emergencyScore = 4;
  else if (emDur.includes('< 1') || emDur.includes('<1')) emergencyScore = 1;

  let investmentScore = 0;
  const invStatus = (ctx.investment_status || '').toLowerCase();
  if (invStatus.includes('not') || invStatus.includes('tidak')) investmentScore = 0;
  else if (invStatus.includes('occasional') || invStatus.includes('sesekali')) investmentScore = 4;
  else if (invStatus.includes('rutin') || invStatus.includes('routine')) investmentScore = 8;

  let debtScore = 0;
  const debtSt = (ctx.debt_status || '').toLowerCase();
  if (debtSt.includes('tidak ada') || debtSt.includes('none') || debtSt === 'no') debtScore = 13;
  else if (debtSt.includes('ringan') || debtSt.includes('light') || debtSt.includes('ya, ringan')) debtScore = 6;
  else if (debtSt.includes('besar') || debtSt.includes('heavy') || debtSt.includes('cukup besar')) debtScore = 2;
  const plHabit = (ctx.paylater_habit || '').toLowerCase();
  if (plHabit.includes('occasional') || plHabit.includes('sesekali')) debtScore -= 1;
  else if (plHabit.includes('routine') || plHabit.includes('rutin')) debtScore -= 2;
  else if (plHabit.includes('often') || plHabit.includes('sering')) debtScore -= 4;
  debtScore = Math.max(0, Math.min(15, debtScore));

  const totalScore = incomeScore + spendingScore + savingScore + emergencyScore + investmentScore + debtScore;

  const card = (score: number, ok: number, warn: number): 'OK' | 'WARN' | 'BAD' =>
    score >= ok ? 'OK' : score >= warn ? 'WARN' : 'BAD';

  let incomeMonthly = 7500000;
  if (ir.includes('> Rp50') || ir.includes('>50')) incomeMonthly = 60000000;
  else if (ir.includes('30') && ir.includes('50')) incomeMonthly = 40000000;
  else if (ir.includes('20') && ir.includes('30')) incomeMonthly = 25000000;
  else if (ir.includes('10') && ir.includes('20')) incomeMonthly = 15000000;
  else if (ir.includes('5') && ir.includes('10')) incomeMonthly = 7500000;
  else if (ir.includes('3') && ir.includes('5')) incomeMonthly = 4000000;
  else if (ir.includes('< Rp3') || ir.includes('<3')) incomeMonthly = 2500000;
  const expPct = Number(ctx.expense_allocation_pct || 85) / 100;
  const savRatio = Number(ctx.saving_allocation_pct || 15) / 100;
  const expenseRatio = expPct > 0.75 ? 0.75 : expPct > 0.5 ? 0.6 : expPct > 0.3 ? 0.4 : 0.25;
  const remaining = incomeMonthly * (1 - expenseRatio - savRatio);
  const dailySafeLimit = Math.max(0, Math.round(remaining / 20));

  return {
    financial_scores: {
      income: incomeScore, spending: spendingScore, saving: savingScore,
      emergency: emergencyScore, investment: investmentScore, debt: debtScore, total: totalScore,
    },
    outcome_cards: {
      income: card(incomeScore, 12, 7),
      spending: card(spendingScore, 12, 7),
      saving: card(savingScore, 12, 6),
      emergency: card(emergencyScore, 7, 4),
      investment: card(investmentScore, 7, 4),
      debt: card(debtScore, 8, 5),
    },
    daily_safe_limit: dailySafeLimit,
    income_monthly_est: incomeMonthly,
  };
}
