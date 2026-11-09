import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  Command,
  ArrowDown,
  Bell,
  PhoneCall,
  ExternalLink,
  X,
  Check,
  CheckCircle2,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { TelegramHeader } from './TelegramHeader';
import { TelegramAboutCard } from './TelegramAboutCard';
import { TelegramMessageBubble } from './TelegramMessageBubble';
import {
  BotSettings,
  ChatMessage,
  InlineButtonConfig,
  UserSubscriber
} from '../../types';
import { sound } from '../../services/sound';

interface TelegramSimulatorProps {
  settings: BotSettings;
  messages: ChatMessage[];
  onSendMessage: (text: string, sender?: 'user' | 'bot' | 'admin', extra?: Partial<ChatMessage>) => void;
  onButtonClick: (button: InlineButtonConfig) => void;
  onLinkClick: (url: string, type: 'register_url' | 'whatsapp') => void;
  onRestartBot: () => void;
  onClearChat: () => void;
  currentUser: UserSubscriber;
  isBotTyping: boolean;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  settings,
  messages,
  onSendMessage,
  onButtonClick,
  onLinkClick,
  onRestartBot,
  onClearChat,
  currentUser,
  isBotTyping,
}) => {
  const [inputText, setInputText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Native Telegram Action Modals inside simulator
  const [activeAlertModal, setActiveAlertModal] = useState<{ title?: string; text: string } | null>(null);
  const [activeContactModal, setActiveContactModal] = useState<{ button: InlineButtonConfig } | null>(null);
  const [activeWebAppModal, setActiveWebAppModal] = useState<{ title: string; url: string } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (soundEnabled) sound.playSend();
    onSendMessage(inputText.trim(), 'user');
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickCommand = (cmd: string) => {
    setInputText(cmd);
    setShowCommands(false);
    if (soundEnabled) sound.playSend();
    onSendMessage(cmd, 'user');
    setInputText('');
  };

  // Intercept button clicks for interactive action types
  const handleInterceptButtonClick = (button: InlineButtonConfig) => {
    if (soundEnabled) sound.playClick();
    onButtonClick(button);

    if (button.actionType === 'popup_alert') {
      setActiveAlertModal({
        title: button.popupTitle || button.label,
        text: button.popupText || button.responseText || 'Notification alert from Telegram bot.',
      });
      return;
    }

    if (button.actionType === 'share_contact') {
      setActiveContactModal({ button });
      return;
    }

    if (button.actionType === 'web_app') {
      setActiveWebAppModal({
        title: button.label,
        url: button.webAppUrl || button.url || 'https://telegram.org',
      });
      return;
    }
  };

  const handleConfirmShareContact = () => {
    if (!activeContactModal) return;
    const btn = activeContactModal.button;
    const phone = currentUser?.phone || '+91 98765 43210';
    const name = currentUser?.name || 'Verified User';

    // 1. Send the contact card as the user
    onSendMessage(`📱 Shared Phone Number: ${phone}`, 'user', {
      isContactCard: true,
      contactData: {
        phoneNumber: phone,
        firstName: name,
        userId: currentUser?.telegramId || '10001',
      },
    });

    // 2. Automated response from bot confirming receipt
    setTimeout(() => {
      onSendMessage(
        btn.responseText || `✅ Verified! Phone number (${phone}) has been registered automatically with your Telegram ID.`,
        'bot'
      );
      if (soundEnabled) sound.playReceive();
    }, 600);

    setActiveContactModal(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 overflow-hidden relative shadow-2xl border border-slate-700/60 rounded-xl select-none">
      {/* Telegram Mobile Header */}
      <TelegramHeader
        profile={settings.profile}
        onRestart={onRestartBot}
        onClear={onClearChat}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Chat Canvas with authentic Telegram wallpaper */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 relative tg-bg-pattern"
      >
        {/* Pinned / About Intro Card (only if configured) */}
        <TelegramAboutCard
          about={settings.about}
          onLinkClick={onLinkClick}
        />

        {/* Date separator badge */}
        <div className="flex justify-center my-2 select-none">
          <span className="bg-black/35 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-2xs">
            Today
          </span>
        </div>

        {/* Messages Stream */}
        <div className="flex flex-col space-y-1">
          {messages.length === 0 ? (
            <div className="my-10 text-center p-6 bg-white/90 backdrop-blur-xs rounded-2xl border border-white/40 max-w-xs mx-auto shadow-md">
              <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                ✈️
              </div>
              <h4 className="text-xs font-black text-slate-900 mb-1">
                {settings.profile.name || 'Telegram Bot'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug mb-3">
                Tap <strong>START</strong> below or type <strong>/start</strong> to test your welcome poster and interactive buttons.
              </p>
              <button
                onClick={() => handleQuickCommand('/start')}
                className="w-full py-2 bg-[#2AABEE] hover:bg-sky-600 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer"
              >
                START
              </button>
            </div>
          ) : (
            messages.map((msg) => (
              <TelegramMessageBubble
                key={msg.id}
                message={msg}
                onButtonClick={handleInterceptButtonClick}
              />
            ))
          )}

          {/* Typing Indicator */}
          {isBotTyping && (
            <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-xs rounded-xl text-xs text-slate-800 w-fit my-1 animate-pulse border border-slate-200 shadow-2xs">
              <span className="font-extrabold text-slate-900">
                {settings.profile.name || 'Bot'}
              </span>
              <span className="text-[11px] text-slate-600">is typing</span>
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-sky-600 rounded-full animate-bounce" />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-white/95 text-slate-800 p-2 rounded-full shadow-lg border border-slate-300 hover:scale-105 transition-all z-10 cursor-pointer"
            title="Scroll to latest message"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Reply Shortcuts Strip */}
      <div className="bg-[#eef3f7] border-t border-slate-300 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none z-10">
        {settings.quickReplies.map((reply, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickCommand(reply)}
            className="text-xs font-bold px-3 py-1 bg-white text-slate-900 rounded-full border border-slate-300 hover:bg-slate-100 whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Commands Menu Popover */}
      {showCommands && (
        <div className="bg-white border-t border-slate-300 p-2 shadow-xl z-20 text-slate-900">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-2 py-1">
            Bot Commands
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleQuickCommand('/start')}
              className="text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs text-slate-900 font-medium cursor-pointer"
            >
              <span className="font-extrabold text-sky-700">/start</span> - Launch Welcome Flow
            </button>
            <button
              onClick={() => handleQuickCommand('/help')}
              className="text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs text-slate-900 font-medium cursor-pointer"
            >
              <span className="font-extrabold text-sky-700">/help</span> - Help &amp; Support Info
            </button>
          </div>
        </div>
      )}

      {/* Telegram Input Bar */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-slate-200 z-10">
        <button
          onClick={() => setShowCommands(!showCommands)}
          title="Bot commands menu"
          className="text-slate-600 hover:text-sky-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Command className="w-5 h-5" />
        </button>

        <button
          title="Attach file / photo"
          className="text-slate-500 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-colors hidden sm:block cursor-pointer"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message (or type /start)"
            className="w-full bg-transparent text-[13px] text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none py-1.5"
          />
        </div>

        <button
          title="Emoji picker"
          className="text-slate-500 hover:text-amber-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Smile className="w-5 h-5" />
        </button>

        {inputText.trim() ? (
          <button
            onClick={handleSend}
            title="Send message"
            className="bg-[#2AABEE] hover:bg-[#2297d3] text-white p-2 rounded-full shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        ) : (
          <button
            title="Voice message"
            onClick={() => {
              if (soundEnabled) sound.playClick();
              onSendMessage('🎤 [Voice Message 0:04]', 'user');
            }}
            className="text-slate-500 hover:text-sky-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom Session user info */}
      <div className="bg-slate-100 px-3 py-1 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-200 font-medium">
        <span className="truncate">
          Simulating customer: <strong className="text-slate-900 font-bold">{currentUser?.name || 'Customer'}</strong> ({currentUser?.username || '@client'})
        </span>
        <span className="text-[10px] bg-sky-100 text-sky-900 px-1.5 py-0.2 rounded font-mono font-bold">
          TG ID: {currentUser?.telegramId || '10001'}
        </span>
      </div>

      {/* MODAL 1: Telegram Native Popup Modal Dialog (Telegram show_alert: true) */}
      {activeAlertModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="font-black text-sm text-slate-900">
              {activeAlertModal.title || settings.profile.name || 'Telegram Notification'}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
              {activeAlertModal.text}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveAlertModal(null)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Telegram Native Share Contact Dialog (Auto-pushes phone number from Telegram ID) */}
      {activeContactModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-slate-900">
              Share Phone Number?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              The bot <strong>{settings.profile.name || 'Bot'}</strong> will receive your verified phone number (<strong>{currentUser?.phone || '+91 98765 43210'}</strong>) directly from your Telegram account.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setActiveContactModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShareContact}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                Share Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Telegram Mini App / WebApp In-App Frame */}
      {activeWebAppModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs flex flex-col z-50 animate-in fade-in duration-150">
          <div className="bg-white p-3 flex items-center justify-between border-b border-slate-200 text-slate-900">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-600" />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                {activeWebAppModal.title}
              </span>
            </div>
            <button
              onClick={() => setActiveWebAppModal(null)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 bg-white p-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
              <Globe className="w-8 h-8" />
            </div>
            <h5 className="font-black text-sm text-slate-900 mb-1">
              Telegram WebApp Mini-Frame
            </h5>
            <p className="text-xs text-slate-600 max-w-xs mb-3 font-medium">
              Destination URL: <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-mono text-[11px]">{activeWebAppModal.url}</code>
            </p>
            <a
              href={activeWebAppModal.url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
