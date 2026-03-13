export interface QuestionOption {
  v: string;
  l: string;
}

export interface QuestionGroup {
  label: string;
  opts: QuestionOption[];
}

export interface Question {
  id: string;
  num: number;
  label: string;
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
        label: '💵 Rata-rata penghasilan bulanan kamu',
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
        label: '📅 Jenis pemasukan kamu',
        type: 'radio',
        opts: [
          { v: 'tetap', l: '✅ Tetap tiap bulan' },
          { v: 'freelance', l: '🎯 Tidak tetap / freelance' },
          { v: 'campuran', l: '🔄 Campuran' }
        ]
      },
      {
        id: 'q3',
        num: 3,
        label: '📆 Biasanya tanggal menerima pemasukan',
        type: 'radio',
        opts: [
          { v: 'tetap', l: '📌 Tanggal tetap' },
          { v: 'bervariasi', l: '↔️ Bervariasi' },
          { v: 'harian', l: '📆 Harian / mingguan' }
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
        label: '🏠 Apa saja pengeluaran wajib kamu? (pilih semua yang sesuai)',
        type: 'checkbox',
        opts: [
          { v: 'sewa', l: '🏠 Sewa / cicilan rumah' },
          { v: 'listrik', l: '💡 Listrik & utilitas' },
          { v: 'transport', l: '🚗 Transportasi kerja' },
          { v: 'asuransi', l: '🛡️ Asuransi' },
          { v: 'cicilan', l: '💳 Cicilan hutang' },
          { v: 'tanggungan', l: '👨‍👩‍👧 Tanggungan keluarga' }
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
        label: '🤔 Uang paling sering habis untuk',
        type: 'radio',
        opts: [
          { v: 'makan', l: '🍜 Makan & jajan harian' },
          { v: 'lifestyle', l: '☕ Nongkrong & lifestyle' },
          { v: 'belanja-online', l: '🛍️ Belanja online' },
          { v: 'keluarga', l: '👨‍👩‍👧 Kebutuhan keluarga' },
          { v: 'ga-terasa', l: '❓ Tidak terasa habis' }
        ]
      },
      {
        id: 'q7',
        num: 6,
        label: '🛒 Seberapa sering belanja impulsif saat promo?',
        type: 'radio',
        opts: [
          { v: 'jarang', l: '😇 Hampir tidak pernah' },
          { v: 'kadang', l: '🤷 Kadang-kadang' },
          { v: 'sering', l: '😅 Sering' },
          { v: 'sangat-sering', l: '😬 Sangat sering' }
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
        label: '⚖️ Dari penghasilanmu, berapa porsi untuk pengeluaran vs tabungan?',
        type: 'ratio_slider'
      },
      {
        id: 'q11',
        num: 8,
        label: '🎯 Tujuan tabungan / keinginan kamu (pilih semua yang sesuai)',
        type: 'checkbox',
        opts: [
          { v: 'darurat', l: '🚨 Dana darurat' },
          { v: 'rumah', l: '🏠 Beli rumah' },
          { v: 'mobil', l: '🚗 Beli kendaraan' },
          { v: 'menikah', l: '💍 Menikah' },
          { v: 'pendidikan', l: '🎓 Pendidikan anak / diri sendiri' },
          { v: 'liburan', l: '✈️ Liburan impian' },
          { v: 'pensiun', l: '👴 Dana pensiun' },
          { v: 'bisnis', l: '💼 Modal usaha / bisnis' },
          { v: 'gadget', l: '📱 Gadget / barang keinginan' },
          { v: 'tidak-ada', l: '🤷 Tidak ada tujuan khusus' }
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
        label: '🚨 Jika pemasukan berhenti, dana darurat kamu cukup untuk:',
        type: 'radio',
        opts: [
          { v: '<1', l: '😰 < 1 bulan' },
          { v: '1-3', l: '😐 1–3 bulan' },
          { v: '3-6', l: '😊 3–6 bulan' },
          { v: '>6', l: '💪 > 6 bulan' },
          { v: 'tidak-ada', l: '❌ Tidak punya dana darurat' }
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
        label: '📈 Apakah kamu berinvestasi saat ini?',
        type: 'radio',
        opts: [
          { v: 'tidak', l: '❌ Tidak' },
          { v: 'sesekali', l: '🔄 Ya, sesekali' },
          { v: 'rutin', l: '✅ Ya, rutin' }
        ]
      },
      {
        id: 'q14',
        num: 11,
        label: '💼 Instrumen investasi yang digunakan (pilih semua yang sesuai)',
        type: 'checkbox',
        opts: [
          { v: 'reksa', l: '📊 Reksa dana' },
          { v: 'saham', l: '📈 Saham' },
          { v: 'emas', l: '🪙 Emas' },
          { v: 'crypto', l: '₿ Crypto' },
          { v: 'properti', l: '🏠 Properti' },
          { v: 'bisnis', l: '💼 Bisnis' },
          { v: 'tidak', l: '❌ Tidak ada' }
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
        label: '💳 Apakah kamu memiliki cicilan / hutang aktif?',
        type: 'radio',
        opts: [
          { v: 'tidak', l: '✅ Tidak' },
          { v: 'ringan', l: '🟡 Ya, ringan' },
          { v: 'besar', l: '🔴 Ya, cukup besar' }
        ]
      },
      {
        id: 'q17',
        num: 13,
        label: '🏦 Penggunaan PayLater / kartu kredit',
        type: 'radio',
        opts: [
          { v: 'tidak', l: '✅ Tidak pernah' },
          { v: 'sesekali', l: '🔄 Sesekali' },
          { v: 'terkontrol', l: '😊 Rutin tapi terkontrol' },
          { v: 'menumpuk', l: '😰 Sering & menumpuk' }
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
        label: '🏦 Bank yang kamu gunakan (boleh pilih lebih dari satu)',
        type: 'checkbox_grouped',
        groups: [
          {
            label: '🏦 Bank BUMN & Swasta',
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
            label: '🕌 Bank Syariah',
            opts: [
              { v: 'bsi', l: 'BSI' },
              { v: 'cimb-syariah', l: 'CIMB Syariah' }
            ]
          },
          {
            label: '📱 Bank Digital & Neo Bank',
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
        label: '📱 E-wallet yang kamu pakai (boleh pilih lebih dari satu)',
        type: 'checkbox',
        opts: [
          { v: 'gopay', l: '🟢 GoPay' },
          { v: 'ovo', l: '🟣 OVO' },
          { v: 'dana', l: '🔵 DANA' },
          { v: 'shopeepay', l: '🟠 ShopeePay' },
          { v: 'linkaja', l: '🔴 LinkAja' },
          { v: 'astrapay', l: '🔷 AstraPay' },
          { v: 'lainnya', l: '➕ Lainnya' }
        ]
      },
      {
        id: 'q21_paylater',
        num: 16,
        label: '💳 Kartu kredit / PayLater yang aktif (boleh pilih lebih dari satu)',
        type: 'checkbox',
        opts: [
          { v: 'cc-bank', l: '💳 Kartu kredit bank' },
          { v: 'kredivo', l: '🔵 Kredivo' },
          { v: 'akulaku', l: '🟡 Akulaku' },
          { v: 'spaylater', l: '🟠 SPayLater' },
          { v: 'gopaylater', l: '🟢 GoPayLater' },
          { v: 'traveloka', l: '🔷 Traveloka PayLater' },
          { v: 'tidak-ada', l: '✅ Tidak ada' }
        ]
      },
      {
        id: 'q22_rank',
        num: 17,
        label: '📊 Urutan metode yang paling sering kamu pakai untuk belanja sehari-hari (ketuk ↑↓ untuk urutkan)',
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
