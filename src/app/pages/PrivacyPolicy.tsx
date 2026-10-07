import { Link } from 'react-router';
import { useEffect } from 'react';
import '../components/LegalPage.css';
import { Footer } from '../components/Footer';
import { MiraIcon } from '../components/icons/MiraIcon';

const TOC = [
  { id: 'intro',       label: 'Pendahuluan' },
  { id: 'data',        label: 'Data yang Kami Kumpulkan' },
  { id: 'use',         label: 'Penggunaan Data' },
  { id: 'ai',          label: 'Pemrosesan AI & Suara' },
  { id: 'share',       label: 'Pihak Ketiga' },
  { id: 'storage',     label: 'Penyimpanan & Keamanan' },
  { id: 'rights',      label: 'Hak Pengguna' },
  { id: 'cookies',     label: 'Cookie & Penyimpanan Lokal' },
  { id: 'children',    label: 'Layanan untuk Anak-Anak' },
  { id: 'changes',     label: 'Perubahan Kebijakan' },
  { id: 'contact',     label: 'Hubungi Kami' },
];

export function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="legal-root">
      {/* Top bar */}
      <div className="legal-topbar">
        <Link to="/" className="legal-topbar-logo">MIRA</Link>
        <Link to="/" className="legal-topbar-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Kembali ke Beranda
        </Link>
      </div>

      <div className="legal-layout">
        {/* Sidebar TOC */}
        <aside className="legal-toc">
          <div className="legal-toc-title">Isi Dokumen</div>
          <ul className="legal-toc-list">
            {TOC.map(item => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </aside>

        {/* Content */}
        <main className="legal-content">
          {/* Hero */}
          <div className="legal-hero">
            <div className="legal-badge"><MiraIcon name="lock" size={20} tile={false} /> Privasi</div>
            <h1 className="legal-title">Kebijakan Privasi</h1>
            <div className="legal-meta">
              <span><MiraIcon name="calendar-check" size={20} tile={false} /> Berlaku sejak: 1 Januari 2025</span>
              <span><MiraIcon name="cycle-coin" size={20} tile={false} /> Terakhir diperbarui: 7 Oktober 2026</span>
            </div>
          </div>

          <section className="legal-section" id="intro">
            <h2 className="legal-section-title">
              <span className="legal-section-num">1</span>
              Pendahuluan
            </h2>
            <p className="legal-p">
              MIRA ("kami") adalah aplikasi web pencatat keuangan pribadi dengan bantuan AI yang dapat diakses di <strong>halo-mira.com</strong> — lewat browser atau dipasang ke layar utama perangkat Anda. Kami menghormati privasi Anda dan berkomitmen melindungi data pribadi yang Anda berikan.
            </p>
            <p className="legal-p">
              Kebijakan ini menjelaskan data apa yang kami kumpulkan, untuk apa, siapa saja yang ikut memprosesnya, berapa lama disimpan, dan hak Anda atas data tersebut, sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi.
            </p>
            <div className="legal-box">
              <p>
                Dengan membuat akun dan menggunakan MIRA, Anda menyetujui pemrosesan data sebagaimana dijelaskan di sini. Jika tidak setuju, mohon jangan menggunakan layanan.
              </p>
            </div>
          </section>

          <section className="legal-section" id="data">
            <h2 className="legal-section-title">
              <span className="legal-section-num">2</span>
              Data yang Kami Kumpulkan
            </h2>
            <p className="legal-p"><strong>a. Data akun</strong></p>
            <ul className="legal-ul">
              <li>Nama dan alamat email</li>
              <li>Jika masuk dengan Google: nama, email, dan foto profil dari akun Google Anda</li>
              <li>Jika masuk dengan email: password Anda disimpan oleh penyedia autentikasi dalam bentuk ter-hash — kami tidak pernah melihat password asli</li>
            </ul>

            <p className="legal-p"><strong>b. Jawaban assessment</strong></p>
            <ul className="legal-ul">
              <li>Jawaban kuesioner saat mendaftar (kisaran penghasilan, pola gajian, kebiasaan belanja, dana darurat, investasi, utang, bank & e-wallet yang dipakai, tujuan menabung) dan skor kesehatan finansial yang dihitung darinya</li>
            </ul>

            <p className="legal-p"><strong>c. Data keuangan yang Anda catat</strong></p>
            <ul className="legal-ul">
              <li>Transaksi (nominal, kategori, merchant, keterangan, tanggal, wallet) beserta rincian item jika ada</li>
              <li>Target tabungan dan riwayat setorannya, aset, piutang, split bill, limit bulanan, dan pengingat</li>
              <li>Riwayat percakapan teks dengan Chat MIRA</li>
            </ul>

            <p className="legal-p"><strong>d. Foto struk & suara</strong></p>
            <ul className="legal-ul">
              <li>Foto struk dan rekaman voice note dikirim untuk diproses saat itu juga. <strong>File foto dan rekamannya tidak kami simpan</strong> — yang tersimpan hanya hasil catatannya (teks dan angka)</li>
            </ul>

            <p className="legal-p"><strong>e. Data langganan & pembayaran</strong></p>
            <ul className="legal-ul">
              <li>Paket, masa aktif, voucher yang dipakai, dan status order pembayaran</li>
              <li>Pembayaran diproses Midtrans. Kami <strong>tidak menerima dan tidak menyimpan</strong> nomor kartu, rekening, atau PIN Anda</li>
            </ul>

            <p className="legal-p"><strong>f. Data teknis</strong></p>
            <ul className="legal-ul">
              <li>Sesi login dan preferensi tampilan yang disimpan di browser Anda (local storage)</li>
              <li>Log standar di sisi server penyedia infrastruktur (alamat IP, waktu akses, jenis browser) untuk keamanan dan penanganan gangguan</li>
            </ul>
          </section>

          <section className="legal-section" id="use">
            <h2 className="legal-section-title">
              <span className="legal-section-num">3</span>
              Penggunaan Data
            </h2>
            <p className="legal-p">Data Anda kami gunakan untuk:</p>
            <ul className="legal-ul">
              <li>Mencatat, mengelompokkan, dan menampilkan keuangan Anda di dashboard</li>
              <li>Menyusun insight — misalnya membandingkan pengeluaran dengan rencana dari assessment dan limit Anda</li>
              <li>Mengelola langganan, trial, dan memproses pembayaran</li>
              <li>Mengirim email penting: konfirmasi akun, reset password, dan pengingat masa langganan (trial hampir habis, H-7, H-1, dan saat berakhir)</li>
              <li>Menjaga keamanan akun dan mencegah penyalahgunaan</li>
              <li>Menjawab pertanyaan saat Anda menghubungi kami</li>
            </ul>
            <div className="legal-box warning">
              <p>
                <MiraIcon name="warn" size={20} tile={false} /> Kami <strong>tidak</strong> menjual data Anda, tidak memakainya untuk iklan, dan tidak membagikannya untuk keperluan pemasaran pihak lain.
              </p>
            </div>
          </section>

          <section className="legal-section" id="ai">
            <h2 className="legal-section-title">
              <span className="legal-section-num">4</span>
              Pemrosesan AI & Suara
            </h2>
            <ul className="legal-ul">
              <li><strong>Fitur AI</strong> (Chat MIRA, Catat pakai AI, scan struk, split bill pintar): teks, foto, atau voice note yang Anda kirim diteruskan ke penyedia model AI melalui OpenRouter (misalnya Google Gemini dan OpenAI) hanya untuk memproses permintaan tersebut</li>
              <li><strong>Dikte langsung</strong> (teks muncul saat Anda bicara): menggunakan layanan pengenalan suara bawaan browser/perangkat Anda — Google untuk Chrome, Apple untuk Safari — sesuai kebijakan privasi mereka. Jika tidak tersedia, MIRA merekam voice note dan memprosesnya lewat penyedia AI di atas</li>
              <li>Hasil AI bisa keliru. Karena itu MIRA selalu menampilkan hasilnya dulu untuk Anda cek sebelum disimpan</li>
            </ul>
          </section>

          <section className="legal-section" id="share">
            <h2 className="legal-section-title">
              <span className="legal-section-num">5</span>
              Pihak Ketiga yang Memproses Data
            </h2>
            <p className="legal-p">Untuk menjalankan layanan, kami memakai penyedia berikut. Masing-masing hanya menerima data yang diperlukan untuk tugasnya:</p>
            <ul className="legal-ul">
              <li><strong>Supabase</strong> — database, autentikasi login, dan server function (server di Sydney, Australia)</li>
              <li><strong>Vercel</strong> — hosting aplikasi web</li>
              <li><strong>OpenRouter</strong> beserta penyedia model AI-nya — pemrosesan fitur AI</li>
              <li><strong>Google</strong> — login dengan akun Google (jika Anda memilihnya)</li>
              <li><strong>Midtrans</strong> — pemrosesan pembayaran</li>
              <li><strong>Resend</strong> — pengiriman email</li>
              <li><strong>Penegak hukum</strong> — hanya jika diwajibkan oleh hukum yang berlaku di Indonesia</li>
            </ul>
          </section>

          <section className="legal-section" id="storage">
            <h2 className="legal-section-title">
              <span className="legal-section-num">6</span>
              Penyimpanan & Keamanan
            </h2>
            <ul className="legal-ul">
              <li>Semua koneksi ke MIRA dienkripsi (HTTPS/TLS); data yang tersimpan dienkripsi oleh penyedia infrastruktur</li>
              <li>Data Anda disimpan dan diproses di luar Indonesia (antara lain Australia) oleh penyedia di atas, dengan perlindungan yang setara sesuai UU PDP</li>
              <li><strong>Selama akun ada</strong>, data disimpan — termasuk saat langganan berakhir (akun jadi mode baca saja, riwayat tetap bisa dilihat dan diekspor)</li>
              <li><strong>Saat Anda menghapus akun</strong>, data akun, keuangan, dan riwayat chat dihapus dari database kami saat itu juga. Salinan cadangan otomatis di penyedia infrastruktur dapat bertahan sementara sesuai siklus cadangan mereka sebelum terhapus</li>
              <li>Catatan transaksi pembayaran dapat kami simpan lebih lama bila diwajibkan peraturan (misalnya perpajakan)</li>
            </ul>
          </section>

          <section className="legal-section" id="rights">
            <h2 className="legal-section-title">
              <span className="legal-section-num">7</span>
              Hak Pengguna
            </h2>
            <p className="legal-p">Anda berhak:</p>
            <ul className="legal-ul">
              <li><strong>Mengakses & membawa data</strong> — unduh transaksi Anda kapan saja lewat menu <strong>Export Data</strong> (Excel/CSV)</li>
              <li><strong>Memperbaiki data</strong> — edit transaksi, target, aset, piutang, dan profil langsung di dashboard</li>
              <li><strong>Menghapus data</strong> — hapus transaksi satu per satu, atau hapus seluruh akun di <strong>Pengaturan → Hapus Akun</strong></li>
              <li><strong>Menarik persetujuan & keberatan</strong> atas pemrosesan tertentu dengan menghubungi kami</li>
            </ul>
            <p className="legal-p">
              Untuk permintaan lain terkait data Anda, email <a href="mailto:support@halo-mira.com" style={{color:'#2D4BFF'}}>support@halo-mira.com</a>. Kami merespons dalam <strong>14 hari kerja</strong>.
            </p>
          </section>

          <section className="legal-section" id="cookies">
            <h2 className="legal-section-title">
              <span className="legal-section-num">8</span>
              Cookie & Penyimpanan Lokal
            </h2>
            <ul className="legal-ul">
              <li>MIRA menyimpan sesi login dan preferensi (misalnya mode gelap dan tampilan) di penyimpanan lokal browser Anda agar Anda tetap masuk</li>
              <li>Kami <strong>tidak</strong> memasang cookie iklan atau pelacak pihak ketiga</li>
              <li>Saat Anda memakai tombol masuk dengan Google, Google dapat menyimpan cookie-nya sendiri sesuai kebijakan Google</li>
            </ul>
          </section>

          <section className="legal-section" id="children">
            <h2 className="legal-section-title">
              <span className="legal-section-num">9</span>
              Layanan untuk Anak-Anak
            </h2>
            <p className="legal-p">
              MIRA ditujukan untuk pengguna berusia <strong>17 tahun ke atas</strong>. Kami tidak secara sadar mengumpulkan data anak di bawah umur. Jika kami mengetahuinya, data tersebut akan segera dihapus.
            </p>
          </section>

          <section className="legal-section" id="changes">
            <h2 className="legal-section-title">
              <span className="legal-section-num">10</span>
              Perubahan Kebijakan
            </h2>
            <p className="legal-p">
              Kami dapat memperbarui kebijakan ini. Perubahan penting akan kami beritahukan lewat dashboard MIRA dan/atau email ke alamat akun Anda sebelum berlaku. Tanggal "terakhir diperbarui" di atas selalu menunjukkan versi terbaru.
            </p>
          </section>

          <section className="legal-section" id="contact">
            <h2 className="legal-section-title">
              <span className="legal-section-num">11</span>
              Hubungi Kami
            </h2>
            <p className="legal-p">Pertanyaan atau permintaan terkait privasi:</p>
            <div className="legal-contact-block">
              <p><strong>MIRA</strong></p>
              <p>Email: <a href="mailto:support@halo-mira.com">support@halo-mira.com</a></p>
              <p style={{marginTop:'8px', color:'#94A3B8', fontSize:'0.8rem'}}>Jam respons: Senin–Jumat, 09.00–18.00 WIB</p>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
