import { Link } from 'react-router';
import { useEffect } from 'react';
import '../components/LegalPage.css';
import { Footer } from '../components/Footer';

const TOC = [
  { id: 'intro',       label: 'Pendahuluan' },
  { id: 'service',     label: 'Deskripsi Layanan' },
  { id: 'eligibility', label: 'Syarat Pengguna' },
  { id: 'account',     label: 'Akun & Keamanan' },
  { id: 'acceptable',  label: 'Penggunaan yang Diizinkan' },
  { id: 'subscription', label: 'Langganan & Pembayaran' },
  { id: 'limitation',  label: 'Batasan Tanggung Jawab' },
  { id: 'ip',          label: 'Kekayaan Intelektual' },
  { id: 'termination', label: 'Penghentian Layanan' },
  { id: 'governing',   label: 'Hukum yang Berlaku' },
  { id: 'contact',     label: 'Hubungi Kami' },
];

export function TermsOfService() {
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
            <div className="legal-badge">📋 Legal</div>
            <h1 className="legal-title">Syarat &amp; Ketentuan</h1>
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
              Syarat dan Ketentuan ini ("S&amp;K") merupakan perjanjian hukum antara Anda ("Pengguna") dan MIRA yang mengatur penggunaan layanan asisten keuangan berbasis WhatsApp beserta semua platform pendukungnya.
            </p>
            <p className="legal-p">
              Dengan mendaftarkan akun, mengirimkan pesan ke nomor WhatsApp MIRA, atau menggunakan dashboard web kami, Anda menyatakan telah membaca, memahami, dan menyetujui S&amp;K ini.
            </p>
            <div className="legal-box">
              <p>
                Mohon baca dokumen ini dengan cermat. Jika Anda tidak setuju dengan ketentuan ini, Anda tidak diizinkan menggunakan layanan MIRA.
              </p>
            </div>
          </section>

          {/* 2. Deskripsi Layanan */}
          <section className="legal-section" id="service">
            <h2 className="legal-section-title">
              <span className="legal-section-num">2</span>
              Deskripsi Layanan
            </h2>
            <p className="legal-p">
              MIRA adalah layanan Software-as-a-Service (SaaS) yang menyediakan:
            </p>
            <ul className="legal-ul">
              <li>Pencatatan pengeluaran dan pemasukan secara otomatis via pesan WhatsApp</li>
              <li>Kategorisasi transaksi menggunakan kecerdasan buatan (AI)</li>
              <li>Dashboard web untuk visualisasi dan analisis data keuangan pribadi</li>
              <li>Laporan keuangan periodik (harian, mingguan, bulanan)</li>
              <li>Pengingat anggaran dan notifikasi batas pengeluaran</li>
            </ul>
            <div className="legal-box warning">
              <p>
                ⚠️ <strong>Penting:</strong> MIRA adalah alat bantu pencatatan pribadi. MIRA <strong>bukan</strong> software akuntansi resmi, bukan penasihat keuangan, dan bukan lembaga keuangan. Laporan yang dihasilkan tidak dapat digunakan sebagai dokumen resmi untuk keperluan perpajakan, audit, atau perbankan.
              </p>
            </div>
          </section>

          {/* 3. Syarat Pengguna */}
          <section className="legal-section" id="eligibility">
            <h2 className="legal-section-title">
              <span className="legal-section-num">3</span>
              Syarat Pengguna
            </h2>
            <p className="legal-p">Untuk menggunakan layanan MIRA, Anda harus memenuhi syarat berikut:</p>
            <ul className="legal-ul">
              <li>Berusia minimal <strong>17 tahun</strong> atau telah mendapat persetujuan orang tua/wali</li>
              <li>Memiliki nomor WhatsApp aktif yang terdaftar atas nama Anda</li>
              <li>Warga negara atau berdomisili di <strong>Indonesia</strong></li>
              <li>Memiliki kapasitas hukum untuk membuat perjanjian yang mengikat</li>
            </ul>
          </section>

          {/* 4. Akun & Keamanan */}
          <section className="legal-section" id="account">
            <h2 className="legal-section-title">
              <span className="legal-section-num">4</span>
              Akun &amp; Keamanan
            </h2>
            <p className="legal-p">
              Akun MIRA terikat pada nomor WhatsApp Anda. Anda bertanggung jawab untuk:
            </p>
            <ul className="legal-ul">
              <li>Menjaga kerahasiaan akses WhatsApp yang digunakan untuk MIRA</li>
              <li>Memastikan hanya Anda yang menggunakan akun dengan nomor tersebut</li>
              <li>Segera memberitahukan MIRA jika terdapat akses tidak sah ke akun Anda</li>
              <li>Tidak mentransfer atau meminjamkan akun kepada pihak lain</li>
            </ul>
            <p className="legal-p">
              MIRA tidak bertanggung jawab atas kerugian akibat penggunaan akun oleh pihak tidak berwenang yang disebabkan kelalaian Anda.
            </p>
          </section>

          {/* 5. Penggunaan yang Diizinkan */}
          <section className="legal-section" id="acceptable">
            <h2 className="legal-section-title">
              <span className="legal-section-num">5</span>
              Penggunaan yang Diizinkan
            </h2>
            <p className="legal-p">
              Anda <strong>diizinkan</strong> menggunakan MIRA untuk:
            </p>
            <ul className="legal-ul">
              <li>Mencatat transaksi keuangan pribadi sehari-hari</li>
              <li>Melihat dan menganalisis pola pengeluaran pribadi</li>
              <li>Mengatur anggaran bulanan untuk kebutuhan pribadi</li>
            </ul>
            <p className="legal-p">
              Anda <strong>dilarang</strong> menggunakan MIRA untuk:
            </p>
            <ul className="legal-ul">
              <li>Mencatat transaksi bisnis komersial atau perusahaan (gunakan paket Business)</li>
              <li>Mengirimkan spam, konten ilegal, atau data palsu ke sistem kami</li>
              <li>Mencoba menembus, meretas, atau memanipulasi sistem MIRA</li>
              <li>Menggunakan bot atau skrip otomatis tanpa izin tertulis</li>
              <li>Menyalahgunakan layanan dengan cara yang merugikan pengguna lain</li>
            </ul>
            <p className="legal-p">
              Pelanggaran ketentuan ini dapat mengakibatkan penangguhan atau penghapusan akun tanpa pengembalian dana.
            </p>
          </section>

          {/* 6. Langganan & Pembayaran */}
          <section className="legal-section" id="subscription">
            <h2 className="legal-section-title">
              <span className="legal-section-num">6</span>
              Langganan &amp; Pembayaran
            </h2>
            <p className="legal-p">
              MIRA menawarkan model berlangganan dengan ketentuan berikut:
            </p>
            <ul className="legal-ul">
              <li><strong>Periode langganan:</strong> Bulanan atau Tahunan, aktif sejak tanggal pembayaran berhasil</li>
              <li><strong>Perpanjangan:</strong> Langganan <strong>tidak</strong> diperpanjang otomatis — Anda perlu memperbarui secara manual</li>
              <li><strong>Harga:</strong> Tertera di halaman Harga dan dapat berubah dengan pemberitahuan 30 hari sebelumnya</li>
              <li><strong>Metode pembayaran:</strong> Transfer bank, kartu kredit/debit, e-wallet (GoPay, OVO, Dana), QRIS</li>
              <li><strong>Bukti pembayaran:</strong> Akan dikirimkan ke nomor WhatsApp dan email terdaftar</li>
            </ul>
            <p className="legal-p">
              Paket berbayar mencakup akses penuh ke semua fitur sesuai paket yang dipilih. Masa aktif dihitung sejak pembayaran terverifikasi hingga akhir periode yang dibeli.
            </p>
          </section>

          {/* 7. Batasan Tanggung Jawab */}
          <section className="legal-section" id="limitation">
            <h2 className="legal-section-title">
              <span className="legal-section-num">7</span>
              Batasan Tanggung Jawab
            </h2>
            <p className="legal-p">
              Sejauh diizinkan hukum yang berlaku, MIRA tidak bertanggung jawab atas:
            </p>
            <ul className="legal-ul">
              <li>Keputusan keuangan yang Anda ambil berdasarkan data dari MIRA</li>
              <li>Kesalahan kategorisasi AI yang tidak dilaporkan dalam 7 hari setelah transaksi</li>
              <li>Gangguan layanan akibat downtime WhatsApp/Meta di luar kendali kami</li>
              <li>Kerugian tidak langsung, insidental, atau konsekuensial dari penggunaan layanan</li>
              <li>Kehilangan data akibat bencana alam, serangan siber yang tidak dapat dicegah, atau force majeure</li>
            </ul>
            <p className="legal-p">
              Total tanggung jawab MIRA kepada Anda dalam kondisi apapun tidak akan melebihi jumlah yang Anda bayarkan dalam <strong>3 bulan terakhir</strong> sebelum klaim.
            </p>
          </section>

          {/* 8. Kekayaan Intelektual */}
          <section className="legal-section" id="ip">
            <h2 className="legal-section-title">
              <span className="legal-section-num">8</span>
              Kekayaan Intelektual
            </h2>
            <p className="legal-p">
              Seluruh elemen layanan MIRA — termasuk merek dagang, logo, desain antarmuka, kode program, model AI, dan konten editorial — merupakan kekayaan intelektual MIRA yang dilindungi hukum.
            </p>
            <p className="legal-p">
              Anda diberikan lisensi terbatas, tidak eksklusif, dan tidak dapat dipindahtangankan untuk menggunakan layanan sesuai S&amp;K ini. Data transaksi yang Anda masukkan tetap menjadi milik Anda.
            </p>
          </section>

          {/* 9. Penghentian */}
          <section className="legal-section" id="termination">
            <h2 className="legal-section-title">
              <span className="legal-section-num">9</span>
              Penghentian Layanan
            </h2>
            <p className="legal-p"><strong>Penghentian oleh Pengguna:</strong></p>
            <ul className="legal-ul">
              <li>Anda dapat menghentikan langganan kapan saja melalui WhatsApp atau dashboard</li>
              <li>Layanan tetap aktif hingga akhir periode yang telah dibayar</li>
              <li>Data Anda tersedia untuk diunduh selama 90 hari setelah penghentian</li>
            </ul>
            <p className="legal-p"><strong>Penghentian oleh MIRA:</strong></p>
            <ul className="legal-ul">
              <li>MIRA dapat menangguhkan akun yang melanggar S&amp;K ini tanpa pemberitahuan sebelumnya</li>
              <li>Untuk pelanggaran berat (penipuan, hacking), akun dapat dihapus permanen</li>
              <li>Penghentian layanan secara keseluruhan akan diberitahukan minimal 30 hari sebelumnya dengan pengembalian dana pro-rata</li>
            </ul>
          </section>

          {/* 10. Hukum */}
          <section className="legal-section" id="governing">
            <h2 className="legal-section-title">
              <span className="legal-section-num">10</span>
              Hukum yang Berlaku
            </h2>
            <p className="legal-p">
              S&amp;K ini diatur oleh dan ditafsirkan sesuai hukum Republik Indonesia, termasuk:
            </p>
            <ul className="legal-ul">
              <li>UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (ITE)</li>
              <li>UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (PDP)</li>
              <li>Peraturan Pemerintah terkait e-commerce dan layanan digital</li>
            </ul>
            <p className="legal-p">
              Setiap sengketa akan diselesaikan terlebih dahulu melalui musyawarah. Apabila tidak tercapai kesepakatan, akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI) atau Pengadilan Negeri Jakarta Selatan.
            </p>
          </section>

          {/* 11. Kontak */}
          <section className="legal-section" id="contact">
            <h2 className="legal-section-title">
              <span className="legal-section-num">11</span>
              Hubungi Kami
            </h2>
            <p className="legal-p">Pertanyaan terkait Syarat &amp; Ketentuan ini:</p>
            <div className="legal-contact-block">
              <p><strong>MIRA</strong></p>
              <p>Email: <a href="mailto:support@halo-mira.com">support@halo-mira.com</a></p>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
