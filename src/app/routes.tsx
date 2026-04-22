import { createBrowserRouter } from 'react-router';
import { LandingWrapper } from './pages/LandingWrapper';
import { RootLayout, RootErrorBoundary, NotFound } from './pages/RootLayout';
import { PaymentSuccessPage } from './pages/payment-success';
import { PaymentPendingPage } from './pages/payment-pending';
import { PaymentFailedPage }  from './pages/payment-failed';
import { PrivacyPolicy }      from './pages/PrivacyPolicy';
import { TermsOfService }     from './pages/TermsOfService';
import { RefundPolicy }       from './pages/RefundPolicy';

// Dashboard layout + sub-pages
import { DashboardLayout }       from './pages/dashboard/layout';
import { DashboardOverview }     from './pages/dashboard/overview';
import { DashboardTransactions } from './pages/dashboard/transactions';
import { DashboardGoals }        from './pages/dashboard/goals';
import { DashboardInsights }     from './pages/dashboard/insights';
import { DashboardSettings }     from './pages/dashboard/settings';
import { DashboardExport }       from './pages/dashboard/export';
import { DashboardAffiliate }    from './pages/dashboard/affiliate';
import { DashboardAssets }       from './pages/dashboard/assets';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: LandingWrapper },

      {
        path: 'dashboard',
        Component: DashboardLayout,
        children: [
          { index: true,                Component: DashboardOverview },
          { path: 'transactions',       Component: DashboardTransactions },
          { path: 'goals',              Component: DashboardGoals },
          { path: 'insights',           Component: DashboardInsights },
          { path: 'settings',           Component: DashboardSettings },
          { path: 'export',             Component: DashboardExport },
          { path: 'affiliate',          Component: DashboardAffiliate },
          { path: 'assets',             Component: DashboardAssets },
        ],
      },

      { path: 'payment-success',  Component: PaymentSuccessPage },
      { path: 'payment-pending',  Component: PaymentPendingPage },
      { path: 'payment-failed',   Component: PaymentFailedPage },
      { path: 'privacy-policy',   Component: PrivacyPolicy },
      { path: 'terms-of-service', Component: TermsOfService },
      { path: 'refund-policy',    Component: RefundPolicy },
      { path: '*',                Component: NotFound },
    ],
  },
]);
