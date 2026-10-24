import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';

// Lazy load route pages per ARCHITECTURE section 5
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CreatePostPage = lazy(() => import('../pages/CreatePostPage'));
const TodayActivityPage = lazy(() => import('../pages/TodayActivityPage'));
const AllPostsPage = lazy(() => import('../pages/AllPostsPage'));
const PostDetailModal = lazy(() => import('../pages/PostDetailModal'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ConnectAccountsPage = lazy(() => import('../pages/ConnectAccountsPage'));
const ApprovalQueuePage = lazy(() => import('../pages/ApprovalQueuePage'));

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
        path: 'create',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CreatePostPage />
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
        path: 'connect',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ConnectAccountsPage />
          </Suspense>
        ),
      },
      {
        path: 'approval',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ApprovalQueuePage />
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
