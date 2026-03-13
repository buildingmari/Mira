Pastikan initApp() mengisi semua field profil dari currentUser:
js// Tambahkan di initApp() setelah existing code:
document.getElementById('p-plan').textContent = currentUser.plan_name || 'Personal';
document.getElementById('p-skor').textContent = (currentUser.score_total || 0) + '/100';
Update — ganti saveProfile():
jsasync function saveProfile() {
  const name = document.getElementById('p-name').value.trim();
  if (!name) { shakeEl('p-name'); toast('Nama tidak boleh kosong','red'); return; }

  const { error } = await SB
    .from('users')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('primary_phone', currentUser.primary_phone);

  if (error) { toast('Gagal menyimpan: ' + error.message, 'red'); return; }

  currentUser.name = name;
  USER.name = name;
  USER.avatar = name[0].toUpperCase();
  document.getElementById('sb-av').textContent = USER.avatar;
  document.getElementById('sb-name').textContent = name;
  document.getElementById('prof-av').textContent = USER.avatar;
  document.getElementById('prof-name-disp').textContent = name;
  toast('Profil berhasil disimpan ✓', 'green');
}
Delete Semua Transaksi:
jsasync function delAllTxns() {
  if (!confirm('Hapus SEMUA transaksi? Tidak bisa dibatalkan.')) return;
  const { error } = await SB
    .from('expenses')
    .delete()
    .eq('phone_number', currentUser.primary_phone);
  if (error) { toast('Gagal hapus: ' + error.message, 'red'); return; }
  allTxns = []; filtTxns = []; renderTxns(); renderDashboard();
  toast('Semua transaksi dihapus', 'red');
}
Delete Akun:
jsasync function delAccount() {
  if (!confirm('PERHATIAN: Akun dan semua data akan dihapus permanen. Yakin?')) return;
  await SB.from('expenses').delete().eq('phone_number', currentUser.primary_phone);
  await SB.from('user_states').delete().eq('phone_number', currentUser.primary_phone);
  await SB.from('users').delete().eq('primary_phone', currentUser.primary_phone);
  logout();
  toast('Akun berhasil dihapus', 'red');
}

3. FIX PENGATURAN — Read & Update ke Supabase
Read (sudah di-handle lewat USER.banks, USER.ewallets, USER.paylater di loadUserFromDB)
Update — ganti saveSettings():
jsasync function saveSettings() {
  // Kumpulkan chip yang aktif
  const banks = [...document.querySelectorAll('#set-banks .chip.on')].map((_,i) => BANK_V[i]).filter(Boolean);
  const ewallets = [...document.querySelectorAll('#set-ewl .chip.on')].map((_,i) => EW_V[i]).filter(Boolean);
  const paylater = [...document.querySelectorAll('#set-pl .chip.on')].map((_,i) => PL_V[i]).filter(Boolean);

  // Kumpulkan notifikasi toggle
  const notifSpending = document.getElementById('toggle-spending')?.checked ?? true;
  const notifSaving = document.getElementById('toggle-saving')?.checked ?? true;
  const notifExport = document.getElementById('toggle-export')?.checked ?? true;
  const limitHarian = parseInt(document.getElementById('limit-harian')?.value?.replace(/\D/g,'')) || 0;

  const { error } = await SB
    .from('users')
    .update({
      banks_used: JSON.stringify(banks),
      ewallets_used: JSON.stringify(ewallets),
      paylater_active: JSON.stringify(paylater),
      expense_allocation_pct: USER.ratio,
      limit_nominal: limitHarian,
      updated_at: new Date().toISOString()
    })
    .eq('primary_phone', currentUser.primary_phone);

  if (error) { toast('Gagal menyimpan: ' + error.message, 'red'); return; }

  currentUser.banks_used = JSON.stringify(banks);
  USER.banks = banks; USER.ewallets = ewallets; USER.paylater = paylater;
  toast('Pengaturan berhasil disimpan ✓', 'green');
}

Catatan: Tambahkan id="toggle-spending", id="toggle-saving", id="toggle-export" ke elemen toggle yang sudah ada di HTML Pengaturan. Tambahkan id="limit-harian" ke input batas harian.


