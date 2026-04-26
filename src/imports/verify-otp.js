}
async function verifyOTP() {
  const code = [0,1,2,3].map(i => document.getElementById('o'+i).value).join('');

  if (code.length < 4) {
    toast('Masukkan 4 digit kode OTP','red');
    return;
  }

  showLS('ls-loading');
  document.getElementById('load-txt').textContent = 'Memverifikasi OTP...';

  try {
    const res = await fetch(N8N_BASE + '/webhook/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: '62' + loginPh,
        otp: code
      })
    });

    const data = await res.json();
    console.log('VERIFY OTP RESPONSE:', data);

    // ✅ FIX UTAMA DI SINI
    if (data.status !== 'success') {
      showLS('ls-otp');

      [0,1,2,3].forEach(i => {
        const c = document.getElementById('o'+i);
        c.classList.remove('filled');
        c.value = '';
      });

      document.getElementById('o0').focus();
      toast(data.message || 'OTP salah atau sudah kadaluarsa', 'red');
      return;
    }

    // ✅ AMBIL USER
    const u = data.user;

    if (!u || !u.primary_phone) {
      showLS('ls-otp');
      toast('User tidak valid', 'red');
      return;
    }

    SESSION_PHONE = u.primary_phone;

    USER.name       = u.name || 'User';
    USER.phone      = u.primary_phone;
    USER.avatar     = (u.name || 'U')[0].toUpperCase();

    USER.expiry     = u.valid_to
      ? new Date(u.valid_to).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})
      : '-';

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

    USER.investStatus      = u.investment_status || '-';
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

    USER.paymentRanking = u.payment_method_ranking || '';

    USER.validFrom = u.valid_from || null;
    USER.validTo   = u.valid_to || null;

    await loadDashboardData();

  } catch (e) {
    console.error(e);
    showLS('ls-otp');
    toast('Gagal terhubung ke server', 'red');
  }
