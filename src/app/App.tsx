import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './components/theme-provider';
import { UserSessionProvider } from './context/user-session-context';

function MobileZoomFix() {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

    const styleId = 'mira-mobile-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html, body { touch-action: manipulation; }
        input:not([style*="font-size"]),
        select:not([style*="font-size"]),
        textarea:not([style*="font-size"]) {
          font-size: 16px;
        }
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
    <ThemeProvider defaultTheme="light" storageKey="mira-theme">
      <UserSessionProvider>
        <MobileZoomFix />
        <RouterProvider router={router} />
      </UserSessionProvider>
    </ThemeProvider>
  );
}
