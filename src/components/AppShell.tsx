import { type ReactNode, useState } from 'react';
import {
  Bell,
  Bookmark,
  Briefcase,
  Compass,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Settings,
  Shield,
  Sparkles,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import type { AppRoute, AuthUser, NotificationRecord } from '../types';
import { TrustBadge } from './TrustBadge';
import { Footer } from './Footer';

interface AppShellProps {
  user: AuthUser;
  route: AppRoute;
  aiConfigured: boolean;
  notifications: NotificationRecord[];
  onNavigate: (route: AppRoute) => void;
  onMarkNotificationRead: (id: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

interface NavItem {
  route: AppRoute;
  label: string;
  icon: typeof LayoutDashboard;
}

export function AppShell({
  user,
  route,
  aiConfigured,
  notifications,
  onNavigate,
  onMarkNotificationRead,
  onLogout,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const candidateNav: NavItem[] = [
    { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { route: 'profile', label: 'My Profile', icon: UserCircle },
    { route: 'documents', label: 'Document Centre', icon: FolderOpen },
    { route: 'assessment', label: 'AI Skills Assessment', icon: Sparkles },
    { route: 'recognition', label: 'Recognition Navigator', icon: Compass },
    { route: 'readiness', label: 'Legal & Financial', icon: Scale },
    { route: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { route: 'saved', label: 'Saved Items', icon: Bookmark },
    { route: 'portfolio', label: 'My Portfolio & PDF', icon: FileCheck2 },
    { route: 'settings', label: 'Privacy & Settings', icon: Settings },
  ];

  const employerNav: NavItem[] = [
    { route: 'employer', label: 'Shared Talent Portal', icon: Users },
    { route: 'opportunities', label: 'Browse Opportunities', icon: Briefcase },
    { route: 'settings', label: 'Account Settings', icon: Settings },
  ];

  const adminNav: NavItem[] = [
    { route: 'admin', label: 'Admin Console', icon: Shield },
    { route: 'dashboard', label: 'Candidate View', icon: LayoutDashboard },
    { route: 'employer', label: 'Employer View', icon: Users },
    { route: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { route: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems =
    user.role === 'admin' ? adminNav : user.role === 'employer' ? employerNav : candidateNav;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSelectRoute = (target: AppRoute) => {
    onNavigate(target);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC] text-[#0B1F3A]">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B1F3A] text-white border-r border-white/10">
          <div className="flex h-16 items-center gap-2.5 px-6 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0FB5AE] text-[#0B1F3A]">
              <Compass className="h-5 w-5" />
            </div>
            <button
              type="button"
              onClick={() => handleSelectRoute('landing')}
              className="font-display text-lg font-bold tracking-tight text-white hover:text-[#5ED6CF] transition-colors"
            >
              TalentPath AI
            </button>
          </div>

          <div className="px-4 py-4 border-b border-white/10">
            <p className="text-xs font-medium text-slate-400">Signed in as</p>
            <p className="mt-0.5 text-sm font-semibold text-white truncate">{user.full_name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-block rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium capitalize text-[#5ED6CF]">
                {user.role === 'employer' ? 'Employer / Mentor' : user.role}
              </span>
              {user.is_demo && <TrustBadge variant="demo_data" />}
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary Workspace Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = route === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleSelectRoute(item.route)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#0FB5AE] text-[#0B1F3A] font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-300">
              <p className="font-semibold text-white">
                {aiConfigured ? 'Gemini AI Connected' : 'Demo AI Mode Active'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                {aiConfigured
                  ? 'Live server-side Gemini analysis is ready.'
                  : 'No API key detected; assessments run with clearly labeled demo logic.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#0B1F3A]/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-[#0B1F3A] text-white">
              <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
                <span className="font-display text-lg font-bold">TalentPath AI</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = route === item.route;
                  return (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => handleSelectRoute(item.route)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#0FB5AE] text-[#0B1F3A] font-semibold'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Viewport */}
        <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden rounded-lg p-2 text-[#0B1F3A] hover:bg-slate-100"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="font-display text-sm sm:text-base font-bold text-[#0B1F3A] truncate">
                  {navItems.find((n) => n.route === route)?.label || 'TalentPath AI'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {!aiConfigured && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#F5A524]/40 bg-[#F5A524]/15 px-2.5 py-1 text-xs font-medium text-[#B45309]">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Demo AI Mode</span>
                </span>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative rounded-xl border border-slate-200 p-2 text-[#475569] hover:bg-slate-50 hover:text-[#0B1F3A] transition-colors"
                  aria-label="In-app notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0FB5AE] text-[10px] font-bold text-[#0B1F3A]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-40">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="font-display text-sm font-semibold text-[#0B1F3A]">Notifications</h3>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#475569] hover:text-[#0B1F3A]"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-4 text-center text-xs text-[#475569]">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`rounded-xl border p-3 text-xs ${
                              n.is_read ? 'border-slate-100 bg-slate-50/70' : 'border-[#0FB5AE]/35 bg-[#0FB5AE]/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-[#0B1F3A]">{n.title}</p>
                              {!n.is_read && (
                                <button
                                  type="button"
                                  onClick={() => onMarkNotificationRead(n.id)}
                                  className="text-[11px] font-medium text-[#0B8A84] hover:underline shrink-0"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-[#475569] leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          <Footer onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
