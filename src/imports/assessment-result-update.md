Ubah tampilan halaman hasil assessment sesuai spec berikut.
Jangan ubah bagian lain di luar yang disebutkan.

═══ 1. HEADLINE ═══

Ganti logika headline berdasarkan score_total:

if (score_total > 60) {
  headline = '✅ Kamu di jalur yang tepat! Pertahankan kebiasaan baik dan tingkatkan area yang masih kurang optimal.';
} else {
  headline = '📊 Kondisi finansialmu masih bisa ditingkatkan. Beberapa kebiasaan pengeluaran bisa diperbaiki agar lebih stabil ke depannya.';
}

═══ 2. BATAS AMAN PENGELUARAN HARIAN ═══

Ganti total formula perhitungan dailyLimit dengan rumus baru berikut:

// Ambil batas bawah bracket penghasilan dari Q1
const incomeLowerBound = {
  'lt-3jt':    0,
  '3-5jt':     3000000,
  '5-10jt':    5000000,
  '10-20jt':   10000000,
  '20-30jt':   20000000,
  '30-50jt':   30000000,
  'gt-50jt':   50000000
}[answers.q1] || 0;

// expenseRatio dari slider Q7 (expense_allocation_pct)
const expensePct   = Number(answers.q7) / 100;

// R1 = batas bawah penghasilan dikurangi porsi pengeluaran wajib, dibulatkan ke atas
const R1 = Math.ceil(incomeLowerBound - (expensePct * incomeLowerBound));

// Batas aman = R1 / 25
const rawLimit = R1 / 25;

// Floor: minimum Rp30.000
// Jika < 30.000 → set 30.000
// Jika >= 30.000 → round up ke kelipatan 5.000 atau 10.000 terdekat
let dailyLimit;
if (rawLimit < 30000) {
  dailyLimit = 30000;
} else {
  // Round up ke kelipatan 5.000 terdekat
  dailyLimit = Math.ceil(rawLimit / 5000) * 5000;
}

Tampilkan hasilnya sebagai: "Rp" + dailyLimit.toLocaleString('id-ID') + " / hari"

═══ 3. REKOMENDASI PRIORITAS ═══

Ganti dari sistem dinamis (3 dimensi rasio terendah) menjadi STATIC.
Selalu tampilkan semua item berikut dalam urutan ini:

1. 💬 Catat pengeluaran, pemasukan, semua lewat WhatsApp.
2. 📊 Laporan keuangan bulanan otomatis beserta grafik dalam Excel.
3. 🛒 Spending Alert di MIRA — notifikasi tiap kali pengeluaran mendekati batas harian.
4. 🏦 Dashboard lengkap untuk mengontrol aset, net worth, dan tren finansial.

Tambahkan item kondisional di bawahnya:

// Jika user punya hutang/cicilan aktif (debt_status !== 'tidak-ada')
if (answers.q13 !== 'tidak-ada') {
  tampilkan: '💳 Pantau PayLater & cicilan — MIRA mendeteksi pola penggunaan kredit berisiko.'
}

// Jika user berinvestasi (investment_status !== 'tidak')
if (answers.q11 !== 'tidak') {
  tampilkan: '📈 Lacak alokasi investasi dan kelola portofolio dengan MIRA.'
}

═══ YANG TIDAK DIUBAH ═══
- Summary breakdown 6 kartu (income, expense, spending, saving, emergency, debt) → As Is
- CTA berlangganan → As Is
- Semua tampilan visual / styling kartu → As Is