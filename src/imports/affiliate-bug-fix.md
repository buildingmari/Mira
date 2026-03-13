Halaman Affiliate masih tampil "Belum ada referral" padahal data sudah ada
di Supabase. Setelah dicek data di Supabase:
  referrer_phone = "6281210503345"  (tanpa tanda +)
  User yang login = "+6281210503345" (dengan tanda +)

Kemungkinan bug ada di salah satu dari ini — cek semua:

1. STRIP tanda + saat query:

const rawPhone = currentUser.primary_phone || '';
const phone = rawPhone.replace(/^\+/, '');  // hapus + di depan

const { data, error } = await SB
  .from('affiliate_referrals')
  .select('*')
  .eq('referrer_phone', phone)
  .order('created_at', { ascending: false });

console.log('querying with phone:', phone);
console.log('result:', data, error);

2. PASTIKAN initAffiliatePage() atau fungsi fetch affiliate
   dipanggil saat tab/menu Affiliate dibuka, bukan hanya saat mount.
   Kalau pakai kondisi seperti:
     if (page === 'affiliate') initAffiliatePage();
   Pastikan baris ini benar-benar jalan — tambahkan:
     console.log('affiliate page opened, fetching...');

3. PASTIKAN summary cards ikut terupdate setelah data masuk:

const totalReferral  = data.length;
const totalKomisi    = data.reduce((s,r) => s + Number(r.commission_amount||0), 0);
const belumDicairkan = data
  .filter(r => r.status === 'pending')
  .reduce((s,r) => s + Number(r.commission_amount||0), 0);

// Update elemen:
document.getElementById('gh-total-referral').textContent  = totalReferral;
document.getElementById('gh-total-komisi').textContent    = 'Rp' + totalKomisi.toLocaleString('id-ID');
document.getElementById('gh-belum-cair').textContent      = 'Rp' + belumDicairkan.toLocaleString('id-ID');

4. RENDER tabel jika data ada:

if (!data || data.length === 0) {
  // tampilkan "Belum ada referral"
} else {
  // render rows
  document.getElementById('referral-list').innerHTML = data.map(r => `
    <tr>
      <td>${new Date(r.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</td>
      <td>${r.referee_name || r.referee_phone}</td>
      <td>${r.plan_name}</td>
      <td>Rp${Number(r.transaction_value).toLocaleString('id-ID')}</td>
      <td>Rp${Number(r.commission_amount).toLocaleString('id-ID')}</td>
      <td>${r.status === 'pending' ? '🟡 Menunggu' : r.status === 'settled' ? '✅ Lunas' : r.status}</td>
    </tr>
  `).join('');
}