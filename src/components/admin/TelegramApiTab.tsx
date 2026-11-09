import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Radio,
  Sliders,
  Send,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { BotSettings, UserSubscriber } from '../../types';
import { telegramApi, TelegramBotInfo } from '../../services/telegramApi';

interface TelegramApiTabProps {
  settings: BotSettings;
  onUpdateSettings: (newSettings: BotSettings) => void;
  onUserJoinedViaTelegram?: (user: UserSubscriber, messageText: string) => void;
  isLiveListening?: boolean;
  liveLogs?: Array<{ id: string; time: string; text: string; type: 'info' | 'message' | 'callback' }>;
}

export const TelegramApiTab: React.FC<TelegramApiTabProps> = ({
  settings,
  onUpdateSettings,
  onUserJoinedViaTelegram,
  isLiveListening: isLiveListeningProp,
  liveLogs: liveLogsProp,
}) => {
  const [tokenInput, setTokenInput] = useState(settings.profile.token || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live polling listener state (internal fallback)
  const [internalIsLiveListening, setInternalIsLiveListening] = useState(false);
  const [internalLiveLogs, setInternalLiveLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'message' | 'callback' }>>([]);
  const lastUpdateIdRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isLiveListening = isLiveListeningProp !== undefined ? isLiveListeningProp : internalIsLiveListening;
  const liveLogs = liveLogsProp !== undefined ? liveLogsProp : internalLiveLogs;

  const [isSyncingIntro, setIsSyncingIntro] = useState(false);

  // Webhook state
  const [webhookInfo, setWebhookInfo] = useState<{ url: string; pending_update_count: number } | null>(null);
  const [isCheckingWebhook, setIsCheckingWebhook] = useState(false);
  const [copiedCode, setCopiedCode] = useState<'node' | 'python' | null>(null);

  const webhookEndpoint = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/telegram/webhook`;

  const handleSyncIntroCard = async () => {
    if (!tokenInput.trim()) return;
    setIsSyncingIntro(true);
    const fullIntro = `${settings.about.descriptionText || 'Welcome to our official bot!'}\n\n💎 Auto Registration: ${settings.about.registerUrl}\n📲 WhatsApp VIP ID: ${settings.about.whatsappUrl1}`.slice(0, 512);

    const res = await telegramApi.setMyDescription(tokenInput.trim(), fullIntro);
    if (res.ok) {
      await telegramApi.setMyShortDescription(tokenInput.trim(), (settings.about.descriptionText || '').slice(0, 120));
      setStatusMessage({
        type: 'success',
        text: '✅ "What can this bot do?" intro card successfully registered in Telegram! New users will now see it above the START button.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `Failed to set description: ${res.description || 'Unknown error'}`,
      });
    }
    setIsSyncingIntro(false);
  };

  // Check token on initial mount if saved
  useEffect(() => {
    if (settings.profile.token) {
      checkExistingToken(settings.profile.token);
    }
  }, []);

  const checkExistingToken = async (token: string) => {
    setIsVerifying(true);
    const res = await telegramApi.getMe(token);
    setIsVerifying(false);
    if (res.ok && res.result) {
      setBotInfo(res.result);
      setStatusMessage({
        type: 'success',
        text: `Connected to @${res.result.username} (${res.result.first_name})`,
      });
    }
  };

  const handleConnectToken = async () => {
    if (!tokenInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Telegram Bot Token.' });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    const res = await telegramApi.getMe(tokenInput.trim());
    setIsVerifying(false);

    if (res.ok && res.result) {
      setBotInfo(res.result);
      setStatusMessage({
        type: 'success',
        text: `Connected to @${res.result.username} (${res.result.first_name}) via Telegram Bot API!`,
      });

      // Update settings with real bot info
      onUpdateSettings({
        ...settings,
        profile: {
          ...settings.profile,
          name: res.result.first_name || settings.profile.name,
          username: res.result.username ? `@${res.result.username}` : settings.profile.username,
          token: tokenInput.trim(),
          isVerified: true,
        },
      });

      // Also fetch webhook info
      checkWebhook(tokenInput.trim());
    } else {
      setBotInfo(null);
      setStatusMessage({
        type: 'error',
        text: res.description || 'Invalid Bot Token. Check that you copied the complete token from @BotFather.',
      });
    }
  };

  const handleDisconnect = () => {
    stopPolling();
    setBotInfo(null);
    setTokenInput('');
    setStatusMessage(null);
    onUpdateSettings({
      ...settings,
      profile: {
        ...settings.profile,
        token: '',
      },
    });
  };

  const checkWebhook = async (token = tokenInput) => {
    if (!token) return;
    setIsCheckingWebhook(true);
    const res = await telegramApi.getWebhookInfo(token);
    setIsCheckingWebhook(false);
    if (res.ok && res.result) {
      setWebhookInfo(res.result);
    }
  };

  const handleSetWebhook = async () => {
    if (!tokenInput.trim()) return;
    const res = await telegramApi.setWebhook(tokenInput.trim(), webhookEndpoint);
    if (res.ok) {
      setStatusMessage({ type: 'success', text: `Webhook registered to ${webhookEndpoint}` });
      checkWebhook();
    } else {
      setStatusMessage({ type: 'error', text: res.description || 'Failed to set webhook' });
    }
  };

  const handleDeleteWebhook = async () => {
    if (!tokenInput.trim()) return;
    const res = await telegramApi.deleteWebhook(tokenInput.trim());
    if (res.ok) {
      setStatusMessage({ type: 'success', text: 'Webhook removed. Long-polling is now active.' });
      checkWebhook();
    }
  };

  // Real-time Long-polling simulation in browser
  const startPolling = () => {
    if (!tokenInput.trim()) return;
    setInternalIsLiveListening(true);
    addLog(`Live listener started for ${botInfo?.username ? '@' + botInfo.username : 'bot'}...`, 'info');

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await telegramApi.getUpdates(tokenInput.trim(), lastUpdateIdRef.current + 1);
        if (res.ok && res.result && res.result.length > 0) {
          for (const update of res.result) {
            lastUpdateIdRef.current = update.update_id;

            if (update.message) {
              const msg = update.message;
              const senderName = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
              const senderUser = msg.from.username ? `@${msg.from.username}` : senderName;
              const text = msg.text || '';

              addLog(`[Message] From ${senderUser}: "${text}"`, 'message');

              // If /start, check if user has already shared their number or has existing contact
              const sharedContact = (msg as any).contact;
              const sharedPhone = sharedContact?.phone_number;
              if (text === '/start') {
                if (sharedPhone) {
                  await telegramApi.sendMessage(
                    tokenInput.trim(),
                    msg.chat.id,
                    'hii  sir aap humse already  touch mein hai aaj aapki kya help karein',
                    settings.buttons
                  );
                } else if (settings.poster.imageUrl) {
                  await telegramApi.sendPhoto(
                    tokenInput.trim(),
                    msg.chat.id,
                    settings.poster.imageUrl,
                    `${settings.poster.title}\n${settings.poster.caption}`,
                    settings.buttons
                  );
                } else {
                  await telegramApi.sendMessage(
                    tokenInput.trim(),
                    msg.chat.id,
                    `${settings.poster.title}\n${settings.poster.caption}`,
                    settings.buttons
                  );
                }
              }

              // Notify CRM of new real user
              if (onUserJoinedViaTelegram) {
                const newRealUser: UserSubscriber = {
                  id: `tg_usr_${msg.from.id}`,
                  telegramId: msg.from.id.toString(),
                  name: senderName,
                  username: senderUser,
                  customerType: 'new',
                  joinedAt: 'Just now',
                  lastActiveAt: 'Just now',
                  totalInteractions: 1,
                  lastClickedButton: text,
                  tags: ['Real Telegram User', 'Live Sync'],
                  status: 'active',
                  avatarColor: '#2AABEE',
                  unreadCount: 1,
                };
                onUserJoinedViaTelegram(newRealUser, text);
              }
            } else if (update.callback_query) {
              const cq = update.callback_query;
              const sender = cq.from.username ? `@${cq.from.username}` : cq.from.first_name;
              addLog(`[Button Click] ${sender} clicked button (data: ${cq.data})`, 'callback');

              await telegramApi.answerCallbackQuery(tokenInput.trim(), cq.id);

              // Find matching button response
              const matchedBtn = settings.buttons.find((b) => b.callbackKey === cq.data || b.id === cq.data);
              if (matchedBtn?.responseText && cq.message?.chat.id) {
                await telegramApi.sendMessage(
                  tokenInput.trim(),
                  cq.message.chat.id,
                  matchedBtn.responseText
                );
              }
            }
          }
        }
      } catch {
        // network polling retry
      }
    }, 2500);
  };

  const stopPolling = () => {
    setInternalIsLiveListening(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    addLog('Live listener stopped.', 'info');
  };

  const addLog = (text: string, type: 'info' | 'message' | 'callback') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setInternalLiveLogs((prev: Array<{ id: string; time: string; text: string; type: 'info' | 'message' | 'callback' }>) => [
      { id: `log_${Date.now()}_${Math.random()}`, time, text, type },
      ...prev.slice(0, 30),
    ]);
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const nodeServerCode = `// Production Node.js / Express Telegram Bot Server
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const BOT_TOKEN = "${tokenInput || 'YOUR_BOT_TOKEN_FROM_BOTFATHER'}";
const TELEGRAM_API = "https://api.telegram.org/bot" + BOT_TOKEN;

// Webhook endpoint
app.post('/api/telegram/webhook', async (req, res) => {
  const { message, callback_query } = req.body;

  if (message && message.text === '/start') {
    const chatId = message.chat.id;
    await fetch(TELEGRAM_API + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: "${settings.poster.title}\\n${settings.poster.caption}",
        reply_markup: {
          inline_keyboard: [
            ${settings.buttons.length > 0 
              ? settings.buttons.map(b => `[{ text: "${b.emoji ? b.emoji + ' ' : ''}${b.label}", ${b.actionType === 'url' || b.actionType === 'whatsapp' ? `url: "${b.url}"` : `callback_data: "${b.callbackKey || b.id}"`} }]`).join(',\n            ')
              : `[{ text: "Contact Support", url: "https://t.me" }]`}
          ]
        }
      })
    });
  }

  return res.sendStatus(200);
});

