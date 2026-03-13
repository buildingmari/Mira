Di form pilih paket, ada input voucher dengan tombol "Terapkan". 
Saat ini sudah ada UI-nya tapi belum ada logic yang benar. Fix berikut:

1. SAAT TOMBOL "TERAPKAN" DIKLIK — fetch ke Supabase untuk validasi kode:

async function applyVoucher() {
  const code = document.getElementById('voucher-input').value.trim().toUpperCase();
  if (!code) return;

  const res = await fetch(
    `https://vhwissutkmxyzlyzkhyt.supabase.co/rest/v1/users?affiliate_code=eq.${code}&select=primary_phone,name`,
    {
      headers: {
        'apikey': 'ANON_KEY_KAMU',
        'Authorization': 'Bearer ANON_KEY_KAMU'
      }
    }
  );
  const data = await res.json();

  if (data.length > 0) {
    // Voucher valid
    window._voucherCode = code;
    window._voucherDiscount = 10;
    window._referrerPhone = data[0].primary_phone;
    showVoucherSuccess();
    updatePriceDisplay();
  } else {
    // Voucher tidak valid
    window._voucherCode = null;
    window._voucherDiscount = 0;
    window._referrerPhone = null;
    showVoucherError();
    updatePriceDisplay();
  }
}

2. UPDATE TAMPILAN HARGA setelah voucher valid:

function updatePriceDisplay() {
  const basePrice = window._selectedPlanPrice; // harga paket yang sedang dipilih
  const discount = window._voucherDiscount || 0;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  // Tampilkan harga original dicoret jika ada diskon
  if (discount > 0) {
    document.getElementById('price-original-display').innerHTML = 
      `<span style="text-decoration:line-through;color:#999">Rp${basePrice.toLocaleString('id-ID')}</span>`;
    document.getElementById('discount-badge').style.display = 'inline-block';
    document.getElementById('discount-badge').textContent = `Hemat ${discount}%`;
  } else {
    document.getElementById('price-original-display').innerHTML = 
      `Rp${basePrice.toLocaleString('id-ID')}`;
    document.getElementById('discount-badge').style.display = 'none';
  }

  document.getElementById('total-price-display').textContent = 
    `Rp${finalPrice.toLocaleString('id-ID')}`;

  window._finalPrice = finalPrice;
}

// Panggil updatePriceDisplay() juga setiap kali user ganti pilihan paket

3. SAAT SUBMIT FORM — kirim field berikut ke backend:

{
  ...formData,
  voucher_code: window._voucherCode || null,
  voucher_discount_percent: window._voucherDiscount || 0,
  price_original: window._selectedPlanPrice,
  price_final: window._finalPrice || window._selectedPlanPrice
}

Sesuaikan nama ID element (voucher-input, price-original-display, 
total-price-display, discount-badge) dengan yang sudah ada di HTML ini.
Pastikan updatePriceDisplay() juga dipanggil saat user ganti paket/durasi.
