import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';

// Lazy load route pages per ARCHITECTURE section 5
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const TodayActivityPage = lazy(() => import('../pages/TodayActivityPage'));
const AllPostsPage = lazy(() => import('../pages/AllPostsPage'));
const PostDetailModal = lazy(() => import('../pages/PostDetailModal'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

const PageLoader: React.FC = () => (
  <div className="p-8 space-y-4 animate-pulse">
    <div className="h-8 bg-surface rounded w-1/4"></div>
    <div className="h-32 bg-surface rounded"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'activity',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TodayActivityPage />
          </Suspense>
        ),
      },
      {
        // Redirect stale /create links to /activity
        path: 'create',
        element: <Navigate to="/activity" replace />,
      },
      {
        path: 'posts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AllPostsPage />
          </Suspense>
        ),
        children: [
          {
            path: ':id',
            element: (
              <Suspense fallback={null}>
                <PostDetailModal />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
