import React from 'react';
import { CheckCheck, ExternalLink } from 'lucide-react';
import { ChatMessage, InlineButtonConfig } from '../../types';

interface TelegramMessageBubbleProps {
  message: ChatMessage;
  onButtonClick: (button: InlineButtonConfig) => void;
}

export const TelegramMessageBubble: React.FC<TelegramMessageBubbleProps> = ({
  message,
  onButtonClick,
}) => {
  const isUser = message.sender === 'user';
  const isAdmin = message.sender === 'admin';

  return (
    <div
      className={`flex flex-col my-1.5 w-full ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[88%] sm:max-w-[420px] rounded-2xl shadow-sm ${
          isUser
            ? 'bg-[#e2f7cb] dark:bg-[#2b5278] text-slate-900 dark:text-white rounded-tr-xs'
            : isAdmin
            ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white rounded-tl-xs'
            : 'bg-white dark:bg-[#182533] text-slate-900 dark:text-white rounded-tl-xs border border-black/5 dark:border-white/5'
        } overflow-hidden`}
      >
        {/* Admin message indicator banner */}
        {isAdmin && (
          <div className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 border-b border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between">
            <span>Direct Admin Message</span>
            <span className="font-mono text-[9px]">Official Agent</span>
          </div>
        )}

        {/* Poster / Image if present and non-empty */}
        {message.imageUrl && message.imageUrl.trim().length > 0 && (
          <div className="relative overflow-hidden bg-slate-900 max-h-[320px] flex items-center justify-center">
            <img
              src={message.imageUrl}
              alt="Promotion banner"
              className="w-full h-auto object-cover max-h-[300px] cursor-pointer hover:scale-[1.01] transition-transform"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Contact Card (when phone number was automatically shared) */}
        {message.isContactCard && message.contactData ? (
          <div className="p-3 bg-emerald-50 text-slate-900 flex items-center gap-3 border-b border-emerald-200">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              📱
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black text-slate-900 block truncate">
                {message.contactData.firstName} {message.contactData.lastName || ''}
              </span>
              <span className="text-xs font-bold text-emerald-800 font-mono block">
                {message.contactData.phoneNumber}
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 inline-block mt-0.5">
                Verified Telegram Contact
              </span>
            </div>
          </div>
        ) : null}

        {/* Text body */}
        {message.text && (
          <div className="px-3.5 pt-2.5 pb-2 text-[13px] leading-relaxed break-words whitespace-pre-wrap font-medium">
            {message.text}
          </div>
        )}

        {/* Timestamp & read status */}
        <div className="flex items-center justify-end gap-1 px-3 pb-1.5 text-[10px] text-slate-500 dark:text-slate-400 select-none">
          <span>{message.timestamp}</span>
          {isUser && (
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-sky-300 stroke-[2.2]" />
          )}
        </div>
      </div>

      {/* Inline Buttons Attached Below the Message (Authentic Telegram Style) */}
      {message.buttons && message.buttons.length > 0 && (
        <div className="flex flex-col gap-1 mt-1.5 w-full max-w-[88%] sm:max-w-[420px]">
          {message.buttons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => onButtonClick(btn)}
              className="w-full py-2.5 px-4 bg-[#58a65c] hover:bg-[#4d9751] active:scale-[0.985] text-white font-medium text-[13px] sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {btn.emoji && <span className="text-base">{btn.emoji}</span>}
              <span>{btn.label}</span>
              {btn.actionType === 'url' || btn.actionType === 'whatsapp' ? (
                <ExternalLink className="w-3.5 h-3.5 opacity-80 ml-0.5" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
