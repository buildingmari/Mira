Di halaman Affiliate, semua data masih dummy (AFF_DATA hardcoded, affiliate code statis).
Hubungkan ke Supabase. Gunakan SB client dan currentUser yang sudah ada.

═══ 1. LOAD AFFILIATE CODE USER ═══

Di initApp() setelah user login, tambahkan:
document.getElementById('aff-code').textContent = currentUser.affiliate_code || '-';

═══ 2. LOAD DATA AFFILIATE SAAT BUKA HALAMAN ═══

Di fungsi nav(), tambahkan kondisi:
if (page === 'affiliate') loadAffiliateData();

Buat fungsi baru:

async function loadAffiliateData() {
  const { data, error } = await SB
    .from('affiliate_referrals')
    .select('*')
    .eq('referrer_phone', currentUser.primary_phone)
    .order('created_at', { ascending: false });

  if (error) { toast('Gagal load data affiliate', 'red'); return; }

  const referrals = data || [];

  const totalKomisi = referrals.reduce((s, r) => s + Number(r.commission_amount || 0), 0);
  const belumCair = referrals
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + Number(r.commission_amount || 0), 0);

  // Update stats — sesuaikan id element dengan yang ada di HTML
  document.getElementById('aff-ref-count').textContent = referrals.length;
  document.getElementById('aff-total-komisi').textContent = fmt(totalKomisi);
  document.getElementById('aff-belum-cair').textContent = fmt(belumCair);

  // Render tabel riwayat — ganti renderAffHist() yang lama
  document.getElementById('aff-hist').innerHTML = referrals.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Belum ada referral</td></tr>`
    : referrals.map(r => `
        <tr>
          <td style="color:var(--text-muted);font-size:.8rem">
            ${new Date(r.created_at).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})}
          </td>
          <td style="font-weight:600">${r.referee_name || 'User***'}</td>
          <td style="font-size:.82rem">${r.plan_name || '-'}</td>
          <td style="font-weight:600">${fmt(r.transaction_value || 0)}</td>
          <td style="color:var(--success);font-weight:700">${fmt(r.commission_amount || 0)}</td>
          <td>
            <span class="ref-chip" style="
              background:${r.status === 'settled' ? 'var(--success-bg)' : 'var(--warning-bg)'};
              color:${r.status === 'settled' ? 'var(--success)' : 'var(--warning)'}">
              ${r.status === 'settled' ? '✅ Selesai' : '⏳ Pending'}
            </span>
          </td>
        </tr>`).join('');
}

═══ 3. COPY & SHARE ═══

Ganti fungsi copyAff() dan shareAff() yang lama:

function copyAff() {
  const code = currentUser.affiliate_code || '';
  navigator.clipboard?.writeText(code).catch(() => {});
  toast('Kode disalin: ' + code + ' 📋', 'green');
}

function shareAff() {
  const code = currentUser.affiliate_code || '';
  const link = 'https://getmira.id/?ref=' + code;
  navigator.clipboard?.writeText(link).catch(() => {});
  toast('Link disalin: ' + link + ' 📤', '');
}

═══ 4. WITHDRAW ═══

Ganti fungsi withdrawAff() yang lama:

async function withdrawAff() {
  const { data } = await SB
    .from('affiliate_referrals')
    .select('id, commission_amount')
    .eq('referrer_phone', currentUser.primary_phone)
    .eq('status', 'pending');

  const total = (data || []).reduce((s, r) => s + Number(r.commission_amount || 0), 0);

  if (total < 50000) {
    toast('Minimal pencairan Rp50.000. Saat ini: ' + fmt(total), 'red');
    return;
  }

  if (!confirm('Cairkan ' + fmt(total) + '?')) return;

  const ids = (data || []).map(r => r.id);
  await SB
    .from('affiliate_referrals')
    .update({ status: 'withdrawal_requested' })
    .in('id', ids);

  toast('Pencairan ' + fmt(total) + ' sedang diproses 💸', 'green');
  loadAffiliateData(); // refresh tampilan
}

═══ HAPUS ═══
Hapus array dummy AFF_DATA dan hapus panggilan renderAffHist() di initApp()
karena sekarang load dilakukan saat user buka halaman affiliate.