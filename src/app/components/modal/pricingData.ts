import type { IconName } from '../icons/MiraIcon';

export interface PlanDuration {
  id: string;
  label: string;
  /** Highlighted as the best pick (sparkle next to the label). */
  best?: boolean;
  price: number;
  per: string;
  save: string;
  note?: string;
  vsPersonal?: string;
}

/** Voucher that turns signup into a free 7-day trial (vouchers table, 100%). */
export const TRIAL_VOUCHER = 'MIRA100';
export const TRIAL_DURATION = 'trial';
export const TRIAL_DAYS = 7;

export interface Plan {
  name: string;
  icon: IconName;
  desc: string;
  members: number;
  baseMonthly: number;
  durations: PlanDuration[];
}

export const plans: Record<string, Plan> = {
  personal: {
    name: 'Personal',
    icon: 'buddy-happy',
    desc: 'Untuk kamu yang ingin mulai sendiri. Kontrol penuh atas keuangan pribadi.',
    members: 1,
    baseMonthly: 33000,
    // Same prices as RENEWAL_PLANS in supabase/functions/auth-account.
    durations: [
      // Hidden 7-day trial — only reachable through the TRIAL_VOUCHER code,
      // which force-selects it (see PricingPanel.tsx). auth-account's
      // start_trial creates the account; no Midtrans order.
      { id: TRIAL_DURATION, label: 'Trial 7 Hari', price: 0, per: 'Coba semua fitur gratis 7 hari', save: '', vsPersonal: '' },
      { id: '1', label: '1 Bulan', price: 39000, per: 'Rp39.000 / bulan', save: '', vsPersonal: '' },
      { id: '3', label: '3 Bulan', price: 99000, per: '≈ Rp33.000 / bulan', save: 'Hemat 15%', vsPersonal: '' },
      { id: '12', label: 'Tahunan', best: true, price: 249000, per: '≈ Rp20.750 / bulan', save: 'Paling hemat', note: 'Cuma setara harga 1 kopi kekinian', vsPersonal: '' }
    ]
  },
  duo: {
    name: 'Duo',
    icon: 'duo',
    desc: 'Lebih seru bareng pasangan atau sahabat. Pantau keuangan berdua secara bersamaan.',
    members: 2,
    baseMonthly: 16500,
    durations: [
      { id: '3', label: '3 Bulan', price: 99000, per: '≈ Rp16.500 / orang / bulan', save: '', vsPersonal: 'Hemat 28% vs Personal' },
      { id: '6', label: '6 Bulan', price: 179000, per: '≈ Rp14.900 / orang / bulan', save: 'Hemat 10%', vsPersonal: 'Hemat 35% vs Personal' },
      { id: '12', label: '12 Bulan', best: true, price: 349000, per: '≈ Rp14.500 / orang / bulan', save: 'Best Value', note: 'Lebih murah dari parkir mall 1 jam', vsPersonal: 'Hemat 37% vs Personal' }
    ]
  },
  combo: {
    name: 'Combo',
    icon: 'family',
    desc: 'Paket paling lengkap untuk keluarga atau kelompok. Hingga 5 orang, manfaat maksimal.',
    members: 5,
    baseMonthly: 9960,
    durations: [
      { id: '3', label: '3 Bulan', price: 179000, per: '≈ Rp11.900 / orang / bulan', save: '', vsPersonal: 'Hemat 48% vs Personal' },
      { id: '6', label: '6 Bulan', price: 299000, per: '≈ Rp9.970 / orang / bulan', save: 'Hemat 16%', vsPersonal: 'Hemat 57% vs Personal' },
      { id: '12', label: '12 Bulan · BEST DEAL', best: true, price: 599000, per: '≈ Rp9.980 / orang / bulan', save: 'Paling Hemat', note: 'Lebih hemat dari 1x makan fast food', vsPersonal: 'Hemat 57% vs Personal' }
    ]
  }
};
