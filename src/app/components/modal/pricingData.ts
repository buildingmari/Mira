export interface PlanDuration {
  id: string;
  label: string;
  price: number;
  per: string;
  save: string;
  note?: string;
  vsPersonal?: string;
}

export interface Plan {
  name: string;
  icon: string;
  desc: string;
  members: number;
  baseMonthly: number;
  durations: PlanDuration[];
}

export const plans: Record<string, Plan> = {
  personal: {
    name: 'Personal',
    icon: '👤',
    desc: 'Untuk kamu yang ingin mulai sendiri. Kontrol penuh atas keuangan pribadi.',
    members: 1,
    baseMonthly: 23000,
    durations: [
      { id: '3', label: '3 Bulan', price: 69000, per: '≈ Rp23.000 / bulan', save: '', vsPersonal: '' },
      { id: '6', label: '6 Bulan', price: 109000, per: '≈ Rp18.000 / bulan', save: 'Hemat 22%', vsPersonal: '' },
      { id: '12', label: '12 Bulan ⭐', price: 199000, per: '≈ Rp16.500 / bulan', save: 'Hemat 28%', note: 'Cuma setara harga 1 kopi kekinian', vsPersonal: '' }
    ]
  },
  duo: {
    name: 'Duo',
    icon: '👥',
    desc: 'Lebih seru bareng pasangan atau sahabat. Pantau keuangan berdua secara bersamaan.',
    members: 2,
    baseMonthly: 16500,
    durations: [
      { id: '3', label: '3 Bulan', price: 99000, per: '≈ Rp16.500 / orang / bulan', save: '', vsPersonal: 'Hemat 28% vs Personal' },
      { id: '6', label: '6 Bulan', price: 179000, per: '≈ Rp14.900 / orang / bulan', save: 'Hemat 10%', vsPersonal: 'Hemat 35% vs Personal' },
      { id: '12', label: '12 Bulan ⭐', price: 349000, per: '≈ Rp14.500 / orang / bulan', save: 'Best Value', note: 'Lebih murah dari parkir mall 1 jam', vsPersonal: 'Hemat 37% vs Personal' }
    ]
  },
  combo: {
    name: 'Combo',
    icon: '🔥',
    desc: 'Paket paling lengkap untuk keluarga atau kelompok. Hingga 5 orang, manfaat maksimal.',
    members: 5,
    baseMonthly: 9960,
    durations: [
      { id: '3', label: '3 Bulan', price: 179000, per: '≈ Rp11.900 / orang / bulan', save: '', vsPersonal: 'Hemat 48% vs Personal' },
      { id: '6', label: '6 Bulan', price: 299000, per: '≈ Rp9.970 / orang / bulan', save: 'Hemat 16%', vsPersonal: 'Hemat 57% vs Personal' },
      { id: '12', label: '12 Bulan ⭐ BEST DEAL', price: 599000, per: '≈ Rp9.980 / orang / bulan', save: 'Paling Hemat', note: 'Lebih hemat dari 1x makan fast food', vsPersonal: 'Hemat 57% vs Personal' }
    ]
  }
};
