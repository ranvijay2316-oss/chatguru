import React from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Sparkles,
  MousePointerClick,
  ArrowRight,
  UserCheck,
  Bell
} from 'lucide-react';
import { InteractionNotification } from '../../types';

interface NotificationPopupProps {
  notification: InteractionNotification | null;
  onDismiss: () => void;
  onOpenChat: (userId: string) => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  onDismiss,
  onOpenChat,
}) => {
  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'contact_shared':
        return <Phone className="w-5 h-5 text-emerald-600 animate-bounce" />;
      case 'start':
        return <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />;
      case 'button_click':
        return <MousePointerClick className="w-5 h-5 text-sky-600" />;
      case 'message':
      default:
        return <MessageSquare className="w-5 h-5 text-sky-600" />;
    }
  };

  const getBadgeColor = () => {
    switch (notification.type) {
      case 'contact_shared':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'start':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'button_click':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      default:
        return 'bg-sky-100 text-sky-900 border-sky-300';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-sky-500 overflow-hidden text-slate-900">
        {/* Top notification accent line */}
        <div className="h-1 bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500" />

        <div className="p-3.5 flex items-start gap-3">
          {/* Notification Icon */}
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
            {getIcon()}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-xs text-slate-900 truncate">
                  {notification.userName}
                </span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${getBadgeColor()}`}>
                  {notification.type.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">
                {notification.timestamp}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
              {notification.actionText}
            </p>

            {notification.phoneNumber && (
              <div className="mt-1.5 inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-emerald-800">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>{notification.phoneNumber}</span>
              </div>
            )}

            {/* Quick Action Button */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  onOpenChat(notification.userId);
                  onDismiss();
                }}
                className="flex-1 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>View &amp; Reply Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onDismiss}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
