import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Shield,
  ArrowRightLeft,
  Bell,
  Phone,
  MessageSquare,
  Sparkles,
  MousePointerClick,
  Check,
  X
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';
import { StaffMember, InteractionNotification } from '../../types';

interface AdminHeaderProps {
  currentTab: AdminTab;
  onResetData?: () => void;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
  botName: string;
  subscribersCount: number;
  isPollingActive?: boolean;
  botUsername?: string;
  currentStaff?: StaffMember;
  onSwitchStaffClick?: () => void;
  notifications?: InteractionNotification[];
  onOpenChat?: (userId: string) => void;
  onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  botName,
  subscribersCount,
  isPollingActive,
  botUsername,
  currentStaff,
  onSwitchStaffClick,
  notifications = [],
  onOpenChat,
}) => {
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabLabel = (tab: AdminTab) => {
    switch (tab) {
      case 'overview':
        return 'Overview & Activity Feed';
      case 'builder':
        return 'Bot Buttons, Poster & Welcome Banner';
      case 'users':
        return 'Users Management & Customer Inbox (Seen/Unseen)';
      case 'broadcast':
        return 'Push Broadcast Campaigns';
      case 'analytics':
        return 'Conversion & Daily New Registrations';
      case 'api':
        return 'Connect Telegram Bot (API Gateway)';
      case 'staff':
        return 'Role-Based Employees & Staff Login Panel';
    }
  };

  // Clean bot username so there is never double @@
  const cleanUsername = botUsername
    ? botUsername.startsWith('@')
      ? botUsername
      : `@${botUsername}`
    : '';

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contact_shared':
        return <Phone className="w-3.5 h-3.5 text-emerald-600" />;
      case 'start':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case 'button_click':
        return <MousePointerClick className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-sky-600" />;
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs text-slate-900">
      {/* Breadcrumb Zone */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shrink-0">
          {botName || 'Telegram Bot Studio'}
        </span>
        <span className="text-slate-400 font-bold">/</span>
        <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
          {getTabLabel(currentTab)}
        </h1>
      </div>

      {/* Action Zone */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Telegram Live Listener Status with Single @ */}
        {isPollingActive ? (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>Listening Live {cleanUsername || 'Telegram'}</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Bot Standby</span>
          </div>
        )}

        {/* Live Interaction Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            title="Real-time bot interaction notifications"
            className="relative p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationsDropdown && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl border border-slate-300 z-50 text-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-sky-600" />
                  <span>Recent Bot Interactions ({notifications.length})</span>
                </span>
                <button
                  onClick={() => setShowNotificationsDropdown(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-medium">
                    No recent interactions yet. Notifications popup whenever a user chats, presses /start, or shares their contact!
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onOpenChat) onOpenChat(item.userId);
                        setShowNotificationsDropdown(false);
                      }}
                      className="p-3 hover:bg-sky-50 transition-colors cursor-pointer flex items-start gap-2.5 group"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-sky-100 shrink-0 mt-0.5">
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {item.userName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 truncate mt-0.5 font-medium">
                          {item.actionText}
                        </p>
                        {item.phoneNumber && (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-1">
                            📱 {item.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Active Staff Switcher Pill */}
        {currentStaff && (
          <button
            onClick={onSwitchStaffClick}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Click to switch employee profile or open Staff Panel"
          >
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden lg:inline text-slate-600">Staff:</span>
            <span className="text-slate-900 font-black">{currentStaff.name.split(' ')[0]}</span>
            <ArrowRightLeft className="w-3 h-3 text-slate-500 ml-0.5" />
          </button>
        )}

        {/* Subscribers Count */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-sky-900 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-300 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
          <span>{subscribersCount} Customers</span>
        </div>
      </div>
    </header>
  );
};
