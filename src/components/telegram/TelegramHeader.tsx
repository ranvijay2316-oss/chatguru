import React, { useState } from 'react';
import { ArrowLeft, Search, MoreVertical, RotateCcw, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { BotProfileConfig } from '../../types';

interface TelegramHeaderProps {
  profile: BotProfileConfig;
  onRestart: () => void;
  onClear: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  profile,
  onRestart,
  onClear,
  soundEnabled,
  onToggleSound,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative bg-[#517da2] dark:bg-[#1f2936] text-white px-3 py-2.5 flex items-center justify-between shadow-sm select-none z-20">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onRestart}
          title="Back to conversation"
          className="flex items-center gap-1 text-white/90 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[11px] font-semibold bg-[#3f6382] px-1.5 py-0.5 rounded-full">
            1.1K
          </span>
        </button>

        <div className="relative shrink-0">
          {profile.avatarUrl && profile.avatarUrl.trim().length > 0 ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name || 'Bot'}
              className="w-10 h-10 rounded-full object-cover border border-white/20 bg-slate-800"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=100&h=100&fit=crop';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm border border-white/20 shadow-xs">
              {(profile.name || 'Bot').slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#517da2] dark:border-[#1f2936] rounded-full" />
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="font-semibold text-[15px] leading-tight truncate text-white">
              {profile.name}
            </h1>
            {profile.isVerified && (
              <ShieldCheck className="w-4 h-4 text-sky-200 fill-sky-300/30 shrink-0" />
            )}
          </div>
          <span className="text-xs text-white/75 truncate font-normal">
            {profile.subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute bot sounds' : 'Unmute bot sounds'}
          className="p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <button
          title="Search chat"
          className="p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="Options"
            className="p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-slate-800 dark:text-slate-100 z-30"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  onRestart();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/60"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-500" />
                <span>Restart Bot (/start)</span>
              </button>
              <button
                onClick={() => {
                  onClear();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <span>Clear Chat History</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