4. FIX AFFILIATE — Full Real Implementation
Setup Supabase (HARUS DILAKUKAN MANUAL — lihat bagian bawah)
Read affiliate data:
jsasync function loadAffiliateData() {
  // 1. Pastikan user punya affiliate_code
  let affCode = currentUser.affiliate_code;
  if (!affCode) {
    affCode = generateAffCode(currentUser.name, currentUser.primary_phone);
    await SB.from('users').update({ affiliate_code: affCode }).eq('primary_phone', currentUser.primary_phone);
    currentUser.affiliate_code = affCode;
  }
  USER.affCode = affCode;
  document.getElementById('aff-code').textContent = affCode;

  // 2. Fetch riwayat referral dari tabel affiliate_referrals
  const { data: referrals } = await SB
    .from('affiliate_referrals')
    .select('*')
    .eq('referrer_phone', currentUser.primary_phone)
    .order('created_at', { ascending: false });

  if (!referrals) return;

  const totalKomisi = referrals.reduce((s, r) => s + (r.commission_amount || 0), 0);
  const belumCair = referrals.filter(r => r.status === 'pending').reduce((s, r) => s + (r.commission_amount || 0), 0);

  document.getElementById('aff-ref-count').textContent = referrals.length;
  document.getElementById('aff-total-komisi').textContent = fmt(totalKomisi);
  document.getElementById('aff-belum-cair').textContent = fmt(belumCair);

  // 3. Render tabel riwayat
  document.getElementById('aff-hist').innerHTML = referrals.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">Belum ada referral</td></tr>`
    : referrals.map(r => `
      <tr>
        <td style="color:var(--text-muted);font-size:.8rem">${new Date(r.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td style="font-weight:600">${r.referee_name || 'User***'}</td>
        <td style="font-size:.82rem">${r.plan_name || '-'}</td>
        <td style="font-weight:600">${fmt(r.transaction_value || 0)}</td>
        <td style="color:var(--success);font-weight:700">${fmt(r.commission_amount || 0)}</td>
        <td><span class="ref-chip" style="background:${r.status==='settled'?'var(--success-bg)':'var(--warning-bg)'};color:${r.status==='settled'?'var(--success)':'var(--warning)'}">
          ${r.status==='settled'?'✅ Selesai':'⏳ Pending'}
        </span></td>
      </tr>`).join('');
}
Cairkan komisi:
jsasync function withdrawAff() {
  const { data: referrals } = await SB
    .from('affiliate_referrals')
    .select('commission_amount')
    .eq('referrer_phone', currentUser.primary_phone)
    .eq('status', 'pending');

  const total = (referrals || []).reduce((s, r) => s + (r.commission_amount || 0), 0);
  if (total < 50000) { toast('Minimal pencairan Rp50.000', 'red'); return; }

  await SB.from('affiliate_referrals')
    .update({ status: 'withdrawal_requested' })
    .eq('referrer_phone', currentUser.primary_phone)
    .eq('status', 'pending');

  toast(`Pencairan ${fmt(total)} sedang diproses 💸`, 'green');
  loadAffiliateData();
}
Panggil loadAffiliateData() di nav affiliate:
js// Di fungsi nav(), tambahkan:
if (page === 'affiliate') loadAffiliateData();

5. LOGIKA DISKON AFFILIATE DI REGISTRASI
Di halaman/flow registrasi (onboarding), saat user input voucher code:
jsasync function validateAffCode(code) {
  if (!code) return null;
  const { data } = await SB
    .from('users')
    .select('primary_phone, name, affiliate_code')
    .eq('affiliate_code', code.toUpperCase())
    .single();
  return data || null;
}

// Saat user submit registrasi & pakai kode affiliate:
async function onRegisterWithAffiliate(newUserPhone, planPrice, affCode) {
  const referrer = await validateAffCode(affCode);
  if (!referrer) { toast('Kode affiliate tidak valid', 'red'); return; }

  const discountedPrice = Math.round(planPrice * 0.9); // diskon 10%
  const commission = Math.round(planPrice * 0.1);      // komisi 10%

  // Simpan referral record
  await SB.from('affiliate_referrals').insert({
    referrer_phone: referrer.primary_phone,
    referee_phone: newUserPhone,
    affiliate_code: affCode,
    transaction_value: planPrice,
    commission_amount: commission,
    status: 'pending',
    created_at: new Date().toISOString()
  });

  return discountedPrice;