import { useEffect, useState } from 'react';
import './Navigation.css';

interface NavigationProps {
  onCTAClick: () => void;
  onLoginClick?: () => void;
}

export function Navigation({ onCTAClick, onLoginClick }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen]);

  return (
    <>
      {/* ── Desktop nav ── */}
      <nav id="navbar" className={`nav-desktop ${scrolled ? 'scrolled' : ''}`}>
        <div className={`nav-logo ${scrolled ? 'nav-logo-scrolled' : 'nav-logo-top'}`}>MIRA</div>
        <ul className="nav-links">
          <li><a href="#fitur">Fitur</a></li>
          <li><a href="#cara-kerja">Cara Kerja</a></li>
          <li><a href="#testimoni">Testimoni</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-right">
          {onLoginClick && (
            <button className="nav-signin" onClick={onLoginClick}>Masuk</button>
          )}
          <button className="nav-cta" onClick={onCTAClick}>Mulai sekarang</button>
        </div>
      </nav>

      {/* ── Mobile floating pill nav ── */}
      <div className={`nav-mobile-pill ${scrolled ? 'pill-scrolled' : ''}`}>
        <span className="nav-logo">MIRA</span>

        <div className="pill-right">
          <button className="pill-cta" onClick={onCTAClick}>Mulai sekarang</button>

          <button
            className="pill-burger"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            aria-label="Menu"
          >
            <span className={`burger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`burger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`burger-line ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <div
        className={`mobile-drawer ${menuOpen ? 'drawer-open' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <nav className="drawer-links">
          <a href="#fitur"       onClick={() => setMenuOpen(false)}>Fitur</a>
          <a href="#cara-kerja"  onClick={() => setMenuOpen(false)}>Cara Kerja</a>
          <a href="#testimoni"   onClick={() => setMenuOpen(false)}>Testimoni</a>
          <a href="#faq"         onClick={() => setMenuOpen(false)}>FAQ</a>
        </nav>
        <div className="drawer-actions">
          {onLoginClick && (
            <button className="drawer-signin" onClick={() => { setMenuOpen(false); onLoginClick(); }}>
              Masuk
            </button>
          )}
          <button className="drawer-cta" onClick={() => { setMenuOpen(false); onCTAClick(); }}>
            Mulai sekarang
          </button>
        </div>
      </div>
    </>
  );
}