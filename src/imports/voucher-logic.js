import { SUPA_URL, SUPA_ANON } from './supabase-config.js';

/* ================================
   GLOBAL STATE
================================ */
window._voucherCode = null;
window._voucherDiscount = 0;
window._selectedPlanPrice = window._selectedPlanPrice || 0;
window._finalPrice = window._selectedPlanPrice || 0;

/* ================================
   APPLY VOUCHER
================================ */
async function applyVoucher() {
  const input = document.getElementById('voucher-input');
  const code = input.value.trim().toUpperCase();

  if (!code) return;

  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true&limit=1`,
      {
        headers: {
          'apikey': SUPA_ANON,
          'Authorization': 'Bearer ' + SUPA_ANON,
          'Accept': 'application/json'
        }
      }
    );

    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const voucher = data[0];

      window._voucherCode = voucher.code;
      window._voucherDiscount = Number(voucher.discount_percent || 0);

      showVoucherSuccess(voucher.discount_percent);
    } else {
      resetVoucher();
      showVoucherError();
    }

  } catch (err) {
    resetVoucher();
    showVoucherError();
  }

  updatePriceDisplay();
}

/* ================================
   PRICE UPDATE
================================ */
function updatePriceDisplay() {
  const basePrice = window._selectedPlanPrice || 0;
  const discount = window._voucherDiscount || 0;

  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  const originalEl = document.getElementById('price-original-display');
  const totalEl = document.getElementById('total-price-display');
  const badgeEl = document.getElementById('discount-badge');

  if (discount > 0) {
    originalEl.innerHTML = `
      <span style="text-decoration:line-through;color:#999">
        Rp${basePrice.toLocaleString('id-ID')}
      </span>
    `;
    badgeEl.style.display = 'inline-block';
    badgeEl.textContent = `Hemat ${discount}%`;
  } else {
    originalEl.innerHTML = `Rp${basePrice.toLocaleString('id-ID')}`;
    badgeEl.style.display = 'none';
  }

  totalEl.textContent = `Rp${finalPrice.toLocaleString('id-ID')}`;

  window._finalPrice = finalPrice;
}

/* ================================
   HELPERS
================================ */
function resetVoucher() {
  window._voucherCode = null;
  window._voucherDiscount = 0;
}

function showVoucherSuccess(percent) {
  const el = document.getElementById('voucher-message');
  if (!el) return;

  el.style.display = 'block';
  el.style.color = 'green';
  el.textContent = `Voucher berhasil! Diskon ${percent}% diterapkan`;
}

function showVoucherError() {
  const el = document.getElementById('voucher-message');
  if (!el) return;

  el.style.display = 'block';
  el.style.color = 'red';
  el.textContent = `Kode voucher tidak valid atau sudah kadaluarsa`;
}

/* ================================
   INIT (AUTO BIND)
================================ */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('apply-voucher-btn');

  if (btn) {
    btn.addEventListener('click', applyVoucher);
  }
});

/* ================================
   OPTIONAL: CALL WHEN PLAN CHANGES
================================ */
window.updateVoucherPrice = function(price) {
  window._selectedPlanPrice = price;
  updatePriceDisplay();
};
