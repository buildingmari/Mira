// ============================================================
// INSTRUKSI PERUBAHAN STRUKTUR HERO.TSX
// ============================================================
// 
// MASALAH UTAMA: HeroRibbon sebelumnya ada di DALAM card/hero-right
// yang punya overflow:hidden + border-radius → ribbon jadi kotak.
//
// SOLUSI: HeroRibbon harus jadi sibling dari hero-right, 
// bukan child-nya. Posisinya absolute di level hero-section.
// ============================================================

// SEBELUM (SALAH):
/*
<section className="hero-section" style={{ position: 'relative' }}>
  <div className="hero-left">
    ...text content...
  </div>
  <div className="hero-right" style={{ borderRadius: '24px', overflow: 'hidden' }}>
    <HeroRibbon />        ← SALAH: ribbon terkurung di sini
    <PhoneMockup />
  </div>
</section>
*/

// SESUDAH (BENAR):
/*
<section className="hero-section" style={{ 
  position: 'relative',   ← WAJIB
  overflow: 'hidden',     ← WAJIB (clip ribbon di tepi hero)
  minHeight: '600px'      ← sesuaikan
}}>

  <HeroRibbon />          ← PINDAH KE SINI, sebelum semua konten

  <div className="hero-left" style={{ position: 'relative', zIndex: 1 }}>
    ...text content...    ← zIndex: 1 supaya di atas ribbon
  </div>

  <div className="hero-right" style={{ 
    position: 'relative', 
    zIndex: 1,            ← zIndex: 1 supaya di atas ribbon
    // HAPUS overflow:hidden dari sini jika ada
    // HAPUS background dari sini — ribbon yang handle
  }}>
    <PhoneMockup />
  </div>

</section>
*/

// ============================================================
// JIKA PAKAI TAILWIND:
// ============================================================
/*
<section className="relative overflow-hidden min-h-[600px]">

  <HeroRibbon />

  <div className="relative z-10 ...">   ← hero-left
    ...
  </div>

  <div className="relative z-10 ...">   ← hero-right, HAPUS bg-* classes
    <PhoneMockup />
  </div>

</section>
*/

// ============================================================
// CEK LIST SEBELUM DEPLOY:
// ============================================================
// ✓ <section> hero punya: position:relative, overflow:hidden
// ✓ <HeroRibbon /> adalah CHILD LANGSUNG dari section, bukan card
// ✓ hero-left punya: position:relative, zIndex:1 (atau z-10)
// ✓ hero-right punya: position:relative, zIndex:1 (atau z-10)  
// ✓ hero-right TIDAK punya overflow:hidden
// ✓ hero-right TIDAK punya background color sendiri
