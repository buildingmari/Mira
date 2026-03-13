import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';
import { LandingWrapper } from './pages/LandingWrapper';
import { RootLayout, RootErrorBoundary, NotFound } from './pages/RootLayout';
import { PaymentSuccessPage } from './pages/payment-success';
import { PaymentPendingPage } from './pages/payment-pending';
import { PaymentFailedPage }  from './pages/payment-failed';

// Lazy-load the heavy dashboard to keep initial bundle small
const MiraDashboard = lazy(() =>
  import('./pages/MiraDashboard').then((m) => ({ default: m.MiraDashboard }))
);

function DashboardPage() {
  return (
    <Suspense fallback={<div style={{height:'100vh',background:'#F8FAFC'}} />}>
      <MiraDashboard />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: LandingWrapper },
      { path: 'dashboard',        Component: DashboardPage },
      { path: 'payment-success',  Component: PaymentSuccessPage },
      { path: 'payment-pending',  Component: PaymentPendingPage },
      { path: 'payment-failed',   Component: PaymentFailedPage },
      { path: '*',                Component: NotFound },
    ],
  },
]);