Ada bug: user dengan account_status = 'pending_assessment' bisa masuk dashboard
normal tanpa diarahkan ke assessment. Padahal katanya sudah diimplementasi.
Tolong debug dan fix dengan langkah berikut:

═══ STEP 1: CARI DIMANA DATA USER DIFETCH ═══

Cari fungsi atau useEffect yang fetch data user dari Supabase setelah login.
Biasanya ada di MiraDashboard.tsx atau file auth/session.
Tunjukkan kode persis bagian fetch itu.

═══ STEP 2: PASTIKAN CEK STATUS DILAKUKAN SETELAH DATA TERSEDIA ═══

Masalah paling umum: cek account_status dilakukan sebelum data selesai di-fetch,
atau userData masih null/undefined saat dicek.

Pola yang BENAR:
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function loadUser() {
      const phone = sessionStorage.getItem('user_phone'); // atau key yang dipakai
      if (!phone) { redirectToLogin(); return; }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('primary_phone', phone)
        .single();

      setUserData(data);
      setLoading(false);
    }
    loadUser();
  }, []);

  // WAJIB: jangan render apapun sampai loading selesai
  if (loading) return <LoadingSpinner />;

  // CEK STATUS — harus di sini, SETELAH loading false dan userData sudah ada
  if (userData?.account_status === 'pending_assessment') {
    return <PendingAssessmentGate userData={userData} />;
  }

  // baru render dashboard normal
  return <Dashboard userData={userData} />;

═══ STEP 3: PRINT/LOG UNTUK VERIFY ═══

Tambahkan sementara console.log tepat sebelum cek:

  console.log('account_status:', userData?.account_status);
  console.log('userData:', userData);

Ini untuk confirm apakah field account_status terbaca atau tidak.
Kalau undefined berarti fetch belum selesai atau field tidak ikut ter-select.

═══ STEP 4: PASTIKAN SELECT MENGAMBIL account_status ═══

Pastikan query Supabase tidak pakai select terbatas yang skip field ini.
Yang BENAR: .select('*')
Yang SALAH: .select('name, plan_name, score_total') — ini tidak include account_status

═══ STEP 5: VERIFY PendingAssessmentGate TIDAK LANGSUNG CLOSE ═══

Pastikan di dalam komponen PendingAssessmentGate tidak ada logic yang
auto-close atau auto-redirect ke dashboard. Harus stuck di halaman ini
sampai user benar-benar submit assessment dan update berhasil.

═══ STEP 6: SETELAH SUBMIT ASSESSMENT — WAJIB REFETCH ═══

Setelah PATCH/UPDATE ke Supabase berhasil (account_status jadi 'active'),
jangan hanya reload. Lakukan ini:

  // 1. update sessionStorage jika ada
  sessionStorage.setItem('account_status', 'active');

  // 2. force refetch user data dari Supabase (bukan dari cache)
  const { data: refreshed } = await supabase
    .from('users')
    .select('*')
    .eq('primary_phone', currentPhone)
    .single();

  setUserData(refreshed);  // update state → React re-render → masuk dashboard

  // ATAU kalau pakai window.location.reload(), pastikan tidak ada
  // sessionStorage/cache yang menyimpan status lama

═══ YANG TIDAK PERLU DIUBAH ═══
- Flow login yang sudah ada
- Logic dashboard untuk user normal (account_status = 'active')
- Semua komponen lain