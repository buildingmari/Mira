import type { BrandKey, IconName } from '../icons/MiraIcon';

export interface QuestionOption {
  v: string;
  l: string;
  /** MIRA icon shown on the option card (see components/icons/MiraIcon). */
  icon?: IconName;
  /** E-wallet / PayLater monogram instead of an icon. */
  brand?: BrandKey;
}

export interface QuestionGroup {
  label: string;
  icon?: IconName;
  opts: QuestionOption[];
}

export interface Question {
  id: string;
  num: number;
  label: string;
  icon?: IconName;
  type: 'radio' | 'checkbox' | 'ratio_slider' | 'checkbox_grouped' | 'ranking';
  opts?: QuestionOption[];
  groups?: QuestionGroup[];
}

export interface Step {
  tag: string;
  title: string;
  desc: string;
  questions: Question[];
}

export const steps: Step[] = [
  {
    tag: 'Step 1 — Pemasukan',
    title: 'Stabilitas Penghasilan',
    desc: 'Bantu MIRA kenali kondisi keuangan kamu',
    questions: [
      {
        id: 'q1',
        num: 1,
        label: 'Rata-rata penghasilan bulanan kamu',
        icon: 'cash',
        type: 'radio',
        opts: [
          { v: '<3jt', l: '< Rp3 juta' },
          { v: '3-5jt', l: 'Rp3–5 juta' },
          { v: '5-10jt', l: 'Rp5–10 juta' },
          { v: '10-20jt', l: 'Rp10–20 juta' },
          { v: '20-30jt', l: 'Rp20–30 juta' },
          { v: '30-50jt', l: 'Rp30–50 juta' },
          { v: '>50jt', l: 'Rp50 juta+' }
        ]
      },
      {
        id: 'q2',
        num: 2,
        label: 'Jenis pemasukan kamu',
        icon: 'calendar-coin',
        type: 'radio',
        opts: [
          { v: 'tetap', l: 'Tetap tiap bulan', icon: 'calendar-check' },
          { v: 'freelance', l: 'Tidak tetap / freelance', icon: 'laptop' },
          { v: 'campuran', l: 'Campuran', icon: 'cycle-coin' }
        ]
      },
      {
        id: 'q3',
        num: 3,
        label: 'Biasanya tanggal menerima pemasukan',
        icon: 'calendar-star',
        type: 'radio',
        opts: [
          { v: 'tetap', l: 'Tanggal tetap', icon: 'calendar-pin' },
          { v: 'bervariasi', l: 'Bervariasi', icon: 'dice' },
          { v: 'harian', l: 'Harian / mingguan', icon: 'coin-drops' }
        ]
      }
    ]
  },
  {
    tag: 'Step 2 — Kewajiban',
    title: 'Beban & Pengeluaran Wajib',
    desc: 'Seberapa besar beban finansial tetap kamu?',
    questions: [
      {
        id: 'q5',
        num: 4,
        label: 'Apa saja pengeluaran wajib kamu? (pilih semua yang sesuai)',
        icon: 'house',
        type: 'checkbox',
        opts: [
          { v: 'sewa', l: 'Sewa / cicilan rumah', icon: 'house' },
          { v: 'listrik', l: 'Listrik & utilitas', icon: 'bulb' },
          { v: 'transport', l: 'Transportasi kerja', icon: 'scooter' },
          { v: 'asuransi', l: 'Asuransi', icon: 'shield' },
          { v: 'cicilan', l: 'Cicilan hutang', icon: 'card-clock' },
          { v: 'tanggungan', l: 'Tanggungan keluarga', icon: 'family' }
        ]
      }
    ]
  },
  {
    tag: 'Step 3 — Pengeluaran',
    title: 'Pola Belanja & Kebiasaan',
    desc: 'Deteksi kebocoran dan perilaku impulsif',
    questions: [
      {
        id: 'q6',
        num: 5,
        label: 'Uang paling sering habis untuk',
        icon: 'buddy-think',
        type: 'radio',
        opts: [
          { v: 'makan', l: 'Makan & jajan harian', icon: 'noodles' },
          { v: 'lifestyle', l: 'Nongkrong & lifestyle', icon: 'iced-drink' },
          { v: 'belanja-online', l: 'Belanja online', icon: 'shopping-bag' },
          { v: 'keluarga', l: 'Kebutuhan keluarga', icon: 'family' },
          { v: 'ga-terasa', l: 'Tidak terasa habis', icon: 'leaky-wallet' }
        ]
      },
      {
        id: 'q7',
        num: 6,
        label: 'Seberapa sering belanja impulsif saat promo?',
        icon: 'cart',
        type: 'radio',
        opts: [
          { v: 'jarang', l: 'Hampir tidak pernah', icon: 'buddy-angel' },
          { v: 'kadang', l: 'Kadang-kadang', icon: 'buddy-shrug' },
          { v: 'sering', l: 'Sering', icon: 'buddy-sweat' },
          { v: 'sangat-sering', l: 'Sangat sering', icon: 'buddy-grimace' }
        ]
      }
    ]
  },
  {
    tag: 'Step 4 — Tabungan',
    title: 'Disiplin Menabung',
    desc: 'Seberapa konsisten kamu menyisihkan uang?',
    questions: [
      {
        id: 'q10_ratio',
        num: 7,
        label: 'Dari penghasilanmu, berapa porsi untuk pengeluaran vs tabungan?',
        icon: 'scale',
        type: 'ratio_slider'
      },
      {
        id: 'q11',
        num: 8,
        label: 'Tujuan tabungan / keinginan kamu (pilih semua yang sesuai)',
        icon: 'target',
        type: 'checkbox',
        opts: [
          { v: 'darurat', l: 'Dana darurat', icon: 'siren' },
          { v: 'rumah', l: 'Beli rumah', icon: 'dream-house' },
          { v: 'mobil', l: 'Beli kendaraan', icon: 'car' },
          { v: 'menikah', l: 'Menikah', icon: 'ring' },
          { v: 'pendidikan', l: 'Pendidikan anak / diri sendiri', icon: 'grad-cap' },
          { v: 'liburan', l: 'Liburan impian', icon: 'plane' },
          { v: 'pensiun', l: 'Dana pensiun', icon: 'buddy-grandpa' },
          { v: 'bisnis', l: 'Modal usaha / bisnis', icon: 'shop' },
          { v: 'gadget', l: 'Gadget / barang keinginan', icon: 'gadget' },
          { v: 'tidak-ada', l: 'Tidak ada tujuan khusus', icon: 'buddy-shrug' }
        ]
      }
    ]
  },
  {
    tag: 'Step 5 — Dana Darurat',
    title: 'Ketahanan Finansial',
    desc: 'Seberapa siap kamu menghadapi situasi darurat?',
    questions: [
      {
        id: 'q12',
        num: 9,
        label: 'Jika pemasukan berhenti, dana darurat kamu cukup untuk:',
        icon: 'siren',
        type: 'radio',
        opts: [
          { v: '<1', l: '< 1 bulan', icon: 'buddy-worried' },
          { v: '1-3', l: '1–3 bulan', icon: 'buddy-meh' },
          { v: '3-6', l: '3–6 bulan', icon: 'buddy-happy' },
          { v: '>6', l: '> 6 bulan', icon: 'buddy-strong' },
          { v: 'tidak-ada', l: 'Tidak punya dana darurat', icon: 'empty-jar' }
        ]
      }
    ]
  },
  {
    tag: 'Step 6 — Investasi',
    title: 'Kesiapan Berinvestasi',
    desc: 'Apakah kamu sudah membangun aset untuk masa depan?',
    questions: [
      {
        id: 'q13',
        num: 10,
        label: 'Apakah kamu berinvestasi saat ini?',
        icon: 'growth',
        type: 'radio',
        opts: [
          { v: 'tidak', l: 'Tidak', icon: 'seed' },
          { v: 'sesekali', l: 'Ya, sesekali', icon: 'sprout' },
          { v: 'rutin', l: 'Ya, rutin', icon: 'coin-tree' }
        ]
      },
      {
        id: 'q14',
        num: 11,
        label: 'Instrumen investasi yang digunakan (pilih semua yang sesuai)',
        icon: 'briefcase',
        type: 'checkbox',
        opts: [
          { v: 'reksa', l: 'Reksa dana', icon: 'pie' },
          { v: 'saham', l: 'Saham', icon: 'candles' },
          { v: 'emas', l: 'Emas', icon: 'gold' },
          { v: 'crypto', l: 'Crypto', icon: 'crypto' },
          { v: 'properti', l: 'Properti', icon: 'building' },
          { v: 'bisnis', l: 'Bisnis', icon: 'shop' },
          { v: 'tidak', l: 'Tidak ada', icon: 'empty-box' }
        ]
      }
    ]
  },
  {
    tag: 'Step 7 — Hutang',
    title: 'Risiko Kredit & Hutang',
    desc: 'Pahami beban kreditmu',
    questions: [
      {
        id: 'q16',
        num: 12,
        label: 'Apakah kamu memiliki cicilan / hutang aktif?',
        icon: 'card',
        type: 'radio',
        opts: [
          { v: 'tidak', l: 'Tidak', icon: 'check-badge' },
          { v: 'ringan', l: 'Ya, ringan', icon: 'feather' },
          { v: 'besar', l: 'Ya, cukup besar', icon: 'kettlebell' }
        ]
      },
      {
        id: 'q17',
        num: 13,
        label: 'Penggunaan PayLater / kartu kredit',
        icon: 'card-stack',
        type: 'radio',
        opts: [
          { v: 'tidak', l: 'Tidak pernah', icon: 'card-zzz' },
          { v: 'sesekali', l: 'Sesekali', icon: 'card' },
          { v: 'terkontrol', l: 'Rutin tapi terkontrol', icon: 'card-shield' },
          { v: 'menumpuk', l: 'Sering & menumpuk', icon: 'card-stack' }
        ]
      }
    ]
  },
  {
    tag: 'Step 8 — Pembayaran',
    title: 'Pola Transaksi',
    desc: 'Rekening, dompet digital, dan cara bayar kamu sehari-hari',
    questions: [
      {
        id: 'q19_bank',
        num: 14,
        label: 'Bank yang kamu gunakan (boleh pilih lebih dari satu)',
        icon: 'bank',
        type: 'checkbox_grouped',
        groups: [
          {
            label: 'Bank BUMN & Swasta',
            icon: 'bank',
            opts: [
              { v: 'bri', l: 'BRI' },
              { v: 'mandiri', l: 'Mandiri' },
              { v: 'bni', l: 'BNI' },
              { v: 'btn', l: 'BTN' },
              { v: 'bca', l: 'BCA' },
              { v: 'cimb', l: 'CIMB Niaga' },
              { v: 'danamon', l: 'Danamon' },
              { v: 'permata', l: 'Permata Bank' },
              { v: 'ocbc', l: 'OCBC NISP' },
              { v: 'panin', l: 'Panin Bank' },
              { v: 'maybank', l: 'Maybank' },
              { v: 'mega', l: 'Mega Bank' },
              { v: 'sinarmas', l: 'Sinarmas' }
            ]
          },
          {
            label: 'Bank Syariah',
            icon: 'bank-syariah',
            opts: [
              { v: 'bsi', l: 'BSI' },
              { v: 'cimb-syariah', l: 'CIMB Syariah' }
            ]
          },
          {
            label: 'Bank Digital & Neo Bank',
            icon: 'bank-digital',
            opts: [
              { v: 'jago', l: 'Bank Jago' },
              { v: 'jenius', l: 'Jenius (BTPN)' },
              { v: 'seabank', l: 'SeaBank' },
              { v: 'blu', l: 'Blu by BCA' },
              { v: 'neo', l: 'Neo Bank (Neo+)' }
            ]
          }
        ]
      },
      {
        id: 'q20_ewallet',
        num: 15,
        label: 'E-wallet yang kamu pakai (boleh pilih lebih dari satu)',
        icon: 'phone-wallet',
        type: 'checkbox',
        opts: [
          { v: 'gopay', l: 'GoPay', brand: 'gopay' },
          { v: 'ovo', l: 'OVO', brand: 'ovo' },
          { v: 'dana', l: 'DANA', brand: 'dana' },
          { v: 'shopeepay', l: 'ShopeePay', brand: 'shopeepay' },
          { v: 'linkaja', l: 'LinkAja', brand: 'linkaja' },
          { v: 'astrapay', l: 'AstraPay', brand: 'astrapay' },
          { v: 'lainnya', l: 'Lainnya', icon: 'plus' }
        ]
      },
      {
        id: 'q21_paylater',
        num: 16,
        label: 'Kartu kredit / PayLater yang aktif (boleh pilih lebih dari satu)',
        icon: 'card',
        type: 'checkbox',
        opts: [
          { v: 'cc-bank', l: 'Kartu kredit bank', icon: 'card' },
          { v: 'kredivo', l: 'Kredivo', brand: 'kredivo' },
          { v: 'akulaku', l: 'Akulaku', brand: 'akulaku' },
          { v: 'spaylater', l: 'SPayLater', brand: 'spaylater' },
          { v: 'gopaylater', l: 'GoPayLater', brand: 'gopaylater' },
          { v: 'traveloka', l: 'Traveloka PayLater', brand: 'traveloka' },
          { v: 'tidak-ada', l: 'Tidak ada', icon: 'check-badge' }
        ]
      },
      {
        id: 'q22_rank',
        num: 17,
        label: 'Urutan metode yang paling sering kamu pakai untuk belanja sehari-hari',
        icon: 'ranking',
        type: 'ranking'
      }
    ]
  }
];

// Flatten all questions for navigation
export const allQuestions = steps.flatMap((s) =>
  s.questions.map((q) => ({ ...q, stepInfo: s }))
);

export const totalQuestions = allQuestions.length;
