import React, { useState, useRef } from 'react';
import {
  Radio,
  Send,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  KeyRound,
  Check,
  XCircle,
  HelpCircle,
  Upload,
  RotateCcw,
  CornerDownLeft
} from 'lucide-react';
import { BroadcastCampaign, InlineButtonConfig, UserSubscriber } from '../../types';

export interface BroadcastDeliveryLog {
  target: string;
  chatId: string;
  status: 'delivered' | 'fallback' | 'failed';
  error?: string;
  time: string;
}

export interface BroadcastResult {
  total: number;
  delivered: number;
  failed: number;
  logs: BroadcastDeliveryLog[];
}

interface BroadcastTabProps {
  broadcasts: BroadcastCampaign[];
  onSendBroadcast: (
    broadcast: BroadcastCampaign,
    customChatIds?: string[]
  ) => Promise<BroadcastResult>;
  subscribersCount: number;
  users: UserSubscriber[];
  botToken?: string;
}

export const BroadcastTab: React.FC<BroadcastTabProps> = ({
  broadcasts,
  onSendBroadcast,
  subscribersCount,
  users,
  botToken,
}) => {
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'new_customers' | 'existing_customers' | 'custom_ids'>('all');
  const [customChatIdsInput, setCustomChatIdsInput] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [latestResult, setLatestResult] = useState<BroadcastResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const realTelegramUsers = users.filter((u) => u.telegramId && u.telegramId.trim().length > 0);

  const handleDesktopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WEBP, or GIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setImageUrl(base64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearBroadcastForm = () => {
    setTitle('');
    setMessageText('');
    setImageUrl('');
    setButtonLabel('');
    setButtonUrl('');
    setLatestResult(null);
  };

  const handleAddLineBreak = () => {
    setMessageText((prev) => (prev ? `${prev}\n` : '\n'));
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;

    setIsSending(true);
    setLatestResult(null);

    const customIds =
      targetAudience === 'custom_ids'
        ? customChatIdsInput
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : undefined;

    const newBroadcast: BroadcastCampaign = {
      id: `bc_${Date.now()}`,
      title: title.trim() || 'Telegram Announcement',
      messageText: messageText.trim(),
      imageUrl: imageUrl.trim() || undefined,
      targetAudience: targetAudience === 'custom_ids' ? 'all' : targetAudience,
      sentAt: 'Just now',
      status: 'sending',
      recipientsCount: 0,
      deliveredCount: 0,
      clicksCount: 0,
      buttons: buttonLabel
        ? [
            {
              id: `bc_btn_${Date.now()}`,
              label: buttonLabel,
              emoji: '⚡',
              actionType: 'url',
              url: buttonUrl,
              order: 0,
            },
          ]
        : undefined,
    };

    try {
      const res = await onSendBroadcast(newBroadcast, customIds);
      setLatestResult(res);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Broadcast Header & Stats */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider font-mono">
              Push Notification Engine
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900">Broadcast Notifications Center</h2>
          <p className="text-xs text-slate-700">
            Send instant mass notifications with custom posters and interactive buttons to all Telegram subscribers.
          </p>
        </div>

        <button
          onClick={handleClearBroadcastForm}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Form</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleDesktopUpload}
        className="hidden"
      />

      {/* Telegram Connection & Rules Banner */}
      {!botToken ? (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-black block text-sm mb-0.5">Telegram Bot API Token Needed for Real Telegram Delivery</span>
            <p className="text-slate-800 leading-relaxed font-medium">
              To deliver broadcast messages directly to real Telegram users, connect your Bot Token from @BotFather in the{' '}
              <strong className="font-extrabold text-amber-900 underline">Connect Telegram Bot</strong> tab.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-sky-50 border border-sky-300 rounded-xl text-slate-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-slate-900 font-extrabold">Delivery Rule Notice:</strong>
            <p className="mt-0.5 text-slate-800 font-medium">
              Telegram requires subscribers to tap <strong>/start</strong> before a bot can message them. Broadcasts reach all started users instantly!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Composer Form (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-black text-sm text-slate-900">
              Compose Push Broadcast
            </h3>
            <span className="text-xs text-slate-600 font-mono font-bold">Telegram API Dispatch</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1">
              Internal Campaign Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Special Announcement"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Poster Picker Zone */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1">
              Broadcast Poster Banner (Optional)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-lg border border-sky-300 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Pick Poster from Desktop</span>
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="px-2.5 py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  Remove Poster
                </button>
              )}
            </div>
            {imageUrl && imageUrl.trim().length > 0 && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-300 max-h-36 bg-slate-100">
                <img src={imageUrl} alt="Poster" className="w-full h-36 object-contain bg-slate-900" />
              </div>
            )}
          </div>

          {/* Spacious Message Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-900 block">
                Broadcast Message Content
              </label>
              <button
                type="button"
                onClick={handleAddLineBreak}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer bg-sky-50 px-2 py-0.5 rounded border border-sky-200"
              >
                <CornerDownLeft className="w-3 h-3" />
                <span>+ Add Line Break</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message text here... (Enter spaces and multiple lines freely)"
              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed placeholder:text-slate-500 placeholder:font-normal"
            />
          </div>

          {/* Action Button */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-900 block mb-1">
                CTA Button Label (Optional)
              </label>
              <input
                type="text"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                placeholder="e.g. Open Portal"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-900 block mb-1">
                Button Redirect URL
              </label>
              <input
                type="text"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-[11px] text-slate-700 font-medium">
              Targeting <strong className="text-slate-900">{realTelegramUsers.length} subscribers</strong> in CRM
            </span>

            <button
              onClick={handleSend}
              disabled={isSending || !messageText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Dispatching Broadcast via Telegram...' : 'Send Broadcast Now'}</span>
            </button>
          </div>

          {/* Delivery Result Inspector */}
          {latestResult && (
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-300 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Broadcast Delivery Report
                </span>
                <span className="font-mono text-[11px] text-slate-700 font-bold">
                  {latestResult.delivered} delivered / {latestResult.failed} failed
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {latestResult.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-[11px] flex items-start justify-between gap-2 border font-medium ${
                      log.status === 'delivered'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : log.status === 'fallback'
                        ? 'bg-sky-50 border-sky-300 text-sky-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold block">{log.target}</span>
                      {log.error && (
                        <p className="text-[10px] opacity-90 mt-0.5">
                          {log.error.includes('bot can\'t initiate')
                            ? '❌ 403 Forbidden: User has not pressed /start in Telegram yet. Ask user to start your bot first.'
                            : log.error.includes('blocked')
                            ? '❌ 403 Forbidden: User blocked the bot.'
                            : log.error}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[10px] shrink-0 font-black">
                      {log.status === 'delivered' ? 'DELIVERED' : log.status === 'fallback' ? 'TEXT ONLY' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Subscriber Preview (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
              Telegram Message Preview
            </h4>
            <p className="text-[11px] text-slate-600 mb-3 font-medium">
              How the broadcast looks on subscribers' screens:
            </p>

            <div className="bg-[#8da488] p-3 rounded-xl shadow-inner max-w-sm mx-auto">
              <div className="bg-white rounded-lg overflow-hidden shadow-xs text-slate-900 text-xs">
                {imageUrl && imageUrl.trim().length > 0 && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-36 object-contain bg-slate-900"
                  />
                )}
                <div className="p-3 whitespace-pre-wrap leading-relaxed text-[12px] font-medium">
                  {messageText || 'Your broadcast message preview will appear here...'}
                </div>
                <div className="px-3 pb-1 text-[10px] text-slate-500 text-right font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {buttonLabel && (
                <div className="mt-1.5">
                  <div className="w-full py-2 bg-[#58a65c] text-white text-xs font-bold rounded-lg text-center shadow-xs flex items-center justify-center gap-1.5">
                    <span>⚡</span>
                    <span>{buttonLabel}</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Past Broadcasts Log */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
              Recent Broadcast Campaigns ({broadcasts.length})
            </h4>
            {broadcasts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-300 rounded-lg font-medium">
                No campaigns broadcasted yet. Compose and send above.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {broadcasts.map((bc) => (
                  <div key={bc.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-slate-900 block truncate">
                        {bc.title}
                      </span>
                      <span className="text-[11px] text-slate-600 block truncate font-medium">
                        Delivered to {bc.deliveredCount}/{bc.recipientsCount} · {bc.sentAt}
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                      {bc.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
