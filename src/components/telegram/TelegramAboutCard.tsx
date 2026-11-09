import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Sparkles } from 'lucide-react';
import { BotAboutConfig } from '../../types';

interface TelegramAboutCardProps {
  about: BotAboutConfig;
  onLinkClick: (url: string, type: 'register_url' | 'whatsapp') => void;
}

export const TelegramAboutCard: React.FC<TelegramAboutCardProps> = ({
  about,
  onLinkClick,
}) => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!about.title && !about.descriptionText && !about.registerUrl && !about.whatsappUrl1) {
    return null;
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="max-w-[92%] sm:max-w-[420px] mx-auto my-3 bg-white dark:bg-[#182533] rounded-xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden text-slate-800 dark:text-slate-100 text-[13px] leading-relaxed transition-all">
      {/* Golden/Black header pattern */}
      <div className="h-10 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 relative flex items-center justify-center border-b border-amber-600/30 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:8px_8px]" />
        <span className="text-[11px] tracking-wider font-semibold text-amber-300 uppercase flex items-center gap-1.5 z-10">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Official Verified Channel
        </span>
      </div>

      <div className="p-4 text-center">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
          {about.title}
        </h2>

        {/* Formatted body text */}
        <div className="whitespace-pre-line text-slate-700 dark:text-slate-200 text-xs sm:text-[13px] leading-relaxed font-normal mb-3 text-center">
          {about.descriptionText}
        </div>

        {/* Action link cards (only shown if configured) */}
        {(about.registerUrl || about.whatsappUrl1) && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-2">
            {about.registerUrl && (
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-left border border-slate-200/70 dark:border-slate-700">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block">
                    Website / Portal URL
                  </span>
                  <a
                    href={about.registerUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      onLinkClick(about.registerUrl, 'register_url');
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block font-medium"
                  >
                    {about.registerUrl}
                  </a>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(about.registerUrl)}
                    title="Copy link"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copiedLink === about.registerUrl ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onLinkClick(about.registerUrl, 'register_url')}
                    className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {about.whatsappUrl1 && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg p-2.5 flex items-center justify-between text-left border border-emerald-200/80 dark:border-emerald-800/40">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                    Support / Direct Chat Link
                  </span>
                  <a
                    href={about.whatsappUrl1}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      onLinkClick(about.whatsappUrl1, 'whatsapp');
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline truncate block font-medium"
                  >
                    {about.whatsappUrl1}
                  </a>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(about.whatsappUrl1)}
                    title="Copy WhatsApp link"
                    className="p-1.5 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-white rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    {copiedLink === about.whatsappUrl1 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onLinkClick(about.whatsappUrl1, 'whatsapp')}
                    className="p-1.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 rounded transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
