import React from 'react';
import {
  Users,
  MessageSquare,
  TrendingUp,
  MousePointerClick,
  Sparkles,
  ArrowUpRight,
  Send,
  Radio,
  Sliders,
  CheckCircle2,
  Calendar,
  Activity,
  UserCheck
} from 'lucide-react';
import {
  BotSettings,
  UserSubscriber,
  ClickAnalytics,
  BroadcastCampaign
} from '../../types';
import { AdminTab } from './AdminSidebar';

interface OverviewTabProps {
  settings: BotSettings;
  users: UserSubscriber[];
  analytics: ClickAnalytics[];
  broadcasts: BroadcastCampaign[];
  onNavigateTab: (tab: AdminTab) => void;
  onSelectUserForChat: (user: UserSubscriber) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  settings,
  users,
  analytics,
  broadcasts,
  onNavigateTab,
  onSelectUserForChat,
}) => {
  const newCustomersCount = users.filter((u) => u.customerType === 'new' || u.customerType === 'lead').length;
  const existingCustomersCount = users.filter((u) => u.customerType === 'existing' || u.customerType === 'vip').length;
  const totalInteractions = users.reduce((acc, u) => acc + (u.totalInteractions || 1), 0);
  const unseenCount = users.filter((u) => (u.unreadCount || 0) > 0).length;

  const kpis = [
    {
      label: 'Total Customers in CRM',
      value: users.length.toString(),
      subtext: `${unseenCount} unseen inquiries`,
      icon: Users,
      trend: `${users.length} active profiles`,
      color: 'text-sky-700 bg-sky-100 border-sky-300',
    },
    {
      label: 'New Customer Leads',
      value: newCustomersCount.toString(),
      subtext: `${existingCustomersCount} verified clients`,
      icon: Sparkles,
      trend: 'Active lead capture',
      color: 'text-emerald-700 bg-emerald-100 border-emerald-300',
    },
    {
      label: 'Total User Messages',
      value: totalInteractions.toString(),
      subtext: 'Auto-replied & CRM logged',
      icon: MessageSquare,
      trend: 'Real-time telemetry',
      color: 'text-indigo-700 bg-indigo-100 border-indigo-300',
    },
    {
      label: 'Button Click Telemetry',
      value: analytics.length.toString(),
      subtext: `${analytics.length} recorded interactions`,
      icon: MousePointerClick,
      trend: 'Live tracking active',
      color: 'text-amber-700 bg-amber-100 border-amber-300',
    },
  ];

  return (
    <div className="space-y-6 text-slate-900">
      {/* Welcome Banner & Quick Action Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300 font-mono">
              {settings.profile.token ? 'CONNECTED TO TELEGRAM' : 'READY TO CONFIGURE'}
            </span>
            <span className="text-xs font-bold text-slate-600">Telegram Bot Engine Active</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            {settings.profile.name || 'Telegram Bot'} Control Panel
          </h2>
          <p className="text-xs text-slate-700 mt-1 max-w-xl font-medium">
            Manage your welcome poster, customize inline buttons, monitor daily unique customer registrations, and handle seen/unseen inbox messages seamlessly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('users')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Customer Inbox {unseenCount > 0 ? `(${unseenCount} unseen)` : ''}</span>
          </button>
          <button
            onClick={() => onNavigateTab('builder')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Edit Poster &amp; Buttons</span>
          </button>
          <button
            onClick={() => onNavigateTab('staff')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Staff Panel (RBAC)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                  {kpi.value}
                </span>
                <span className="text-xs font-bold text-slate-600 block mt-0.5">
                  {kpi.subtext}
                </span>
              </div>
              <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 pt-2 border-t border-slate-100">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span>{kpi.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Recent User Activity & Active Bot Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent User Activity & CRM Messages */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Live Customer Activity &amp; Inbound Inquiries
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Customer interactions, day of first chat, and unseen messages
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs font-black text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Users ({users.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {users.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg p-6">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                No Subscribers Yet
              </p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-sm mx-auto">
                Users will appear in real time once they send /start to your bot on Telegram or the simulator on the right.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.slice(0, 5).map((user) => {
                const hasUnread = (user.unreadCount || 0) > 0;
                return (
                  <div
                    key={user.id}
                    className={`py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer ${
                      hasUnread ? 'bg-rose-50/50' : ''
                    }`}
                    onClick={() => {
                      onSelectUserForChat(user);
                      onNavigateTab('users');
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs relative"
                        style={{ backgroundColor: user.avatarColor || '#0284C7' }}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full ring-2 ring-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">
                            {user.name}
                          </h4>
                          <span className="text-[11px] text-slate-600 font-mono">
                            {user.username}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase border ${
                              user.customerType === 'vip'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : user.customerType === 'new'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-sky-100 text-sky-900 border-sky-300'
                            }`}
                          >
                            {user.customerType}
                          </span>
                          {hasUnread && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              UNSEEN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                          First Chat: <strong className="text-slate-900 font-bold">{user.firstChatDay || 'Sunday'}, {user.firstChatDate || 'Today'}</strong> · Last Action:{' '}
                          <strong className="text-slate-900 font-bold">
                            {user.lastClickedButton || 'Started bot'}
                          </strong>{' '}
                          · {user.lastActiveAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUserForChat(user);
                          onNavigateTab('users');
                        }}
                        className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Open Direct Chat"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Active Bot Menu & Poster Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-slate-900">
                Active Telegram Setup
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded border border-emerald-300">
                Live in Simulator
              </span>
            </div>

            {/* Poster Thumbnail (only if set) */}
            {settings.poster.imageUrl && settings.poster.imageUrl.trim().length > 0 ? (
              <div className="rounded-lg overflow-hidden border border-slate-300 mb-3 bg-slate-900">
                <img
                  src={settings.poster.imageUrl}
                  alt={settings.poster.title}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="p-2.5 bg-white border-t border-slate-200 text-slate-900">
                  <span className="text-xs font-black block truncate">
                    {settings.poster.title}
                  </span>
                  <span className="text-[11px] text-slate-600 block truncate font-medium">
                    {settings.poster.caption}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-center">
                <p className="text-xs font-bold text-slate-900">
                  {settings.poster.title || 'Welcome!'}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {settings.poster.caption || 'No poster banner attached'}
                </p>
              </div>
            )}

            {/* Configured Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Active Inline Buttons ({settings.buttons.length})
              </span>
              {settings.buttons.length === 0 ? (
                <div className="p-3 text-center border border-dashed border-slate-300 rounded-lg text-[11px] text-slate-600 font-medium">
                  No buttons added yet. Click Customize below to add buttons.
                </div>
              ) : (
                settings.buttons.map((btn) => (
                  <div
                    key={btn.id}
                    className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{btn.emoji}</span>
                      <span>{btn.label}</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-black">
                      {btn.actionType}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={() => onNavigateTab('builder')}
              className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize Buttons &amp; Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
