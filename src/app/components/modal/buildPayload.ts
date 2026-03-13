import { calcScore, getIncomeMonthly } from './scoring';
import { plans } from './pricingData';

// ─── Label maps (raw value → readable label) ─────────────────────────────────

const MAP_INCOME_RANGE: Record<string, string> = {
  '<3jt'   : '< Rp3 million',
  '3-5jt'  : 'Rp3–5 million',
  '5-10jt' : 'Rp5–10 million',
  '10-20jt': 'Rp10–20 million',
  '20-30jt': 'Rp20–30 million',
  '30-50jt': 'Rp30–50 million',
  '>50jt'  : 'Rp50 million+',
};

const MAP_INCOME_TYPE: Record<string, string> = {
  tetap    : 'Fixed monthly',
  freelance: 'Variable / freelance',
  campuran : 'Mixed',
};

const MAP_PAYDAY_TYPE: Record<string, string> = {
  tetap     : 'Fixed date',
  bervariasi: 'Varies',
  harian    : 'Daily / weekly',
};

const MAP_MANDATORY_EXPENSES: Record<string, string> = {
  sewa      : 'Rent / mortgage',
  listrik   : 'Electricity & utilities',
  transport : 'Work transportation',
  asuransi  : 'Insurance',
  cicilan   : 'Debt installments',
  tanggungan: 'Family dependents',
};

const MAP_BIGGEST_SPEND: Record<string, string> = {
  makan          : 'Food & daily snacks',
  lifestyle      : 'Hangout & lifestyle',
  'belanja-online': 'Online shopping',
  keluarga       : 'Family needs',
  'ga-terasa'    : 'Unknown / unnoticed',
};

const MAP_IMPULSE_FREQ: Record<string, string> = {
  jarang        : 'Almost never',
  kadang        : 'Sometimes',
  sering        : 'Often',
  'sangat-sering': 'Very often',
};

const MAP_SAVING_GOALS: Record<string, string> = {
  darurat   : 'Emergency fund',
  rumah     : 'Buy a house',
  mobil     : 'Buy a vehicle',
  menikah   : 'Marriage',
  pendidikan: 'Education',
  liburan   : 'Dream vacation',
  pensiun   : 'Retirement fund',
  bisnis    : 'Business capital',
  gadget    : 'Gadget / wishlist item',
  'tidak-ada': 'No specific goal',
};

const MAP_EMERGENCY_FUND: Record<string, string> = {
  'tidak-ada': 'No emergency fund',
  '<1'       : '< 1 month',
  '1-3'      : '1–3 months',
  '3-6'      : '3–6 months',
  '>6'       : '> 6 months',
};

const MAP_INVEST_STATUS: Record<string, string> = {
  tidak   : 'Not investing',
  sesekali: 'Yes, occasionally',
  rutin   : 'Yes, regularly',
};

const MAP_INVEST_INSTRUMENTS: Record<string, string> = {
  reksa   : 'Mutual funds',
  saham   : 'Stocks',
  emas    : 'Gold',
  crypto  : 'Crypto',
  properti: 'Property',
  bisnis  : 'Business',
  tidak   : 'None',
};

const MAP_DEBT_STATUS: Record<string, string> = {
  tidak : 'No active debt',
  ringan: 'Yes, light',
  besar : 'Yes, substantial',
};

const MAP_PAYLATER_HABIT: Record<string, string> = {
  tidak     : 'Never',
  sesekali  : 'Occasionally',
  terkontrol: 'Regularly but controlled',
  menumpuk  : 'Often & accumulating',
};

const MAP_BANK: Record<string, string> = {
  bri          : 'BRI', mandiri: 'Mandiri', bni: 'BNI', btn: 'BTN',
  bca          : 'BCA', cimb: 'CIMB Niaga', danamon: 'Danamon',
  permata      : 'Permata Bank', ocbc: 'OCBC NISP', panin: 'Panin Bank',
  maybank      : 'Maybank', mega: 'Mega Bank', sinarmas: 'Sinarmas',
  bsi          : 'BSI', 'cimb-syariah': 'CIMB Syariah',
  jago         : 'Bank Jago', jenius: 'Jenius (BTPN)', seabank: 'SeaBank',
  blu          : 'Blu by BCA', neo: 'Neo Bank (Neo+)',
};

const MAP_EWALLET: Record<string, string> = {
  gopay    : 'GoPay', ovo: 'OVO', dana: 'DANA',
  shopeepay: 'ShopeePay', linkaja: 'LinkAja',
  astrapay : 'AstraPay', lainnya: 'Others',
};

