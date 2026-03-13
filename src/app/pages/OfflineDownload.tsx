import { useEffect, useState } from 'react';

export function OfflineDownload() {
  const [copied, setCopied] = useState(false);
  const filePath = '/mira-landing-offline.html';

  // Trigger auto-download
  useEffect(() => {
    const a = document.createElement('a');
    a.href = filePath;
    a.download = 'mira-landing-offline.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(45,75,255,.12), 0 4px 16px rgba(0,0,0,.06)',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📥</div>

        <div style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800,
          fontSize: '1.5rem',
          background: 'linear-gradient(135deg, #2D4BFF, #22D3EE)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
        }}>
          MIRA Offline Page
        </div>

        <p style={{ color: '#64748B', fontSize: '.9rem', lineHeight: 1.7, marginBottom: '28px' }}>
          File <strong style={{ color: '#0F172A' }}>mira-landing-offline.html</strong> sedang didownload otomatis.
          Buka file tersebut di browser untuk tampilan landing page offline yang lengkap.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {/* Download button */}
          <a
            href={filePath}
            download="mira-landing-offline.html"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #2D4BFF, #22D3EE)',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: '100px',
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: '.9rem',
              textDecoration: 'none',
              transition: 'opacity .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            ⬇️ Download Ulang HTML
          </a>

          {/* Copy URL */}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'transparent',
              color: '#2D4BFF',
              padding: '13px 28px',
              borderRadius: '100px',
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: '.9rem',
              border: '1.5px solid #2D4BFF',
              cursor: 'pointer',
              transition: 'background .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E9EDFF')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {copied ? '✅ URL Disalin!' : '🔗 Salin URL File'}
          </button>
        </div>

        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '14px 16px',
          fontSize: '.8rem',
          color: '#64748B',
          lineHeight: 1.7,
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <strong style={{ color: '#0F172A' }}>📌 Cara Buka Offline:</strong><br/>
          1. Download file HTML di atas<br/>
          2. Buka file <code style={{ background: '#E9EDFF', borderRadius: '4px', padding: '1px 5px', color: '#2D4BFF' }}>mira-landing-offline.html</code> langsung di browser<br/>
          3. Semua design & flow akan berjalan tanpa internet
        </div>

        <a
          href="/"
          style={{
            color: '#94A3B8',
            fontSize: '.82rem',
            textDecoration: 'underline',
            transition: 'color .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#2D4BFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
        >
          ← Kembali ke Landing Page
        </a>
      </div>
    </div>
  );
}