app.listen(3000, () => console.log('Telegram Bot Server active on port 3000'));`;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Telegram Connection Hero Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${botInfo ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-black tracking-wider uppercase font-mono text-sky-800">
              {botInfo ? 'TELEGRAM BOT CONNECTED' : 'READY TO CONNECT'}
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Connect Your Real Telegram Bot
          </h2>
          <p className="text-xs text-slate-700 mt-1 max-w-xl font-medium">
            Link your official BotFather API Token to send real messages, manage real users in CRM, receive live button clicks, and trigger instant broadcasts.
          </p>
        </div>

        {botInfo && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left text-xs">
              <span className="font-bold text-white block">@{botInfo.username}</span>
              <span className="text-[11px] text-emerald-300 font-mono">ID: {botInfo.id}</span>
            </div>
            <a
              href={`https://t.me/${botInfo.username}`}
              target="_blank"
              rel="noreferrer"
              className="ml-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
              title="Open Bot in Telegram App"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* 3-Step Connection Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: How to get token */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider font-mono">
                Step 1 of 3
              </span>
              <span className="text-xs text-slate-400">Telegram App</span>
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Get Token from @BotFather
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              BotFather is Telegram's official bot for creating and managing bots.
            </p>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-sky-500">1.</span>
                <div>
                  <span>Open </span>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    @BotFather in Telegram <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-sky-500">2.</span>
                <div className="w-full">
                  <span>Send command:</span>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-2 py-1 rounded mt-1 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                    <code>/newbot</code>
                    <button
                      onClick={() => navigator.clipboard.writeText('/newbot')}
                      className="text-slate-400 hover:text-sky-500"
                      title="Copy"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-sky-500">3.</span>
                <span>Name your bot and pick a username ending with <code>bot</code>.</span>
              </div>

              <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-mono font-bold text-sky-500">4.</span>
                <span>Copy the HTTP API Token provided by BotFather.</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 bg-[#2AABEE] hover:bg-[#2297d3] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open @BotFather</span>
            </a>
          </div>
        </div>

        {/* Step 2: Paste and Validate Token */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider font-mono">
                Step 2 of 3
              </span>
              <span className="text-xs text-slate-400">Connection</span>
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Enter Bot Token
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Paste your token below. We verify it directly with Telegram's official API.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Telegram Bot Token
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="123456789:ABCdefGhIJKlmNo..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                  {tokenInput && (
                    <button
                      onClick={() => setTokenInput('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Format: <code className="font-mono">digits:characters</code> (e.g. 7149204821:AAHk-9eFqX2...)
                </span>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-tight">{statusMessage.text}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
            <button
              onClick={handleConnectToken}
              disabled={isVerifying || !tokenInput.trim()}
              className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying with Telegram...' : botInfo ? 'Re-Verify Connection' : 'Connect Telegram Bot'}</span>
            </button>

            {botInfo && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 rounded-lg text-xs font-medium transition-colors"
                title="Disconnect bot"
              >
                Disconnect
              </button>
            )}
          </div>

          {botInfo && (
            <button
              type="button"
              onClick={handleSyncIntroCard}
              disabled={isSyncingIntro}
              className="mt-2.5 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Push 'What can this bot do?' card to Telegram"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncingIntro ? 'Syncing Card to Telegram...' : 'Sync "What can this bot do?" Intro Card'}</span>
            </button>
          )}
        </div>

        {/* Step 3: Real-Time Sync & Live Listener */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider font-mono">
                Step 3 of 3
              </span>
              <span className="text-xs text-slate-400">Live Sync</span>
            </div>

            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Live In-Browser Listener
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Enable real-time listening so when anyone sends /start to your bot on Telegram, this dashboard automatically logs them and replies with your buttons!
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Live Telegram Polling
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isLiveListening
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isLiveListening ? 'ACTIVE LISTENING' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Polls Telegram API every 2.5s for real user messages and button clicks.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            {isLiveListening ? (
              <div className="w-full py-2 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Continuous Background Polling Active</span>
              </div>
            ) : (
              <button
                onClick={startPolling}
                disabled={!botInfo}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Start Live Listener</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Polling Stream Logs (visible when polling) */}
      {isLiveListening && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Live Telegram Traffic Feed
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Listening to @{botInfo?.username}
            </span>
          </div>

          <div className="bg-slate-950 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
            {liveLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-2 text-[11px]">
                Waiting for incoming updates... Open @{botInfo?.username} in Telegram and send a message!
              </div>
            ) : (
              liveLogs.map((log) => (
                <div key={log.id} className="text-[11px] leading-tight flex items-start gap-2">
                  <span className="text-slate-500">{log.time}</span>
                  <span
                    className={
                      log.type === 'message'
                        ? 'text-sky-400 font-medium'
                        : log.type === 'callback'
                        ? 'text-emerald-400 font-medium'
                        : 'text-amber-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* How Poster and Buttons Work in Telegram - Visual Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <HelpCircle className="w-5 h-5 text-sky-500" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              How the Poster &amp; Buttons Display in Real Telegram
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The exact journey of what your users see and experience on their phones
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] uppercase font-bold text-sky-500 font-mono tracking-wider block">
              1. Discovery Screen
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Bot Profile &amp; Bio Card
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              When a user opens <code className="text-sky-600 dark:text-sky-400">t.me/{botInfo?.username || 'your_bot'}</code>, Telegram shows the <strong>"What can this bot do?"</strong> card with a big blue <strong>START</strong> button at the bottom.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] uppercase font-bold text-indigo-500 font-mono tracking-wider block">
              2. Poster Banner
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              sendPhoto Media Bubble
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              When user taps <strong>START</strong>, the bot calls Telegram's <code className="font-mono">sendPhoto</code> API. The promotional banner appears as a rounded image bubble with your caption text directly attached underneath.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-500 font-mono tracking-wider block">
              3. Interactive Buttons
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              InlineKeyboardMarkup
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Your buttons (e.g. <em>Existing Customer</em>, <em>New Customer</em>) render directly beneath the poster image. Tapping a URL button opens the link/WhatsApp instantly; tapping a callback button replies in chat.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-500 font-mono tracking-wider block">
              4. CRM &amp; Live Chat
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Real-Time Tracking
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Every user who taps START is captured into your <strong>Users CRM</strong>. You can chat with them live, track button click CTR in <strong>Analytics</strong>, and broadcast push announcements anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Live Test Form: Send Test Poster & Buttons to My Phone */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-xl border border-indigo-800/50 p-5 shadow-xs text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-white">
              Send Test Poster &amp; Buttons Directly to Your Phone
            </h3>
          </div>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded">
            Live Preview on Device
          </span>
        </div>

        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Want to see how your active poster and inline buttons look inside your real Telegram app? Enter your Telegram Chat ID and send a live preview message right now.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            id="testChatIdInput"
            placeholder="Enter your Telegram Chat ID (e.g. 123456789)"
            className="w-full sm:w-80 text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            onClick={async () => {
              const input = document.getElementById('testChatIdInput') as HTMLInputElement;
              const chatId = input?.value?.trim();
              if (!chatId) {
                alert('Please enter your Telegram Chat ID. You can find it by messaging @userinfobot on Telegram.');
                return;
              }
              if (!tokenInput.trim()) {
                alert('Please connect your Bot Token first.');
                return;
              }

              let res;
              if (settings.poster.imageUrl) {
                res = await telegramApi.sendPhoto(
                  tokenInput.trim(),
                  chatId,
                  settings.poster.imageUrl,
                  `${settings.poster.title}\n${settings.poster.caption}`,
                  settings.buttons
                );
              } else {
                res = await telegramApi.sendMessage(
                  tokenInput.trim(),
                  chatId,
                  `${settings.poster.title}\n${settings.poster.caption}`,
                  settings.buttons
                );
              }

              if (res.ok) {
                alert('✅ Test message sent! Check your Telegram app on your phone.');
              } else {
                alert(`Error: ${res.description || 'Could not send test message. Check your Chat ID and make sure you clicked START on your bot first.'}`);
              }
            }}
            disabled={!botInfo}
            className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test to My Telegram</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          💡 <strong>Tip to find your Chat ID:</strong> Message <strong>@userinfobot</strong> on Telegram or start the <em>Live Listener</em> above and send any message to your bot.
        </p>
      </div>

      {/* Webhook Configuration for 24/7 Hosting */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              24/7 Production Webhook Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For continuous background hosting when the dashboard browser tab is closed
            </p>
          </div>
          <button
            onClick={() => checkWebhook()}
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Webhook URL (HTTPS Required by Telegram)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookEndpoint}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300"
              />
              <button
                onClick={() => navigator.clipboard.writeText(webhookEndpoint)}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                title="Copy webhook URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Telegram sends instant POST requests to this endpoint whenever a user chats with your bot.
            </p>
          </div>

          <div className="flex flex-col justify-end gap-2">
            <button
              onClick={handleSetWebhook}
              disabled={!tokenInput.trim()}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Register Webhook with Telegram
            </button>
            <button
              onClick={handleDeleteWebhook}
              disabled={!tokenInput.trim()}
              className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs transition-colors"
            >
              Remove Webhook (Use Polling)
            </button>
          </div>
        </div>

        {webhookInfo && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between font-mono">
            <div>
              <span className="text-slate-400">CURRENT WEBHOOK: </span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{webhookInfo.url || 'None (Long-polling mode active)'}</span>
            </div>
            <div>
              <span className="text-slate-400">PENDING UPDATES: </span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold">{webhookInfo.pending_update_count}</span>
            </div>
          </div>
        )}
      </div>

      {/* Copy-Pasteable Self-Hosted Code */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Ready-to-Deploy Backend Server Script (Node.js)
            </h3>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(nodeServerCode);
              setCopiedCode('node');
              setTimeout(() => setCopiedCode(null), 2000);
            }}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-medium rounded text-slate-700 dark:text-slate-200"
          >
            {copiedCode === 'node' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode === 'node' ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 text-slate-300 text-xs rounded-lg overflow-x-auto font-mono max-h-64 leading-relaxed border border-slate-800">
          {nodeServerCode}
        </pre>
      </div>
    </div>
  );
};
