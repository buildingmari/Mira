import { Link } from 'react-router';
import { useEffect } from 'react';
import '../components/LegalPage.css';
import { Footer } from '../components/Footer';

const TOC = [
  { id: 'overview',    label: 'Ringkasan Kebijakan' },
  { id: 'guarantee',   label: 'Garansi 7 Hari' },
  { id: 'eligible',    label: 'Kondisi Refund Disetujui' },
  { id: 'ineligible',  label: 'Kondisi Refund Ditolak' },
  { id: 'table',       label: 'Tabel Refund per Skenario' },
  { id: 'cancellation', label: 'Pembatalan Langganan' },
  { id: 'downtime',    label: 'Kompensasi Gangguan Layanan' },
  { id: 'process',     label: 'Proses Pengajuan Refund' },
  { id: 'contact',     label: 'Hubungi Kami' },
];

export function RefundPolicy() {
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
            <div className="legal-badge">💸 Refund</div>
            <h1 className="legal-title">Kebijakan Pengembalian Dana</h1>
            <div className="legal-meta">
              <span>📅 Berlaku sejak: 1 Januari 2025</span>
              <span>🔄 Terakhir diperbarui: 17 Maret 2025</span>
            </div>
          </div>

          {/* 1. Overview */}
          <section className="legal-section" id="overview">
            <h2 className="legal-section-title">
              <span className="legal-section-num">1</span>
              Ringkasan Kebijakan
            </h2>
            <p className="legal-p">
              Kami membangun MIRA dengan keyakinan penuh bahwa Anda akan merasakannya bermanfaat sejak hari pertama. Namun kami mengerti — tidak semua produk cocok untuk semua orang. Kebijakan ini dirancang adil, jelas, dan pro-pengguna.
            </p>
            <div className="legal-box success">
              <p>
                ✅ <strong>Garansi Uang Kembali 7 Hari</strong> — Jika dalam 7 hari pertama setelah pembelian Anda merasa MIRA tidak sesuai ekspektasi, kami akan kembalikan pembayaran Anda penuh, tanpa pertanyaan berlebihan.
              </p>
            </div>
            <p className="legal-p">
              Di luar periode garansi 7 hari, kebijakan refund berlaku dengan kondisi tertentu sebagaimana dijelaskan di bawah. MIRA tidak menerapkan perpanjangan otomatis, sehingga Anda tidak perlu khawatir tagihan tiba-tiba muncul.
            </p>
          </section>

          {/* 2. Garansi 7 Hari */}
          <section className="legal-section" id="guarantee">
            <h2 className="legal-section-title">
              <span className="legal-section-num">2</span>
              Garansi Uang Kembali 7 Hari
            </h2>
            <p className="legal-p">
              Semua paket berbayar MIRA — baik bulanan maupun tahunan — dilindungi garansi uang kembali penuh selama <strong>7 hari kalender</strong> sejak tanggal pembayaran berhasil diverifikasi.
            </p>
            <p className="legal-p">Syarat berlakunya garansi 7 hari:</p>
            <ul className="legal-ul">
              <li>Pengajuan dilakukan dalam 7 hari sejak tanggal pembayaran (bukan tanggal mulai berlangganan)</li>
              <li>Akun belum digunakan secara ekstensif (tidak lebih dari 50 transaksi tercatat)</li>
              <li>Tidak ada indikasi penyalahgunaan atau pelanggaran Syarat &amp; Ketentuan</li>
              <li>Satu klaim garansi per nomor WhatsApp (tidak berlaku untuk perpanjangan)</li>
            </ul>
            <p className="legal-p">
              Dana dikembalikan <strong>100%</strong> ke metode pembayaran asal dalam <strong>3–7 hari kerja</strong>.
            </p>
          </section>

          {/* 3. Kondisi Disetujui */}
          <section className="legal-section" id="eligible">
            <h2 className="legal-section-title">
              <span className="legal-section-num">3</span>
              Kondisi Refund Disetujui (di luar garansi 7 hari)
            </h2>
            <p className="legal-p">
              Di luar garansi 7 hari, refund dapat diproses apabila:
            </p>
            <ul className="legal-ul">
              <li>
                <strong>Double payment / pembayaran ganda</strong> — terjadi kesalahan teknis yang menyebabkan Anda ditagih dua kali untuk periode yang sama. Refund penuh untuk pembayaran duplikat.
              </li>
              <li>
                <strong>Tagihan setelah pembatalan dikonfirmasi</strong> — jika terjadi kesalahan sistem yang menagih setelah akun resmi dibatalkan dan dikonfirmasi.
              </li>
              <li>
                <strong>Layanan tidak dapat diakses lebih dari 72 jam berturut-turut</strong> akibat gangguan teknis dari sisi MIRA (bukan dari sisi WhatsApp/Meta atau internet Anda). Refund pro-rata untuk hari tidak dapat diakses.
              </li>
              <li>
                <strong>Pembelian yang tidak sah</strong> — jika Anda dapat membuktikan akun dibobol dan digunakan oleh pihak tidak berwenang, dan laporan diajukan dalam 48 jam setelah mengetahuinya.
              </li>
            </ul>
          </section>

          {/* 4. Kondisi Ditolak */}
          <section className="legal-section" id="ineligible">
            <h2 className="legal-section-title">
              <span className="legal-section-num">4</span>
              Kondisi Refund Tidak Dapat Diproses
            </h2>
            <p className="legal-p">
              Kami tidak dapat memproses refund dalam kondisi berikut:
            </p>
            <ul className="legal-ul">
              <li>Pengajuan setelah melewati garansi 7 hari, kecuali memenuhi kondisi Pasal 3 di atas</li>
              <li>Alasan "tidak sempat menggunakan" atau "lupa ada langganan" di luar periode garansi</li>
              <li>Ketidakpuasan akibat ekspektasi yang tidak sesuai dengan deskripsi fitur yang sudah jelas tercantum</li>
              <li>Akun yang telah digunakan secara aktif (&gt;50 transaksi) melewati minggu pertama</li>
              <li>Downgrade paket dari Tahunan ke Bulanan — selisih harga tidak dapat dikembalikan</li>
              <li>Gangguan layanan WhatsApp dari pihak Meta yang bukan tanggung jawab MIRA</li>
              <li>Perubahan harga yang sudah diberitahukan 30 hari sebelumnya dan Anda tetap melanjutkan</li>
              <li>Akun yang melanggar Syarat &amp; Ketentuan dan ditangguhkan/dihapus akibat pelanggaran</li>
            </ul>
            <div className="legal-box warning">
              <p>
                ⚠️ MIRA tidak menerapkan sistem perpanjangan otomatis, sehingga tidak ada tagihan di luar yang Anda setujui secara eksplisit saat checkout.
              </p>
            </div>
          </section>

          {/* 5. Tabel */}
          <section className="legal-section" id="table">
            <h2 className="legal-section-title">
              <span className="legal-section-num">5</span>
              Tabel Ringkasan Refund per Skenario
            </h2>
            <div className="legal-table-wrap">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Skenario</th>
                    <th>Refund</th>
                    <th>Jumlah</th>
                    <th>Waktu Proses</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Garansi 7 hari (paket apapun)</td>
                    <td><span className="badge-yes">✓ Disetujui</span></td>
                    <td>100%</td>
                    <td>3–7 hari kerja</td>
                  </tr>
                  <tr>
                    <td>Double payment / tagihan ganda</td>
                    <td><span className="badge-yes">✓ Disetujui</span></td>
                    <td>100% duplikat</td>
                    <td>3–5 hari kerja</td>
                  </tr>
                  <tr>
                    <td>Downtime MIRA &gt;72 jam berturut-turut</td>
                    <td><span className="badge-yes">✓ Disetujui</span></td>
                    <td>Pro-rata harian</td>
                    <td>5–7 hari kerja</td>
                  </tr>
                  <tr>
                    <td>Pembatalan setelah 7 hari (normal)</td>
                    <td><span className="badge-no">✗ Ditolak</span></td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Tidak sempat menggunakan (&gt;7 hari)</td>
                    <td><span className="badge-no">✗ Ditolak</span></td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Downgrade paket tahunan → bulanan</td>
                    <td><span className="badge-no">✗ Ditolak</span></td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Akun dibobol (lapor &lt;48 jam)</td>
                    <td><span className="badge-yes">✓ Disetujui*</span></td>
                    <td>Dievaluasi kasus</td>
                    <td>7–14 hari kerja</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="legal-p" style={{fontSize:'0.78rem', color:'#94A3B8', marginTop:'8px'}}>
              * Refund akun dibobol memerlukan verifikasi tambahan sebelum diproses.
            </p>
          </section>

          {/* 6. Pembatalan */}
          <section className="legal-section" id="cancellation">
            <h2 className="legal-section-title">
              <span className="legal-section-num">6</span>
              Pembatalan Langganan
            </h2>
            <p className="legal-p">
              Karena MIRA tidak menerapkan perpanjangan otomatis, "pembatalan" berarti Anda memilih untuk tidak melanjutkan berlangganan di periode berikutnya.
            </p>
            <ul className="legal-ul">
              <li>Layanan tetap aktif hingga akhir periode yang sudah dibayar — tidak ada pemutusan awal</li>
              <li>Data Anda tetap bisa diakses dan diunduh selama masa aktif dan 90 hari setelahnya</li>
              <li>Tidak ada biaya penalti untuk tidak melanjutkan langganan</li>
              <li>Untuk paket tahunan yang ingin berhenti di tengah tahun: tidak ada refund pro-rata, namun layanan tetap aktif penuh hingga akhir tahun</li>
            </ul>
            <p className="legal-p">
              Untuk membatalkan/tidak melanjutkan: cukup tidak memperbarui langganan saat jatuh tempo. Tidak perlu formulir khusus, tetapi Anda bisa menghubungi support untuk konfirmasi.
            </p>
          </section>

          {/* 7. Kompensasi Downtime */}
          <section className="legal-section" id="downtime">
            <h2 className="legal-section-title">
              <span className="legal-section-num">7</span>
              Kompensasi Gangguan Layanan
            </h2>
            <p className="legal-p">
              MIRA berkomitmen menjaga uptime layanan <strong>99,5%</strong> per bulan. Jika terjadi gangguan signifikan dari sisi infrastruktur MIRA:
            </p>
            <div className="legal-table-wrap">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Durasi Gangguan (per bulan)</th>
                    <th>Kompensasi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Kurang dari 24 jam</td>
                    <td>Tidak ada kompensasi (wajar)</td>
                  </tr>
                  <tr>
                    <td>24–72 jam berturut-turut</td>
                    <td>Perpanjangan masa aktif setara durasi gangguan</td>
                  </tr>
                  <tr>
                    <td>Lebih dari 72 jam berturut-turut</td>
                    <td>Refund pro-rata + perpanjangan 1 minggu</td>
                  </tr>
                  <tr>
                    <td>Penghentian layanan total permanen</td>
                    <td>Refund penuh sisa masa aktif</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="legal-p">
              Gangguan akibat pemeliharaan terjadwal (diberitahukan minimal 24 jam sebelumnya), gangguan dari pihak WhatsApp/Meta, atau force majeure tidak masuk dalam ketentuan kompensasi ini.
            </p>
          </section>

          {/* 8. Proses */}
          <section className="legal-section" id="process">
            <h2 className="legal-section-title">
              <span className="legal-section-num">8</span>
              Proses Pengajuan Refund
            </h2>
            <p className="legal-p">
              Berikut langkah-langkah mengajukan refund:
            </p>
            <ul className="legal-ul">
              <li>
                <strong>Langkah 1:</strong> Hubungi kami via email ke <a href="mailto:support@halo-mira.com" style={{color:'#2D4BFF'}}>support@halo-mira.com</a>
              </li>
              <li>
                <strong>Langkah 2:</strong> Sertakan informasi: nomor WhatsApp terdaftar, tanggal &amp; nominal pembayaran, alasan pengajuan refund
              </li>
              <li>
                <strong>Langkah 3:</strong> Tim kami akan memverifikasi dan merespons dalam <strong>1×24 jam kerja</strong>
              </li>
              <li>
                <strong>Langkah 4:</strong> Jika disetujui, dana dikembalikan ke rekening/e-wallet/kartu asal dalam <strong>3–7 hari kerja</strong>
              </li>
            </ul>
            <div className="legal-box">
              <p>
                💡 <strong>Tips:</strong> Simpan bukti pembayaran (screenshot atau email konfirmasi) untuk mempercepat proses verifikasi.
              </p>
            </div>
            <p className="legal-p">
              Refund akan dikembalikan menggunakan metode pembayaran yang sama dengan saat transaksi awal. Jika metode pembayaran asal tidak memungkinkan (misalnya kartu sudah tidak aktif), kami akan koordinasi metode alternatif.
            </p>
          </section>

          {/* 9. Kontak */}
          <section className="legal-section" id="contact">
            <h2 className="legal-section-title">
              <span className="legal-section-num">9</span>
              Hubungi Kami
            </h2>
            <p className="legal-p">
              Ada pertanyaan soal refund atau pembayaran? Tim kami siap membantu:
            </p>
            <div className="legal-contact-block">
              <p><strong>MIRA</strong></p>
              <p>Email: <a href="mailto:support@halo-mira.com">support@halo-mira.com</a></p>
              <p style={{marginTop:'8px', color:'#94A3B8', fontSize:'0.8rem'}}>
                Jam kerja tim: Senin–Jumat, 09.00–18.00 WIB<br/>
                Target respons: &lt;4 jam di jam kerja
              </p>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
