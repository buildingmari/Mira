import { Outlet, useRouteError, isRouteErrorResponse, Navigate } from 'react-router';

export function RootLayout() {
  return <Outlet />;
}

export function RootErrorBoundary() {
  const error = useRouteError();

  // Only redirect for 404s
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <Navigate to="/" replace />;
  }

  // For other errors, render a safe fallback instead of infinite redirect
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        background: '#fff',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800,
          fontSize: '2.5rem',
          background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '16px',
        }}
      >
        MIRA
      </div>
      <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '1rem' }}>
        Sedang memuat... Mohon refresh halaman.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '100px',
          padding: '12px 28px',
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        Refresh
      </button>
    </div>
  );
}

export function NotFound() {
  return <Navigate to="/" replace />;
}
