import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Layers,
  BarChart3,
  Building2,
  Settings,
  Menu,
  X,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/activity', label: "Today's AI Activity", icon: Activity },
  { to: '/posts', label: 'All Posts', icon: Layers },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/profile', label: 'Business Profile', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDemo = import.meta.env.VITE_DATA_SOURCE === 'mock' || !import.meta.env.VITE_DATA_SOURCE;

  return (
    <div className="min-h-screen flex flex-col bg-background text-charcoal">
      {/* Demo Banner */}
      {isDemo && (
        <aside
          aria-label="Demo mode announcement"
          className="bg-accent-soft text-accent border-b border-accent/20 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2"
        >
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Demo mode: sample data, nothing is published</span>
        </aside>
      )}

      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm">
            PD
          </div>
          <span className="font-semibold text-charcoal tracking-tight">PostDaily</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="p-2 rounded-md text-muted hover:text-charcoal hover:bg-background transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[49px] z-40 bg-surface/95 backdrop-blur-sm p-4 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-muted hover:text-charcoal hover:bg-background'
                    )
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Fixed Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-surface p-4 shrink-0 justify-between sticky top-0 h-screen overflow-y-auto">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm shadow-subtle">
                PD
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-charcoal text-base leading-tight">PostDaily</span>
                <span className="text-[11px] text-muted leading-tight">Daily Social AI</span>
              </div>
            </div>

            {/* Business Switcher Placeholder */}
            <div className="px-2 py-2 rounded-lg bg-background border border-border text-xs">
              <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                Active Business
              </span>
              <span className="font-medium text-charcoal truncate block">
                Acme Artisan Bakery
              </span>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1" aria-label="Main Navigation">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent-soft text-accent font-semibold'
                          : 'text-muted hover:text-charcoal hover:bg-background'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User Profile Menu Placeholder */}
          <div className="pt-4 border-t border-border px-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center font-medium text-xs">
              AB
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-charcoal truncate">Alex Bennett</span>
              <span className="text-[11px] text-muted truncate">alex@artisanbakery.com</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
