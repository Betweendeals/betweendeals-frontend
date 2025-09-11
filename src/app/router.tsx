// 🚀 Clean Modern Router - Feature-based routing architecture
import { createBrowserRouter, RouteObject } from 'react-router-dom';
// import { AppLayout } from './layouts/app-layout';
import {
  publicRoutes,
  authRoutes,
  marketplaceRoutes,
  businessRoutes,
  userRoutes,
  redirectRoutes,
} from './routes';

// Additional specialized routes
import { lazy } from 'react';
import { LogoOnlyLayout } from '@shared/components/layouts';

const Checkout = lazy(() => import('./pages/checkout/checkout'));
const CheckoutSuccess = lazy(() => import('./pages/checkout/success/CheckoutSuccess'));
const NoPage = lazy(() => import('./pages/error/404/noPage'));

// Clean, organized route configuration
const routes: RouteObject[] = [
  // ✅ Core Feature Routes
  publicRoutes,
  marketplaceRoutes,
  businessRoutes,
  ...authRoutes,
  ...userRoutes,

  // ✅ Specialized Routes
  {
    path: '/checkout',
    element: (
      <AppLayout>
        <LogoOnlyLayout />
      </AppLayout>
    ),
    children: [{ index: true, element: <Checkout /> }],
  },
  {
    path: '/checkout/success',
    element: (
      <AppLayout>
        <LogoOnlyLayout />
      </AppLayout>
    ),
    children: [{ index: true, element: <CheckoutSuccess /> }],
  },

  // ✅ Legacy Redirects (Centralized)
  ...redirectRoutes,

  // ✅ 404 Fallback
  {
    path: '*',
    element: (
      <AppLayout>
        <NoPage />
      </AppLayout>
    ),
  },
];

// Create and export the router
export const router = createBrowserRouter(routes);

export default router;
