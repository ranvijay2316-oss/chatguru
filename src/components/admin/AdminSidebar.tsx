import React from 'react';
import {
  LayoutDashboard,
  Sliders,
  Users,
  Radio,
  BarChart3,
  Bot,
  Layers,
  ShieldCheck,
  UserCheck,
  LogOut,
  Smartphone
} from 'lucide-react';
import { StaffMember } from '../../types';

export type AdminTab =
  | 'overview'
  | 'builder'
  | 'users'
  | 'broadcast'
  | 'analytics'
  | 'api'
  | 'staff';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  activeUsersCount: number;
  unreadMessagesCount: number;
  viewMode: 'split' | 'admin-only' | 'bot-only';
  onSetViewMode: (mode: 'split' | 'admin-only' | 'bot-only') => void;
  currentStaff?: StaffMember;
  onOpenStaffPanel?: () => void;
  onLogout?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  activeUsersCount,
  unreadMessagesCount,
  viewMode,
  onSetViewMode,
  currentStaff,
  onOpenStaffPanel,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'overview' as AdminTab,
      label: 'Overview & Activity',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'builder' as AdminTab,
      label: 'Bot Buttons & Poster',
      icon: Sliders,
      badge: 'Manage',
    },
    {
      id: 'users' as AdminTab,
      label: 'Users CRM & Inbox',
      icon: Users,
      badge: unreadMessagesCount > 0 ? `${unreadMessagesCount} unseen` : `${activeUsersCount} users`,
      highlight: unreadMessagesCount > 0,
    },
    {
      id: 'broadcast' as AdminTab,
      label: 'Broadcast Engine',
      icon: Radio,
      badge: 'Push',
    },
    {
      id: 'analytics' as AdminTab,
      label: 'Analytics & Registrations',
      icon: BarChart3,
      badge: 'Daily',
    },
    {
      id: 'api' as AdminTab,
      label: 'Connect Telegram Bot',
      icon: Bot,
      badge: 'Live',
    },
    {
      id: 'staff' as AdminTab,
      label: 'Staff & Roles (RBAC)',
      icon: ShieldCheck,
      badge: 'Staff',
    },
  ];

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'marketing_manager':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'support_agent':
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none text-slate-900 shadow-xs">
      <div>
        {/* App Title / Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2AABEE] to-sky-600 flex items-center justify-center text-white shadow-sm font-black">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">TeleBot Studio</h2>
              <p className="text-[11px] font-semibold text-slate-600">Admin &amp; Control Hub</p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/40">
          <label className="text-[10px] uppercase font-bold text-slate-700 tracking-wider block mb-1.5 font-mono">
            Workspace Layout
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-lg border border-slate-300">
            <button
              onClick={() => onSetViewMode('split')}
              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Split View: Dashboard & Live Bot"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => onSetViewMode('admin-only')}
              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'admin-only'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Full Admin Panel View"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => onSetViewMode('bot-only')}
              className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'bot-only'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Full Telegram Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Bot</span>
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 border-2 border-sky-400 shadow-xs'
                    : 'text-slate-800 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-600'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      item.highlight
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-sky-200 text-sky-900'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info: Current Staff Logged In */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-xs">
        {currentStaff ? (
          <div
            onClick={onOpenStaffPanel}
            className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-sky-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                Active Staff
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${getRoleBadgeColor(currentStaff.role)}`}>
                {currentStaff.role.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                {currentStaff.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                  {currentStaff.name}
                </div>
                <div className="text-[10px] text-slate-600 truncate">{currentStaff.email}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-700 text-[11px]">
            <strong className="text-slate-900">Telegram Bot API</strong>
            <p className="text-slate-500 text-[10px] mt-0.5">Admin &amp; multi-role team control</p>
          </div>
        )}

        {/* Sidebar Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out of admin panel"
            className="w-full mt-2.5 py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sign Out / Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};