const MAP_PAYLATER_ACTIVE: Record<string, string> = {
  'cc-bank'  : 'Bank credit card',
  kredivo    : 'Kredivo',
  akulaku    : 'Akulaku',
  spaylater  : 'SPayLater',
  gopaylater : 'GoPayLater',
  traveloka  : 'Traveloka PayLater',
  'tidak-ada': 'None',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapVal(val: any, map: Record<string, string>): string {
  return map[val] || val || '-';
}

/** Works for string[] and also RankItem[] { v, l } */
function mapArr(arr: any, map: Record<string, string>): string {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return arr
    .map((item: any) => {
      const key = typeof item === 'object' && item !== null ? item.v : item;
      return map[key] || map[String(item)] || String(key);
    })
    .join(', ');
}

function rawArr(arr: any): string {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return arr
    .map((item: any) =>
      typeof item === 'object' && item !== null ? item.v : String(item)
    )
    .join(', ');
}

/** For RankItem[] → "GoPay > DANA > BCA" */
function rankingLabel(arr: any): string {
  if (!Array.isArray(arr) || arr.length === 0) return '-';
  return arr
    .map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        // Strip leading emoji for cleaner output
        return item.l?.replace(/^[^\w\u00C0-\u024F]+/, '').trim() || item.v;
      }
      return String(item);
    })
    .join(' > ');
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildPayload(params: {
  phones           : string[];
  nama             : string;
  selectedPlan     : string;
  selectedDuration : string;
  voucherDiscount  : number;
  activeVoucher    : string;
  finalAmount      : number;
  answers          : Record<string, any>;
}) {
  const {
    phones, nama, selectedPlan, selectedDuration,
    voucherDiscount, activeVoucher, finalAmount, answers,
  } = params;

  const plan     = plans[selectedPlan];
  const duration = plan.durations.find((d) => d.id === selectedDuration);
  const score    = calcScore(answers);
  const { dims } = score;

  const expense_pct = answers.q10_ratio ?? 80;
  const saving_pct  = 100 - expense_pct;

  return {
    // ── Registrant ──────────────────────────────────────────────────
    full_name                : nama || '-',
    primary_phone            : phones[0] || '-',
    additional_phones        : phones.slice(1).join(', ') || '-',
    total_phones             : phones.length,

    // ── Subscription plan ───────────────────────────────────────────
    plan_id                  : selectedPlan,
    plan_name                : plan.name,
    plan_duration_months     : selectedDuration,
    plan_duration_label      : duration?.label || selectedDuration,
    price_original           : duration?.price || 0,
    voucher_code             : activeVoucher || '-',
    voucher_discount_percent : voucherDiscount,
    price_final              : finalAmount,

    // ── Financial health scores ─────────────────────────────────────
    score_total              : score.total,
    score_income_stability   : Math.round(dims.income),
    score_expense_pressure   : Math.round(dims.expense),
    score_spending_control   : Math.round(dims.spending),
    score_saving_discipline  : Math.round(dims.saving),
    score_emergency_fund     : Math.round(dims.emergency),
    score_investment         : Math.round(dims.investment),
    score_debt               : Math.round(dims.debt),
    score_behavior           : Math.round(dims.behavior),

    // ── Income ──────────────────────────────────────────────────────
    income_range             : mapVal(answers.q1, MAP_INCOME_RANGE),
    income_range_raw         : answers.q1 || '-',
    income_estimated_idr     : getIncomeMonthly(answers),
    income_type              : mapVal(answers.q2, MAP_INCOME_TYPE),
    income_type_raw          : answers.q2 || '-',
    payday_pattern           : mapVal(answers.q3, MAP_PAYDAY_TYPE),
    payday_pattern_raw       : answers.q3 || '-',

    // ── Mandatory expenses ──────────────────────────────────────────
    mandatory_expenses       : mapArr(answers.q5, MAP_MANDATORY_EXPENSES),
    mandatory_expenses_raw   : rawArr(answers.q5),
    mandatory_expense_count  : Array.isArray(answers.q5) ? answers.q5.length : 0,

    // ── Spending behaviour ──────────────────────────────────────────
    biggest_spend_category   : mapVal(answers.q6, MAP_BIGGEST_SPEND),
    biggest_spend_raw        : answers.q6 || '-',
    impulse_buy_frequency    : mapVal(answers.q7, MAP_IMPULSE_FREQ),
    impulse_buy_raw          : answers.q7 || '-',

    // ── Savings ─────────────────────────────────────────────────────
    expense_allocation_pct   : expense_pct,
    saving_allocation_pct    : saving_pct,
    saving_goals             : mapArr(answers.q11, MAP_SAVING_GOALS),
    saving_goals_raw         : rawArr(answers.q11),

    // ── Emergency fund ──────────────────────────────────────────────
    emergency_fund_duration  : mapVal(answers.q12, MAP_EMERGENCY_FUND),
    emergency_fund_raw       : answers.q12 || '-',

    // ── Investment ──────────────────────────────────────────────────
    investment_status        : mapVal(answers.q13, MAP_INVEST_STATUS),
    investment_status_raw    : answers.q13 || '-',
    investment_instruments   : mapArr(answers.q14, MAP_INVEST_INSTRUMENTS),
    investment_instruments_raw: rawArr(answers.q14),

    // ── Debt & credit ───────────────────────────────────────────────
    debt_status              : mapVal(answers.q16, MAP_DEBT_STATUS),
    debt_status_raw          : answers.q16 || '-',
    paylater_habit           : mapVal(answers.q17, MAP_PAYLATER_HABIT),
    paylater_habit_raw       : answers.q17 || '-',

    // ── Banking & payment methods ───────────────────────────────────
    banks_used               : mapArr(answers.q19_bank, MAP_BANK),
    banks_used_raw           : rawArr(answers.q19_bank),
    ewallets_used            : mapArr(answers.q20_ewallet, MAP_EWALLET),
    ewallets_used_raw        : rawArr(answers.q20_ewallet),
    paylater_active          : mapArr(answers.q21_paylater, MAP_PAYLATER_ACTIVE),
    paylater_active_raw      : rawArr(answers.q21_paylater),
    payment_method_ranking   : rankingLabel(answers.q22_rank),

    // ── Metadata ────────────────────────────────────────────────────
    submitted_at             : new Date().toISOString(),
    source                   : 'mira-landing-web',
  };
}