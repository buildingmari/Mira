import { Link } from 'react-router';
import { useEffect } from 'react';
import '../components/LegalPage.css';
import { Footer } from '../components/Footer';

const TOC = [
  { id: 'intro',       label: 'Pendahuluan' },
  { id: 'data',        label: 'Data yang Kami Kumpulkan' },
  { id: 'use',         label: 'Penggunaan Data' },
  { id: 'share',       label: 'Berbagi Data dengan Pihak Ketiga' },
  { id: 'storage',     label: 'Penyimpanan & Keamanan' },
  { id: 'rights',      label: 'Hak Pengguna' },
  { id: 'cookies',     label: 'Cookie & Pelacakan' },
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
            <div className="legal-badge">🔒 Privasi</div>
            <h1 className="legal-title">Kebijakan Privasi</h1>
            <div className="legal-meta">
              <span>📅 Berlaku sejak: 1 Januari 2025</span>
              <span>🔄 Terakhir diperbarui: 17 Maret 2025</span>
            </div>
          </div>

          {/* 1. Pendahuluan */}
          <section className="legal-section" id="intro">
            <h2 className="legal-section-title">
              <span className="legal-section-num">1</span>
              Pendahuluan
            </h2>
            <p className="legal-p">
              PT. Mira Teknologi Indonesia ("MIRA", "kami", "kita") menghormati privasi Anda dan berkomitmen untuk melindungi data pribadi yang Anda berikan saat menggunakan layanan MIRA — asisten pencatat keuangan berbasis WhatsApp.
            </p>
            <p className="legal-p">
              Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda ketika mengakses layanan melalui platform WhatsApp maupun dashboard web di <strong>getmira.id</strong>.
            </p>
            <div className="legal-box">
              <p>
                Dengan menggunakan layanan MIRA, Anda menyetujui pengumpulan dan penggunaan informasi sebagaimana dijelaskan dalam kebijakan ini. Jika Anda tidak setuju, mohon hentikan penggunaan layanan.
              </p>
            </div>
          </section>

          {/* 2. Data yang Dikumpulkan */}
          <section className="legal-section" id="data">
            <h2 className="legal-section-title">
              <span className="legal-section-num">2</span>
              Data yang Kami Kumpulkan
            </h2>
            <p className="legal-p">Kami mengumpulkan beberapa kategori data berikut:</p>

            <p className="legal-p"><strong>a. Data Identitas & Akun</strong></p>
            <ul className="legal-ul">
              <li>Nomor WhatsApp yang Anda gunakan untuk mendaftar</li>
              <li>Nama tampilan (jika diberikan)</li>
              <li>Alamat email (untuk penerima laporan opsional)</li>
            </ul>

            <p className="legal-p"><strong>b. Data Transaksi Keuangan</strong></p>
            <ul className="legal-ul">
              <li>Pesan yang Anda kirimkan ke MIRA via WhatsApp berisi informasi pengeluaran</li>
              <li>Nominal, kategori, metode pembayaran, dan tanggal transaksi yang diinput</li>
              <li>Catatan atau deskripsi tambahan yang Anda sertakan secara sukarela</li>
            </ul>

            <p className="legal-p"><strong>c. Data Teknis</strong></p>
            <ul className="legal-ul">
              <li>Alamat IP dan informasi browser saat mengakses dashboard web</li>
              <li>Data penggunaan fitur (tombol yang diklik, halaman yang dikunjungi)</li>
              <li>Waktu dan frekuensi penggunaan layanan</li>
            </ul>

            <p className="legal-p"><strong>d. Data Pembayaran</strong></p>
            <ul className="legal-ul">
              <li>Kami <strong>tidak menyimpan</strong> data kartu kredit/debit Anda secara langsung</li>
              <li>Proses pembayaran dilakukan melalui payment gateway pihak ketiga yang bersertifikasi PCI-DSS</li>
              <li>Kami hanya menyimpan status transaksi, tanggal, dan paket yang dibeli</li>
            </ul>
          </section>

          {/* 3. Penggunaan Data */}
          <section className="legal-section" id="use">
            <h2 className="legal-section-title">
              <span className="legal-section-num">3</span>
              Penggunaan Data
            </h2>
            <p className="legal-p">Data yang kami kumpulkan digunakan untuk:</p>
            <ul className="legal-ul">
              <li>Menjalankan dan meningkatkan layanan pencatatan keuangan otomatis MIRA</li>
              <li>Memproses dan memverifikasi transaksi pembayaran langganan</li>
              <li>Mengirimkan laporan keuangan mingguan/bulanan kepada Anda</li>
              <li>Mendeteksi dan mencegah penipuan serta penyalahgunaan layanan</li>
              <li>Memberikan dukungan pelanggan ketika Anda menghubungi kami</li>
              <li>Melakukan analisis agregat (anonim) untuk pengembangan produk</li>
              <li>Mengirimkan pengumuman penting terkait layanan (bukan iklan)</li>
            </ul>
            <div className="legal-box warning">
              <p>
                ⚠️ Kami <strong>tidak</strong> menggunakan data transaksi keuangan pribadi Anda untuk keperluan periklanan, profiling komersial, atau dijual kepada pihak ketiga manapun.
              </p>
            </div>
          </section>

          {/* 4. Berbagi Data */}
          <section className="legal-section" id="share">
            <h2 className="legal-section-title">
              <span className="legal-section-num">4</span>
              Berbagi Data dengan Pihak Ketiga
            </h2>
            <p className="legal-p">
              Kami hanya berbagi data kepada pihak ketiga dalam kondisi terbatas berikut:
            </p>
            <ul className="legal-ul">
              <li><strong>Penyedia infrastruktur cloud</strong> (penyimpanan data terenkripsi) — terikat perjanjian kerahasiaan</li>
              <li><strong>WhatsApp / Meta</strong> — sebagai platform perpesanan yang kami gunakan, tunduk pada kebijakan privasi Meta</li>
              <li><strong>Payment gateway</strong> (Midtrans/Xendit) — untuk memproses pembayaran langganan</li>
              <li><strong>Penegak hukum</strong> — jika diwajibkan oleh hukum yang berlaku di Indonesia</li>
            </ul>
            <p className="legal-p">
              Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.
            </p>
          </section>

          {/* 5. Penyimpanan & Keamanan */}
          <section className="legal-section" id="storage">
            <h2 className="legal-section-title">
              <span className="legal-section-num">5</span>
              Penyimpanan & Keamanan
            </h2>
            <p className="legal-p">
              Data Anda disimpan di server yang berlokasi di Indonesia dan/atau Singapura dengan standar keamanan berikut:
            </p>
            <ul className="legal-ul">
              <li>Enkripsi data saat transit (TLS 1.3) dan saat tersimpan (AES-256)</li>
              <li>Kontrol akses berbasis peran — hanya tim teknis berwenang yang dapat mengakses data</li>
              <li>Pencadangan otomatis harian dengan retensi 30 hari</li>
              <li>Audit log untuk setiap akses data sensitif</li>
            </ul>
            <p className="legal-p">
              Data akun aktif disimpan selama masa berlangganan aktif. Data akan dihapus permanen <strong>90 hari</strong> setelah akun dinonaktifkan atau Anda meminta penghapusan.
            </p>
          </section>

          {/* 6. Hak Pengguna */}
          <section className="legal-section" id="rights">
            <h2 className="legal-section-title">
              <span className="legal-section-num">6</span>
              Hak Pengguna
            </h2>
            <p className="legal-p">
              Sesuai dengan regulasi perlindungan data yang berlaku, Anda memiliki hak:
            </p>
            <ul className="legal-ul">
              <li><strong>Hak Akses</strong> — meminta salinan data pribadi yang kami simpan tentang Anda</li>
              <li><strong>Hak Koreksi</strong> — memperbarui atau memperbaiki data yang tidak akurat</li>
              <li><strong>Hak Penghapusan</strong> — meminta penghapusan data Anda ("hak untuk dilupakan")</li>
              <li><strong>Hak Portabilitas</strong> — mendapatkan ekspor data transaksi Anda dalam format CSV/JSON</li>
              <li><strong>Hak Keberatan</strong> — menolak pemrosesan data untuk tujuan tertentu</li>
            </ul>
            <p className="legal-p">
              Untuk mengajukan permintaan terkait hak-hak ini, hubungi kami melalui email <a href="mailto:privacy@getmira.id" style={{color:'#2D4BFF'}}>privacy@getmira.id</a>. Kami akan merespons dalam <strong>14 hari kerja</strong>.
            </p>
          </section>

          {/* 7. Cookie */}
          <section className="legal-section" id="cookies">
            <h2 className="legal-section-title">
              <span className="legal-section-num">7</span>
              Cookie & Pelacakan
            </h2>
            <p className="legal-p">
              Dashboard web MIRA menggunakan cookie terbatas untuk:
            </p>
            <ul className="legal-ul">
              <li>Menjaga sesi login Anda tetap aktif (cookie sesi — wajib)</li>
              <li>Mengingat preferensi tampilan Anda (cookie fungsional)</li>
              <li>Analitik penggunaan anonim untuk peningkatan produk (dapat dinonaktifkan)</li>
            </ul>
            <p className="legal-p">
              Kami tidak menggunakan cookie pihak ketiga untuk periklanan lintas situs. Anda dapat mengelola cookie melalui pengaturan browser.
            </p>
          </section>

          {/* 8. Anak-anak */}
          <section className="legal-section" id="children">
            <h2 className="legal-section-title">
              <span className="legal-section-num">8</span>
              Layanan untuk Anak-Anak
            </h2>
            <p className="legal-p">
              Layanan MIRA ditujukan untuk pengguna berusia <strong>17 tahun ke atas</strong>. Kami tidak secara sadar mengumpulkan data dari anak-anak di bawah umur. Jika kami mengetahui ada data pengguna di bawah 17 tahun, data tersebut akan segera dihapus.
            </p>
          </section>

          {/* 9. Perubahan */}
          <section className="legal-section" id="changes">
            <h2 className="legal-section-title">
              <span className="legal-section-num">9</span>
              Perubahan Kebijakan
            </h2>
            <p className="legal-p">
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui:
            </p>
            <ul className="legal-ul">
              <li>Pesan WhatsApp dari akun MIRA resmi</li>
              <li>Notifikasi di dashboard web</li>
              <li>Email (jika Anda mendaftarkan email)</li>
            </ul>
            <p className="legal-p">
              Penggunaan layanan yang berkelanjutan setelah tanggal efektif perubahan dianggap sebagai penerimaan kebijakan baru.
            </p>
          </section>

          {/* 10. Kontak */}
          <section className="legal-section" id="contact">
            <h2 className="legal-section-title">
              <span className="legal-section-num">10</span>
              Hubungi Kami
            </h2>
            <p className="legal-p">
              Jika Anda memiliki pertanyaan, kekhawatiran, atau ingin mengajukan permintaan terkait privasi data Anda, silakan hubungi kami:
            </p>
            <div className="legal-contact-block">
              <p><strong>PT. Mira Teknologi Indonesia</strong></p>
              <p>Email privasi: <a href="mailto:privacy@getmira.id">privacy@getmira.id</a></p>
              <p>Email umum: <a href="mailto:hi@getmira.id">hi@getmira.id</a></p>
              <p>WhatsApp: <a href="https://wa.me/6281234567890">+62 812-3456-7890</a></p>
              <p style={{marginTop:'8px', color:'#94A3B8', fontSize:'0.8rem'}}>Jam respons: Senin–Jumat, 09.00–18.00 WIB (MIRA bot aktif 24/7)</p>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}