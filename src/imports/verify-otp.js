2. Ganti seluruh fungsi verifyOTP():
jsasync function verifyOTP() {
  const code = [0,1,2,3].map(i => document.getElementById('o'+i).value).join('');
  if (code.length < 4) { toast('Masukkan 4 digit kode OTP','red'); return; }
  showLS('ls-loading');
  document.getElementById('load-txt').textContent = 'Memverifikasi OTP...';
  try {
    const res = await fetch(N8N_BASE + '/webhook/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '62' + loginPh, otp: code })
    });
    const data = await res.json();
    if (!data.success) {
      showLS('ls-otp');
      [0,1,2,3].forEach(i => { const c = document.getElementById('o'+i); c.classList.remove('filled'); c.value=''; });
      document.getElementById('o0').focus();
      toast('OTP salah atau sudah kadaluarsa', 'red');
      return;
    }
    const u = data.user;
    SESSION_PHONE = u.primary_phone; // primary_phone dari table users

    // Populate USER dari semua field table users
    USER.name       = u.name || 'User';
    USER.phone      = u.primary_phone;
    USER.avatar     = (u.name || 'U')[0].toUpperCase();
    USER.expiry     = u.valid_to ? new Date(u.valid_to).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) : '-';
    USER.plan       = u.plan_name || '-';
    USER.planStatus = u.account_status || '-';
    USER.ratio      = u.saving_allocation_pct || 0;
    USER.scoreTotal = u.score_total || 0;
    USER.scoreIncome     = u.score_income_stability || 0;
    USER.scoreExpense    = u.score_expense_pressure || 0;
    USER.scoreControl    = u.score_spending_control || 0;
    USER.scoreSaving     = u.score_saving_discipline || 0;
    USER.scoreEmergency  = u.score_emergency_fund || 0;
    USER.scoreInvest     = u.score_investment || 0;
    USER.scoreDebt       = u.score_debt || 0;
    USER.scoreBehavior   = u.score_behavior || 0;
    USER.incomeRange     = u.income_range || '-';
    USER.incomeType      = u.income_type || '-';
    USER.incomeEstimated = u.income_estimated_idr || 0;
    USER.savingGoals     = u.saving_goals || '-';
    USER.emergencyFund   = u.emergency_fund_duration || '-';
    USER.investStatus    = u.investment_status || '-';
    USER.investInstruments = u.investment_instruments || '-';
    USER.debtStatus      = u.debt_status || '-';
    USER.paylaterHabit   = u.paylater_habit || '-';
    USER.impulse         = u.impulse_buy_frequency || '-';
    USER.biggestCat      = u.biggest_spend_category || '-';
    USER.expenseAllocPct = u.expense_allocation_pct || 0;
    USER.mandatoryExp    = u.mandatory_expenses || '-';
    USER.paydayPattern   = u.payday_pattern || '-';
    USER.banks    = tryParseJSON(u.banks_used, []);
    USER.ewallets = tryParseJSON(u.ewallets_used, []);
    USER.paylater = tryParseJSON(u.paylater_active, []);
    USER.paymentRanking  = u.payment_method_ranking || '';
    USER.validFrom = u.valid_from || null;
    USER.validTo   = u.valid_to || null;

    await loadDashboardData();
  } catch(e) {
    showLS('ls-otp');
    toast('Gagal terhubung ke server', 'red');
  }
}
3. Tambah helper tryParseJSON di atas:
jsfunction tryParseJSON(val, fallback) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch(e) { return fallback; }
}
4. Ganti seluruh fungsi loadDashboardData():
jsasync function loadDashboardData() {
  // Ambil expenses pakai phone_number (bukan primary_phone) dari table expenses
  const from90 = new Date();
  from90.setDate(from90.getDate() - 90);
  const fromStr = from90.toISOString().split('T')[0];

  const res = await fetch(
    `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${SESSION_PHONE}&date=gte.${fromStr}&order=date.desc,created_at.desc&limit=500`,
    { headers: { 'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + SUPA_ANON, 'Accept': 'application/json' } }
  );
  const expenses = await res.json();
  console.log('Expenses fetched:', expenses.length, expenses[0]);

  // Map field Supabase expenses → format allTxns dashboard
  allTxns = Array.isArray(expenses) ? expenses.map(e => ({
    id:       e.id,
    date:     e.date ? new Date(e.date) : new Date(),  // kolom: date (date type)
    item:     e.item || '-',                            // kolom: item
    sub:      e.merchant || '-',                        // kolom: merchant
    merchant: e.merchant || '-',                        // kolom: merchant
    cat:      e.category || 'Others',                   // kolom: category
    amount:   Number(e.amount || 0),                    // kolom: amount (numeric)
    method:   e.wallet || '-',                          // kolom: wallet
    currency: e.currency || 'IDR',                      // kolom: currency
    quantity: Number(e.quantity || 1),                  // kolom: quantity
    isIn:     false
  })) : [];

  filtTxns = [...allTxns];
  curPage = 1;
  initApp();
  startPolling();
}
5. Tambah polling realtime setiap 30 detik:
jsfunction startPolling() {
  setInterval(async () => {
    const from90 = new Date();
    from90.setDate(from90.getDate() - 90);
    const fromStr = from90.toISOString().split('T')[0];
    const res = await fetch(
      `${SUPA_URL}/rest/v1/expenses?phone_number=eq.${SESSION_PHONE}&date=gte.${fromStr}&order=date.desc,created_at.desc&limit=500`,
      { headers: { 'apikey': SUPA_ANON, 'Authorization': 'Bearer ' + SUPA_ANON } }
    );
    const expenses = await res.json();
    if (!Array.isArray(expenses)) return;
    allTxns = expenses.map(e => ({
      id: e.id, date: e.date ? new Date(e.date) : new Date(),
      item: e.item||'-', sub: e.merchant||'-', merchant: e.merchant||'-',
      cat: e.category||'Others', amount: Number(e.amount||0),
      method: e.wallet||'-', currency: e.currency||'IDR',
      quantity: Number(e.quantity||1), isIn: false
    }));
    filtTxns = [...allTxns];
    renderDashboard();
    renderTxns();
  }, 30000);
}
6. Di dalam initApp(), pastikan semua element ini di-populate dari USER:
jsdocument.getElementById('sb-av').textContent    = USER.avatar;
document.getElementById('sb-name').textContent  = USER.name;
document.getElementById('sb-phone').textContent = '+' + SESSION_PHONE;
document.getElementById('prof-av').textContent  = USER.avatar;
document.getElementById('prof-name-disp').textContent = USER.name;
document.getElementById('prof-exp').textContent = 'Aktif hingga ' + USER.expiry;
document.getElementById('p-exp-val').textContent = USER.expiry;
document.getElementById('p-name').value  = USER.name;
document.getElementById('p-phone').value = '+' + SESSION_PHONE;
Juga tambah console.log('allTxns length:', allTxns.length) di awal initApp() buat debug.