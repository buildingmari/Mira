import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';

/**
 * Fix mobile zoom issues:
 * 1. Viewport meta → maximum-scale=1 mencegah auto-zoom & pinch-zoom berlebihan
 * 2. touch-action: manipulation → mencegah double-tap zoom di seluruh app
 * 3. font-size ≥ 16px pada semua input → mencegah iOS Safari auto-zoom saat fokus
 */
function MobileZoomFix() {
  useEffect(() => {
    // 1. Pastikan viewport meta sudah benar
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

    // 2. Inject global CSS: touch-action + input font-size fix
    const styleId = 'mira-mobile-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Cegah double-tap zoom di seluruh halaman */
        html, body { touch-action: manipulation; }

        /* Cegah iOS Safari auto-zoom saat focus input (terjadi jika font-size < 16px).
           TANPA !important agar inline style komponen (mis. OTP 1.7rem) tetap bisa override. */
        input:not([style*="font-size"]),
        select:not([style*="font-size"]),
        textarea:not([style*="font-size"]) {
          font-size: 16px;
        }

        /* Pastikan semua button & link tidak trigger double-tap zoom */
        button, a, [role="button"] {
          touch-action: manipulation;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <MobileZoomFix />
      <RouterProvider router={router} />
    </>
  );
}