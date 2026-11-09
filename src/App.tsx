import React, { useState, useEffect, useRef } from 'react';
import {
  storage,
  CLEAN_SETTINGS,
  INITIAL_MESSAGES,
  INITIAL_USERS,
  INITIAL_BROADCASTS,
  INITIAL_ANALYTICS,
} from './services/storage';
import { telegramApi } from './services/telegramApi';
import {
  BotSettings,
  ChatMessage,
  UserSubscriber,
  BroadcastCampaign,
  ClickAnalytics,
  InlineButtonConfig,
  StaffMember,
  InteractionNotification,
} from './types';
import { TelegramSimulator } from './components/telegram/TelegramSimulator';
import { AdminSidebar, AdminTab } from './components/admin/AdminSidebar';
import { AdminHeader } from './components/admin/AdminHeader';
import { NotificationPopup } from './components/admin/NotificationPopup';
import { OverviewTab } from './components/admin/OverviewTab';
import { BotBuilderTab } from './components/admin/BotBuilderTab';
import { CrmUsersTab } from './components/admin/CrmUsersTab';
import { BroadcastTab, BroadcastResult, BroadcastDeliveryLog } from './components/admin/BroadcastTab';
import { AnalyticsTab } from './components/admin/AnalyticsTab';
import { TelegramApiTab } from './components/admin/TelegramApiTab';
import { StaffPanel } from './components/admin/StaffPanel';
import { LoginScreen } from './components/auth/LoginScreen';
import { sound } from './services/sound';
import { Smartphone, LayoutDashboard, Layers, X, Sparkles } from 'lucide-react';

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storage.getIsLoggedIn());

  // State
  const [settings, setSettings] = useState<BotSettings>(() => storage.getSettings());
  const [messages, setMessages] = useState<ChatMessage[]>(() => storage.getMessages());
  const [users, setUsers] = useState<UserSubscriber[]>(() => storage.getUsers());
  const [broadcasts, setBroadcasts] = useState<BroadcastCampaign[]>(() => storage.getBroadcasts());
  const [analytics, setAnalytics] = useState<ClickAnalytics[]>(() => storage.getAnalytics());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => storage.getStaff());
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(() => storage.getCurrentStaff());

  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [viewMode, setViewMode] = useState<'split' | 'admin-only' | 'bot-only'>('split');
  const [selectedUserForChat, setSelectedUserForChat] = useState<UserSubscriber | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bot Interaction Notifications
  const [activePopupNotification, setActivePopupNotification] = useState<InteractionNotification | null>(null);
  const [notificationsHistory, setNotificationsHistory] = useState<InteractionNotification[]>([]);

  // Global persistent Telegram bot polling listener
  const lastUpdateIdRef = useRef<number>(0);
  const usersRef = useRef<UserSubscriber[]>(users);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const [isTelegramPolling, setIsTelegramPolling] = useState(false);
  const [telegramLogs, setTelegramLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'message' | 'callback' }>>([]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const addTelegramLog = (text: string, type: 'info' | 'message' | 'callback') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTelegramLogs((prev) => [{ id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`, time, text, type }, ...prev.slice(0, 39)]);
  };

  // Active simulated user
  const defaultSimUser: UserSubscriber = {
    id: 'sim_default',
    telegramId: '98210341',
    name: 'Simulator Customer',
    username: '@simulator_user',
    customerType: 'new',
    phone: '+91 98765 43210',
    joinedAt: 'Just now',
    lastActiveAt: 'Just now',
    totalInteractions: 0,
    tags: ['Simulator'],
    status: 'active',
    avatarColor: '#0284C7',
    unreadCount: 0,
  };
  const currentUser = users[0] || defaultSimUser;

  // Save changes to storage whenever they change
  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    storage.saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    storage.saveUsers(users);
  }, [users]);

  useEffect(() => {
    storage.saveBroadcasts(broadcasts);
  }, [broadcasts]);

  useEffect(() => {
    storage.saveAnalytics(analytics);
  }, [analytics]);

  useEffect(() => {
    storage.saveStaff(staffList);
  }, [staffList]);

  useEffect(() => {
    storage.saveCurrentStaff(currentStaff);
  }, [currentStaff]);

  // Clean separation of customer chats: tag unassociated messages to correct customer
  useEffect(() => {
    let hasChanges = false;
    const updatedMessages = messages.map((m) => {
      if (m.userId && m.telegramId) return m;

      // Match by phone number in contactData
      if (m.contactData?.phoneNumber) {
        const cleanMsgPhone = m.contactData.phoneNumber.replace(/[^0-9]/g, '');
        const matchedUser = users.find((u) => {
          if (!u.phone) return false;
          const cleanUserPhone = u.phone.replace(/[^0-9]/g, '');
          return cleanMsgPhone === cleanUserPhone || cleanMsgPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanMsgPhone);
        });
        if (matchedUser) {
          hasChanges = true;
          return {
            ...m,
            userId: matchedUser.id,
            telegramId: matchedUser.telegramId,
            userName: matchedUser.name,
          };
        }
      }

      // Match by phone number in text
      if (m.text && m.text.includes('Shared contact:')) {
        const cleanMsgPhone = m.text.replace(/[^0-9]/g, '');
        const matchedUser = users.find((u) => {
          if (!u.phone) return false;
          const cleanUserPhone = u.phone.replace(/[^0-9]/g, '');
          return cleanMsgPhone === cleanUserPhone || cleanMsgPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanMsgPhone);
        });
        if (matchedUser) {
          hasChanges = true;
          return {
            ...m,
            userId: matchedUser.id,
            telegramId: matchedUser.telegramId,
            userName: matchedUser.name,
          };
        }
      }

      return m;
    });

    if (hasChanges) {
      setMessages(updatedMessages);
    }
  }, [users]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to format current time like '04:37 PM'
  const getCurrentFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const triggerInteractionNotification = (
    notif: Omit<InteractionNotification, 'id' | 'timestamp'>
  ) => {
    const timestamp = getCurrentFormattedTime();
    const newNotif: InteractionNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp,
      ...notif,
    };

    setActivePopupNotification(newNotif);
    setNotificationsHistory((prev) => [newNotif, ...prev.slice(0, 29)]);

    if (settings.soundEnabled) {
      sound.playReceive();
    }

    // Auto-dismiss popup after 8 seconds
    setTimeout(() => {
      setActivePopupNotification((curr) => (curr?.id === newNotif.id ? null : curr));
    }, 8000);
  };

  const handleOpenChatFromNotification = (userId: string) => {
    setCurrentTab('users');
    const targetUser = users.find((u) => u.id === userId || u.telegramId === userId);
    if (targetUser) {
      setSelectedUserForChat(targetUser);
    }
    if (viewMode === 'bot-only') {
      setViewMode('split');
    }
  };

  // Persistent background Telegram listener: handles /start, commands and button callbacks
  useEffect(() => {
    if (!settings.profile.token || !settings.profile.token.trim()) {
      setIsTelegramPolling(false);
      return;
    }

    const token = settings.profile.token.trim();
    setIsTelegramPolling(true);
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;
      try {
        const res = await telegramApi.getUpdates(token, lastUpdateIdRef.current + 1);
        if (isCancelled) return;

        if (res.ok && res.result && res.result.length > 0) {
          for (const update of res.result) {
            lastUpdateIdRef.current = update.update_id;

            if (update.message) {
              const msg = update.message;
              const senderName = `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() || 'Telegram User';
              const senderUser = msg.from.username ? `@${msg.from.username}` : senderName;
              const text = msg.text || '';
              const chatId = msg.chat.id;

              // Check if contact was auto-shared via Telegram ID
              const sharedContact = (msg as any).contact;
              const sharedPhone = sharedContact?.phone_number;

              // Record or update user in CRM
              const tgUser: UserSubscriber = {
                id: `tg_${msg.from.id}`,
                telegramId: String(msg.from.id),
                name: senderName,
                username: senderUser,
                customerType: 'new',
                phone: sharedPhone || undefined,
                isPhoneVerified: !!sharedPhone,
                joinedAt: 'Just now',
                lastActiveAt: 'Just now',
                totalInteractions: 1,
                lastClickedButton: sharedPhone ? 'Shared Verified Phone' : text,
                tags: ['Real Telegram User', 'Live Sync'],
                status: 'active',
                avatarColor: '#2AABEE',
                unreadCount: 1,
              };

              setUsers((prev) => {
                const existing = prev.find((u) => u.telegramId === String(msg.from.id));
                if (existing) {
                  return prev.map((u) =>
                    u.telegramId === String(msg.from.id)
                      ? {
                          ...u,
                          name: senderName,
                          username: senderUser,
                          phone: sharedPhone || u.phone,
                          isPhoneVerified: !!sharedPhone || u.isPhoneVerified,
                          lastActiveAt: 'Just now',
                          totalInteractions: u.totalInteractions + 1,
                          lastClickedButton: sharedPhone ? 'Shared Verified Phone' : text,
                        }
                      : u
                  );
                }
                return [tgUser, ...prev];
              });

              if (sharedPhone) {
                addTelegramLog(`[Phone Auto-Shared] ${senderUser} shared phone number: ${sharedPhone}`, 'info');
                showToast(`New verified phone number from ${senderUser}: ${sharedPhone}`);
                triggerInteractionNotification({
                  userName: senderName,
                  userUsername: senderUser,
                  userTelegramId: String(msg.from.id),
                  actionText: `Shared verified phone: ${sharedPhone}`,
                  type: 'contact_shared',
                  phoneNumber: sharedPhone,
                  userId: `tg_${msg.from.id}`,
                });
              }

              // Add to conversation
              setMessages((prev) => [
                ...prev,
                {
                  id: `tg_msg_${msg.message_id}_${Date.now()}`,
                  userId: tgUser.id,
                  telegramId: String(msg.from.id),
                  userName: senderName,
                  sender: 'user',
                  isContactCard: !!sharedPhone,
                  contactData: sharedPhone
                    ? {
                        phoneNumber: sharedPhone,
                        firstName: msg.from.first_name || 'User',
                        lastName: msg.from.last_name,
                        userId: msg.from.id,
                      }
                    : undefined,
                  text: sharedPhone ? `📱 Shared contact: ${sharedPhone}` : (text || '[Sent media/attachment]'),
                  timestamp: getCurrentFormattedTime(),
                  status: 'read',
                },
              ]);

              addTelegramLog(`[Message] From ${senderUser}: "${text || (sharedPhone ? 'Shared Contact' : '')}"`, 'message');

              // When a user sends /start, check if they have already shared their phone number!
              if (text === '/start') {
                const telegramIdStr = String(msg.from.id);
                const existingUserRecord = usersRef.current.find(
                  (u) => u.telegramId === telegramIdStr || u.id === `tg_${msg.from.id}`
                );
                const hasSharedPhoneAlready = !!(
                  (existingUserRecord?.phone && existingUserRecord.phone.trim().length > 0) ||
                  existingUserRecord?.isPhoneVerified ||
                  sharedPhone ||
                  messagesRef.current.some(
                    (m) =>
                      (m.telegramId === telegramIdStr || m.userId === `tg_${msg.from.id}`) &&
                      (m.isContactCard || (m.text && m.text.includes('Shared contact:')))
                  )
                );

                if (hasSharedPhoneAlready) {
                  // User has ALREADY shared their number:
                  // 1. Categorise as existing client in CRM
                  setUsers((prev) =>
                    prev.map((u) => {
                      if (u.telegramId === telegramIdStr || u.id === `tg_${msg.from.id}`) {
                        const currentTimeline = u.activityTimeline || [];
                        return {
                          ...u,
                          customerType: 'existing',
                          lastActiveAt: 'Just now',
                          totalInteractions: (u.totalInteractions || 0) + 1,
                          activityTimeline: [
                            ...currentTimeline,
                            {
                              id: `act_${Date.now()}`,
                              timestamp: 'Just now',
                              action: 'Sent /start (Categorised as Existing Client with shared phone)',
                              type: 'start',
                            },
                          ],
                        };
                      }
                      return u;
                    })
                  );

                  // 2. Exact requested message: "hii  sir aap humse already  touch mein hai aaj aapki kya help karein"
                  const existingClientGreeting = 'hii  sir aap humse already  touch mein hai aaj aapki kya help karein';

                  showToast(`Existing client ${senderUser} recognized! Sent personal touch greeting.`);
                  addTelegramLog(
                    `[Existing Client] Recognized ${senderUser} with verified phone. Categorised as Existing Client & sent personal greeting without welcome banner.`,
                    'info'
                  );

                  triggerInteractionNotification({
                    userName: senderName,
                    userUsername: senderUser,
                    userTelegramId: telegramIdStr,
                    actionText: 'Sent /start (Existing client - Personal greeting sent)',
                    type: 'start',
                    phoneNumber: existingUserRecord?.phone || sharedPhone,
                    userId: `tg_${msg.from.id}`,
                  });

                  // 3. Do NOT share welcome banner (no image, no welcome caption). Deliver personal greeting!
                  const existingBotMsg: ChatMessage = {
                    id: `tg_welcome_${Date.now()}`,
                    userId: tgUser.id,
                    telegramId: telegramIdStr,
                    userName: senderName,
                    sender: 'bot',
                    text: existingClientGreeting,
                    buttons: settings.buttons,
                    timestamp: getCurrentFormattedTime(),
                    status: 'read',
                  };
                  setMessages((prev) => [...prev, existingBotMsg]);

                  await telegramApi.sendMessage(
                    token,
                    chatId,
                    existingClientGreeting,
                    settings.buttons
                  );
                  addTelegramLog(`[Delivered] Existing client message sent to ${senderUser}`, 'info');
                } else {
                  // New customer who hasn't shared phone yet: deliver configured welcome poster banner & buttons
                  showToast(`New user ${senderUser} sent /start! Actioning welcome poster & buttons.`);
                  addTelegramLog(`[Action] Delivering poster banner & buttons to ${senderUser} (Chat: ${chatId})`, 'info');
                  triggerInteractionNotification({
                    userName: senderName,
                    userUsername: senderUser,
                    userTelegramId: telegramIdStr,
                    actionText: 'Sent /start (Welcome banner & buttons actioned)',
                    type: 'start',
                    userId: `tg_${msg.from.id}`,
                  });

                  const welcomeCaption = `${settings.poster.title || ''}\n${settings.poster.description || settings.poster.caption || ''}`.trim();
                  const shouldSendPhoto = settings.poster.showWelcomeBanner !== false && !!settings.poster.imageUrl;

                  // Record bot welcome message into user's chat thread
                  const welcomeBotMsg: ChatMessage = {
                    id: `tg_welcome_${Date.now()}`,
                    userId: tgUser.id,
                    telegramId: telegramIdStr,
                    userName: senderName,
                    sender: 'bot',
                    imageUrl: shouldSendPhoto ? settings.poster.imageUrl : undefined,
                    text: welcomeCaption,
                    buttons: settings.buttons,
                    timestamp: getCurrentFormattedTime(),
                    status: 'read',
                  };
                  setMessages((prev) => [...prev, welcomeBotMsg]);

                  if (shouldSendPhoto) {
                    const sendRes = await telegramApi.sendPhoto(
                      token,
                      chatId,
                      settings.poster.imageUrl,
                      welcomeCaption,
                      settings.buttons
                    );
                    if (sendRes.ok) {
                      addTelegramLog(`[Delivered] Welcome banner & buttons sent to ${senderUser} ${sendRes.fallbackToText ? '(text fallback)' : 'via sendPhoto'}`, 'info');
                    } else {
                      addTelegramLog(`[Delivery Failed] Could not deliver to ${senderUser}: ${sendRes.description}`, 'info');
                    }
                  } else {
                    await telegramApi.sendMessage(
                      token,
                      chatId,
                      welcomeCaption || `${settings.profile.name} Welcome Desk`,
                      settings.buttons
                    );
                    addTelegramLog(`[Delivered] Welcome text & buttons sent to ${senderUser}`, 'info');
                  }
                }
              } else if (!sharedPhone && text) {
                triggerInteractionNotification({
                  userName: senderName,
                  userUsername: senderUser,
                  userTelegramId: String(msg.from.id),
                  actionText: `Sent message: "${text.slice(0, 45)}"`,
                  type: 'message',
                  userId: `tg_${msg.from.id}`,
                });
              } else if (text === '/help') {
                await telegramApi.sendMessage(
                  token,
                  chatId,
                  `ℹ️ Need assistance with ${settings.profile.name}?\n\n• Register: ${settings.about.registerUrl}\n• WhatsApp: ${settings.about.whatsappUrl1}\n\nOr reply right here!`
                );
              } else if (text && text.trim().length > 0) {
                // Smart auto-reply to user's text message on Telegram
                const lower = text.toLowerCase();
                let replyContent = `Thank you for your message! Our customer agent has received your request.\n\nFor instant priority service on WhatsApp: ${settings.about.whatsappUrl1}`;

                if (lower.includes('bonus') || lower.includes('10%') || lower.includes('50%')) {
                  replyContent = `🎁 Exclusive Bonus Offer Active!\n\n• 10% Extra on First Deposit\n• 50% Haar-Jeet Cashback on Cricket BLAST matches\n\nRegister now to claim: ${settings.about.registerUrl}`;
                } else if (lower.includes('id') || lower.includes('whatsapp') || lower.includes('support')) {
                  replyContent = `📲 Connect with our verified WhatsApp VIP Manager:\n👉 ${settings.about.whatsappUrl1}\n\nOur team is available 24/7 to issue your ID in under 1 minute!`;
                } else if (lower.includes('register') || lower.includes('link') || lower.includes('website')) {
                  replyContent = `💎 Official Winfix Auto-Registration Portal:\n👉 ${settings.about.registerUrl}\n\nSelf-deposit and automatic cashout active.`;
                }

                await telegramApi.sendMessage(token, chatId, replyContent);
                addTelegramLog(`[Auto-Replied] Sent response to ${senderUser}`, 'info');

                const autoReplyBotMsg: ChatMessage = {
                  id: `tg_reply_${Date.now()}`,
                  userId: tgUser.id,
                  telegramId: String(msg.from.id),
                  sender: 'bot',
                  text: replyContent,
                  timestamp: getCurrentFormattedTime(),
                  status: 'read',
                };
                setMessages((prev) => [...prev, autoReplyBotMsg]);
              }
            } else if (update.callback_query) {
              const cq = update.callback_query;

              const matchedBtn = settings.buttons.find(
                (b) => b.callbackKey === cq.data || b.id === cq.data
              );

              const sender = cq.from.username ? `@${cq.from.username}` : (cq.from.first_name || 'Subscriber');
              addTelegramLog(`[Button Click] ${sender} tapped "${matchedBtn?.label || cq.data}"`, 'callback');

              triggerInteractionNotification({
                userName: sender,
                userUsername: sender,
                userTelegramId: String(cq.from.id),
                actionText: `Tapped button: "${matchedBtn?.label || cq.data}"`,
                type: 'button_click',
                userId: `tg_${cq.from.id}`,
              });

              if (matchedBtn) {
                if (matchedBtn.actionType === 'popup_alert') {
                  // Show Telegram native popup dialog on user's phone!
                  await telegramApi.answerCallbackQuery(
                    token,
                    cq.id,
                    matchedBtn.popupText || matchedBtn.responseText || matchedBtn.label,
                    true
                  );
                } else if (matchedBtn.actionType === 'share_contact') {
                  await telegramApi.answerCallbackQuery(token, cq.id);
                  if (cq.message?.chat.id) {
                    await telegramApi.sendContactPrompt(
                      token,
                      cq.message.chat.id,
                      matchedBtn.responseText || 'Please tap below to share your phone number automatically:'
                    );
                  }
                } else {
                  await telegramApi.answerCallbackQuery(token, cq.id);
                  if (matchedBtn.responseText && cq.message?.chat.id) {
                    await telegramApi.sendMessage(
                      token,
                      cq.message.chat.id,
                      matchedBtn.responseText
                    );
                    const cbBotMsg: ChatMessage = {
                      id: `tg_cb_${Date.now()}`,
                      userId: `tg_${cq.from.id}`,
                      telegramId: String(cq.from.id),
                      sender: 'bot',
                      text: matchedBtn.responseText,
                      timestamp: getCurrentFormattedTime(),
                      status: 'read',
                    };
                    setMessages((prev) => [...prev, cbBotMsg]);
                  }
                }

                // Update analytics & user in CRM
                const newAnalyticEvent: ClickAnalytics = {
                  id: `ev_tg_${Date.now()}`,
                  buttonId: matchedBtn.id,
                  buttonLabel: `${matchedBtn.emoji || ''} ${matchedBtn.label}`.trim(),
                  userId: `tg_${cq.from.id}`,
                  timestamp: `Today, ${getCurrentFormattedTime()}`,
                  type:
                    matchedBtn.callbackKey === 'existing_customer'
                      ? 'existing_customer'
                      : matchedBtn.callbackKey === 'new_customer'
                      ? 'new_customer'
                      : 'custom',
                };
                setAnalytics((prev) => [newAnalyticEvent, ...prev]);

                setUsers((prev) =>
                  prev.map((u) =>
                    u.telegramId === String(cq.from.id)
                      ? {
                          ...u,
                          lastClickedButton: `${matchedBtn.emoji || ''} ${matchedBtn.label}`.trim(),
                          lastActiveAt: 'Just now',
                          totalInteractions: u.totalInteractions + 1,
                        }
                      : u
                  )
                );
              } else {
                await telegramApi.answerCallbackQuery(token, cq.id);
              }
            }
          }
        }
      } catch {
        // network polling retry
      }
    };

    const interval = setInterval(poll, 2500);
    poll();

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [settings.profile.token, settings.poster, settings.buttons, settings.about]);

  // Bot response dispatcher
  const handleUserSendMessage = (
    text: string,
    sender: 'user' | 'bot' | 'admin' = 'user',
    extra?: Partial<ChatMessage>
  ) => {
    const timestamp = getCurrentFormattedTime();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      sender,
      text,
      timestamp,
      status: 'read',
      ...extra,
    };

    setMessages((prev) => [...prev, newMsg]);

    if (sender === 'user') {
      // If contact was auto-shared from Telegram ID, update CRM immediately
      if (extra?.isContactCard && extra.contactData?.phoneNumber) {
        const phone = extra.contactData.phoneNumber;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === currentUser.id
              ? {
                  ...u,
                  phone,
                  isPhoneVerified: true,
                  lastActiveAt: 'Just now',
                  activityTimeline: [
                    ...(u.activityTimeline || []),
                    {
                      id: `act_${Date.now()}`,
                      timestamp: 'Just now',
                      action: `Verified phone number auto-shared: ${phone}`,
                      type: 'contact_shared',
                    },
                  ],
                }
              : u
          )
        );
        showToast(`Phone number ${phone} automatically pushed to CRM!`);
        triggerInteractionNotification({
          userName: currentUser.name,
          userUsername: currentUser.username,
          userTelegramId: currentUser.telegramId,
          actionText: `Shared verified phone: ${phone}`,
          type: 'contact_shared',
          phoneNumber: phone,
          userId: currentUser.id,
        });
      } else if (text.trim() === '/start') {
        triggerInteractionNotification({
          userName: currentUser.name,
          userUsername: currentUser.username,
          userTelegramId: currentUser.telegramId,
          actionText: 'Sent /start (Welcome banner & buttons displayed)',
          type: 'start',
          userId: currentUser.id,
        });
      } else {
        triggerInteractionNotification({
          userName: currentUser.name,
          userUsername: currentUser.username,
          userTelegramId: currentUser.telegramId,
          actionText: `Sent message: "${text.slice(0, 45)}"`,
          type: 'message',
          userId: currentUser.id,
        });
      }

      // Update current user interactions in CRM
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                totalInteractions: u.totalInteractions + 1,
                lastActiveAt: 'Just now',
              }
            : u
        )
      );

      // Handle /start command
      if (text.trim() === '/start') {
        const hasSharedPhoneAlready = !!(
          (currentUser.phone && currentUser.phone.trim().length > 0) ||
          currentUser.isPhoneVerified ||
          currentUser.customerType === 'existing' ||
          messages.some(
            (m) =>
              (m.userId === currentUser.id || m.telegramId === currentUser.telegramId) &&
              (m.isContactCard || (m.text && m.text.includes('Shared contact:')))
          )
        );

        if (hasSharedPhoneAlready) {
          // Categorise as an existing client!
          setUsers((prev) =>
            prev.map((u) =>
              u.id === currentUser.id
                ? {
                    ...u,
                    customerType: 'existing',
                    lastActiveAt: 'Just now',
                    totalInteractions: (u.totalInteractions || 0) + 1,
                    activityTimeline: [
                      ...(u.activityTimeline || []),
                      {
                        id: `act_${Date.now()}`,
                        timestamp: 'Just now',
                        action: 'Sent /start (Categorised as Existing Client with shared phone)',
                        type: 'start',
                      },
                    ],
                  }
                : u
            )
          );

          triggerInteractionNotification({
            userName: currentUser.name,
            userUsername: currentUser.username,
            userTelegramId: currentUser.telegramId,
            actionText: 'Sent /start (Existing client - Personal touch greeting)',
            type: 'start',
            phoneNumber: currentUser.phone,
            userId: currentUser.id,
          });

          setIsBotTyping(true);
          setTimeout(() => {
            setIsBotTyping(false);
            const existingClientMsg: ChatMessage = {
              id: `msg_existing_${Date.now()}`,
              userId: currentUser.id,
              telegramId: currentUser.telegramId,
              userName: currentUser.name,
              sender: 'bot',
              // We do NOT share him the welcome banner rather we will share him:
              text: 'hii  sir aap humse already  touch mein hai aaj aapki kya help karein',
              buttons: settings.buttons,
              timestamp: getCurrentFormattedTime(),
              status: 'read',
            };
            setMessages((prev) => [...prev, existingClientMsg]);
            if (settings.soundEnabled) sound.playReceive();
          }, 500);
          return;
        }

        // New client without shared phone: deliver configured welcome poster banner & buttons
        setIsBotTyping(true);
        setTimeout(() => {
          setIsBotTyping(false);
          const welcomeMsg: ChatMessage = {
            id: `msg_welcome_${Date.now()}`,
            userId: currentUser.id,
            telegramId: currentUser.telegramId,
            userName: currentUser.name,
            sender: 'bot',
            imageUrl: settings.poster.showWelcomeBanner !== false ? settings.poster.imageUrl : undefined,
            text: `${settings.poster.title || ''}\n${settings.poster.description || settings.poster.caption || ''}`.trim(),
            buttons: settings.buttons,
            timestamp: getCurrentFormattedTime(),
            status: 'read',
          };
          setMessages((prev) => [...prev, welcomeMsg]);
          if (settings.soundEnabled) sound.playReceive();
        }, 500);
        return;
      }

      // Handle /help or other commands
      if (text.trim() === '/help') {
        setIsBotTyping(true);
        setTimeout(() => {
          setIsBotTyping(false);
          const helpMsg: ChatMessage = {
            id: `msg_help_${Date.now()}`,
            sender: 'bot',
            text: `ℹ️ Need assistance with Winfix by Vikrant Exchange?\n\n• For Self-Service Account: ${settings.about.registerUrl}\n• For 24/7 WhatsApp VIP ID: ${settings.about.whatsappUrl1}\n• Or reply with your query right here and our admin will assist you!`,
            timestamp: getCurrentFormattedTime(),
            status: 'read',
          };
          setMessages((prev) => [...prev, helpMsg]);
          if (settings.soundEnabled) sound.playReceive();
        }, 400);
        return;
      }

      // Keyword smart auto-replies
      const lower = text.toLowerCase();
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        let replyContent = `Thank you for your message! Our customer agent has received your request.\n\nFor instant priority service on WhatsApp: ${settings.about.whatsappUrl1}`;

        if (lower.includes('bonus') || lower.includes('10%') || lower.includes('50%')) {
          replyContent = `🎁 Exclusive Bonus Offer Active!\n\n• 10% Extra on First Deposit\n• 50% Haar-Jeet Cashback on Cricket BLAST matches\n\nRegister now to claim: ${settings.about.registerUrl}`;
        } else if (lower.includes('id') || lower.includes('whatsapp') || lower.includes('support')) {
          replyContent = `📲 Connect with our verified WhatsApp VIP Manager:\n👉 ${settings.about.whatsappUrl1}\n\nOur team is available 24/7 to issue your ID in under 1 minute!`;
        } else if (lower.includes('register') || lower.includes('link') || lower.includes('website')) {
          replyContent = `💎 Official Winfix Auto-Registration Portal:\n👉 ${settings.about.registerUrl}\n\nSelf-deposit and automatic cashout active.`;
        }

        const autoReply: ChatMessage = {
          id: `msg_reply_${Date.now()}`,
          sender: 'bot',
          text: replyContent,
          timestamp: getCurrentFormattedTime(),
          status: 'read',
        };
        setMessages((prev) => [...prev, autoReply]);
        if (settings.soundEnabled) sound.playReceive();
      }, 700);
    }
  };

  // Button clicks from inline keyboard
  const handleButtonClick = (button: InlineButtonConfig) => {
    const timestamp = getCurrentFormattedTime();

    // Track analytics
    const clickType =
      button.callbackKey === 'existing_customer'
        ? 'existing_customer'
        : button.callbackKey === 'new_customer'
        ? 'new_customer'
        : button.actionType === 'whatsapp'
        ? 'whatsapp'
        : button.actionType === 'url'
        ? 'register_url'
        : 'custom';

    const newAnalyticEvent: ClickAnalytics = {
      id: `ev_${Date.now()}`,
      buttonId: button.id,
      buttonLabel: `${button.emoji || ''} ${button.label}`.trim(),
      userId: currentUser.id,
      timestamp: `Today, ${timestamp}`,
      type: clickType,
    };
    setAnalytics((prev) => [newAnalyticEvent, ...prev]);

    triggerInteractionNotification({
      userName: currentUser.name,
      userUsername: currentUser.username,
      userTelegramId: currentUser.telegramId,
      actionText: `Tapped button: "${button.label}"`,
      type: 'button_click',
      userId: currentUser.id,
    });

    // Update user in CRM
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              lastClickedButton: `${button.emoji || ''} ${button.label}`.trim(),
              lastActiveAt: 'Just now',
              totalInteractions: u.totalInteractions + 1,
              customerType:
                button.callbackKey === 'new_customer'
                  ? 'new'
                  : button.callbackKey === 'existing_customer'
                  ? 'existing'
                  : u.customerType,
            }
          : u
      )
    );

    // If it's a URL or WhatsApp action, open in new tab
    if (button.actionType === 'url' || button.actionType === 'whatsapp') {
      if (button.url) {
        window.open(button.url, '_blank', 'noopener,noreferrer');
        showToast(`Redirecting to ${button.url}`);
      }
      return;
    }

    // Callback flow: Send message as user, then bot answers
    const userMsg: ChatMessage = {
      id: `msg_btn_${Date.now()}`,
      sender: 'user',
      text: `${button.emoji || ''} ${button.label}`.trim(),
      timestamp,
      status: 'read',
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      const botResponse: ChatMessage = {
        id: `msg_resp_${Date.now()}`,
        sender: 'bot',
        text: button.responseText || `You selected: ${button.label}`,
        timestamp: getCurrentFormattedTime(),
        status: 'read',
      };
      setMessages((prev) => [...prev, botResponse]);
      if (settings.soundEnabled) sound.playReceive();
    }, 450);
  };

  // Link clicks on About card
  const handleLinkClick = (url: string, type: 'register_url' | 'whatsapp') => {
    const newAnalyticEvent: ClickAnalytics = {
      id: `ev_link_${Date.now()}`,
      buttonId: type,
      buttonLabel: type === 'whatsapp' ? 'WhatsApp Link' : 'Register URL',
      userId: currentUser.id,
      timestamp: `Today, ${getCurrentFormattedTime()}`,
      type,
    };
    setAnalytics((prev) => [newAnalyticEvent, ...prev]);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Opening ${url}`);
  };

  // Restart bot
  const handleRestartBot = () => {
    handleUserSendMessage('/start', 'user');
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    showToast('Chat history cleared. Send /start to begin.');
  };

  // Admin sending a direct message to a user
  const handleSendAdminMessage = (userId: string, text: string) => {
    const timestamp = getCurrentFormattedTime();
    const targetUser = users.find((u) => u.id === userId || u.telegramId === userId);
    const adminMsg: ChatMessage = {
      id: `msg_admin_${Date.now()}`,
      userId: targetUser ? targetUser.id : userId,
      telegramId: targetUser?.telegramId,
      userName: targetUser?.name,
      sender: 'admin',
      text,
      timestamp,
      status: 'sent',
    };
    setMessages((prev) => [...prev, adminMsg]);
    if (settings.soundEnabled) sound.playReceive();

    // If connected to real Telegram Bot API, dispatch to the real user!
    if (settings.profile.token && targetUser?.telegramId) {
      telegramApi.sendMessage(settings.profile.token, targetUser.telegramId, text).catch(() => {});
    }

    showToast('Official Admin message delivered to subscriber!');
  };

  // Real Telegram user message received via live listener
  const handleUserJoinedViaTelegram = (user: UserSubscriber, messageText: string) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u.telegramId === user.telegramId);
      if (exists) {
        return prev.map((u) =>
          u.telegramId === user.telegramId
            ? {
                ...u,
                lastActiveAt: 'Just now',
                totalInteractions: u.totalInteractions + 1,
                lastClickedButton: messageText,
              }
            : u
        );
      }
      return [user, ...prev];
    });

    const newMsg: ChatMessage = {
      id: `msg_tg_${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: getCurrentFormattedTime(),
      status: 'read',
    };
    setMessages((prev) => [...prev, newMsg]);
    showToast(`New live message from ${user.name} on Telegram!`);
  };

  // Admin sending a broadcast notification with real Telegram delivery reporting
  const handleSendBroadcast = async (
    broadcast: BroadcastCampaign,
    customChatIds?: string[]
  ): Promise<BroadcastResult> => {
    // Push into active simulator chat so admin sees the immediate effect!
    const broadcastMsg: ChatMessage = {
      id: `msg_bc_${Date.now()}`,
      sender: 'bot',
      imageUrl: broadcast.imageUrl,
      text: `📢 ANNOUNCEMENT:\n\n${broadcast.messageText}`,
      buttons: broadcast.buttons,
      timestamp: getCurrentFormattedTime(),
      status: 'read',
    };
    setMessages((prev: ChatMessage[]) => [...prev, broadcastMsg]);
    if (settings.soundEnabled) sound.playReceive();

    const logs: BroadcastDeliveryLog[] = [];
    let deliveredCount = 0;
    let failedCount = 0;

    // Target recipients: either explicit custom Chat IDs or CRM users with a telegramId
    const targetChatIds: { id: string; name: string }[] = [];

    if (customChatIds && customChatIds.length > 0) {
      customChatIds.forEach((cid) => {
        targetChatIds.push({ id: cid, name: `Chat ${cid}` });
      });
    } else {
      users.forEach((u) => {
        if (u.telegramId && u.telegramId.trim().length > 0) {
          targetChatIds.push({ id: u.telegramId, name: `${u.name} (${u.username || u.telegramId})` });
        }
      });
    }

    if (settings.profile.token && targetChatIds.length > 0) {
      const token = settings.profile.token.trim();

      for (const target of targetChatIds) {
        try {
          let sendResult;
          if (broadcast.imageUrl) {
            sendResult = await telegramApi.sendPhoto(
              token,
              target.id,
              broadcast.imageUrl,
              broadcast.messageText,
              broadcast.buttons
            );
          } else {
            sendResult = await telegramApi.sendMessage(
              token,
              target.id,
              broadcast.messageText,
              broadcast.buttons
            );
          }

          if (sendResult.ok) {
            deliveredCount++;
            logs.push({
              target: target.name,
              chatId: target.id,
              status: ('fallbackToText' in sendResult && sendResult.fallbackToText) ? 'fallback' : 'delivered',
              time: getCurrentFormattedTime(),
            });
          } else {
            failedCount++;
            logs.push({
              target: target.name,
              chatId: target.id,
              status: 'failed',
              error: sendResult.description || 'Failed to dispatch to this Chat ID',
              time: getCurrentFormattedTime(),
            });
          }
        } catch (err) {
          failedCount++;
          logs.push({
            target: target.name,
            chatId: target.id,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Network error connecting to Telegram',
            time: getCurrentFormattedTime(),
          });
        }
      }
    } else if (!settings.profile.token) {
      // Simulator demo delivery
      deliveredCount = 1;
      logs.push({
        target: 'Active Telegram Simulator',
        chatId: 'simulator_1',
        status: 'delivered',
        time: getCurrentFormattedTime(),
      });
    }

    const completedCampaign: BroadcastCampaign = {
      ...broadcast,
      status: failedCount > 0 && deliveredCount === 0 ? 'failed' : 'sent',
      recipientsCount: targetChatIds.length > 0 ? targetChatIds.length : 1,
      deliveredCount,
    };

    setBroadcasts((prev) => [completedCampaign, ...prev]);

    if (failedCount > 0) {
      showToast(`Broadcast finished: ${deliveredCount} delivered, ${failedCount} failed.`);
    } else {
      showToast(`Broadcast delivered to ${deliveredCount} subscriber(s)!`);
    }

    return {
      total: targetChatIds.length > 0 ? targetChatIds.length : 1,
      delivered: deliveredCount,
      failed: failedCount,
      logs,
    };
  };

  // Reset to clean slate
  const handleResetData = () => {
    storage.resetAll();
    setSettings(CLEAN_SETTINGS);
    setMessages(INITIAL_MESSAGES);
    setUsers(INITIAL_USERS);
    setBroadcasts(INITIAL_BROADCASTS);
    setAnalytics(INITIAL_ANALYTICS);
    showToast('Clean slate initialized! All prefilled items removed.');
  };

  // Export JSON backup
  const handleExportData = () => {
    const fullBackup = {
      settings,
      messages,
      users,
      broadcasts,
      analytics,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telebot_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON backup exported successfully.');
  };

  // Import JSON backup
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.broadcasts) setBroadcasts(parsed.broadcasts);
        if (parsed.analytics) setAnalytics(parsed.analytics);
        showToast('Configuration imported successfully!');
      } catch {
        showToast('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Handle staff logout
  const handleLogout = () => {
    storage.setIsLoggedIn(false);
    setIsLoggedIn(false);
    showToast('Logged out successfully.');
  };

  // If staff is not authenticated, display the User ID and Password Login Portal
  if (!isLoggedIn) {
    return (
      <LoginScreen
        staffList={staffList}
        botName={settings.profile.name}
        onLoginSuccess={(staff, remember) => {
          setCurrentStaff(staff);
          setIsLoggedIn(true);
          if (remember) {
            storage.setIsLoggedIn(true);
          }
          showToast(`Welcome back, ${staff.name}!`);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white border-2 border-slate-900 text-slate-900 px-4 py-2.5 rounded-lg shadow-xl text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-500 hover:text-slate-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Popup Notification on User Bot Interaction */}
      <NotificationPopup
        notification={activePopupNotification}
        onDismiss={() => setActivePopupNotification(null)}
        onOpenChat={handleOpenChatFromNotification}
      />

      {/* Main Content Area based on View Mode */}
      {viewMode === 'bot-only' ? (
        // Fullscreen Telegram Simulator Mode
        <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-6 bg-slate-200 relative">
          <button
            onClick={() => setViewMode('split')}
            className="absolute top-4 left-4 z-40 flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg border border-slate-700 hover:bg-black shadow-lg cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-sky-400" />
            <span>Open Admin Dashboard</span>
          </button>

          <div className="w-full max-w-[430px] h-[92vh] max-h-[880px]">
            <TelegramSimulator
              settings={settings}
              messages={messages}
              onSendMessage={handleUserSendMessage}
              onButtonClick={handleButtonClick}
              onLinkClick={handleLinkClick}
              onRestartBot={handleRestartBot}
              onClearChat={handleClearChat}
              currentUser={currentUser}
              isBotTyping={isBotTyping}
            />
          </div>
        </div>
      ) : (
        // Split or Admin-Only Layout
        <div className="flex w-full h-full overflow-hidden text-slate-900">
          {/* Admin Sidebar */}
          <AdminSidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            activeUsersCount={users.length}
            unreadMessagesCount={users.filter((u) => (u.unreadCount || 0) > 0).length}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            currentStaff={currentStaff}
            onOpenStaffPanel={() => setCurrentTab('staff')}
            onLogout={handleLogout}
          />

          {/* Admin Main Body */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-hidden text-slate-900">
            <AdminHeader
              currentTab={currentTab}
              onResetData={handleResetData}
              onExportData={handleExportData}
              onImportData={handleImportData}
              botName={settings.profile.name}
              subscribersCount={users.length}
              isPollingActive={isTelegramPolling}
              botUsername={settings.profile.username}
              currentStaff={currentStaff}
              onSwitchStaffClick={() => setCurrentTab('staff')}
              notifications={notificationsHistory}
              onOpenChat={handleOpenChatFromNotification}
              onLogout={handleLogout}
            />

            {/* Tab Body with Split Bot on the right if in 'split' mode */}
            <div className="flex-1 flex overflow-hidden">
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-900">
                {currentTab === 'overview' && (
                  <OverviewTab
                    settings={settings}
                    users={users}
                    analytics={analytics}
                    broadcasts={broadcasts}
                    onNavigateTab={setCurrentTab}
                    onSelectUserForChat={(u) => setSelectedUserForChat(u)}
                  />
                )}

                {currentTab === 'builder' && (
                  <BotBuilderTab
                    settings={settings}
                    onUpdateSettings={setSettings}
                  />
                )}

                {currentTab === 'users' && (
                  <CrmUsersTab
                    users={users}
                    onUpdateUsers={setUsers}
                    selectedUser={selectedUserForChat}
                    onSelectUser={setSelectedUserForChat}
                    onSendAdminMessage={handleSendAdminMessage}
                    messages={messages}
                    currentStaff={currentStaff}
                    staffList={staffList}
                  />
                )}

                {currentTab === 'broadcast' && (
                  <BroadcastTab
                    broadcasts={broadcasts}
                    onSendBroadcast={handleSendBroadcast}
                    subscribersCount={users.length}
                    users={users}
                    botToken={settings.profile.token}
                  />
                )}

                {currentTab === 'analytics' && (
                  <AnalyticsTab
                    analytics={analytics}
                    users={users}
                  />
                )}

                {currentTab === 'api' && (
                  <TelegramApiTab
                    settings={settings}
                    onUpdateSettings={setSettings}
                    onUserJoinedViaTelegram={handleUserJoinedViaTelegram}
                    isLiveListening={isTelegramPolling}
                    liveLogs={telegramLogs}
                  />
                )}

                {currentTab === 'staff' && (
                  <StaffPanel
                    staffList={staffList}
                    currentStaff={currentStaff}
                    onSelectStaff={(s) => {
                      setCurrentStaff(s);
                      showToast(`Switched active profile to ${s.name} (${s.role.replace('_', ' ')})`);
                    }}
                    onUpdateStaffList={setStaffList}
                  />
                )}
              </main>

              {/* Side-by-Side Live Telegram Simulator (Split View) */}
              {viewMode === 'split' && (
                <div className="hidden xl:flex w-[420px] 2xl:w-[460px] p-4 bg-slate-200/90 border-l border-slate-300 flex-col items-center justify-center shrink-0 text-slate-900">
                  <div className="w-full flex items-center justify-between pb-2 text-xs text-slate-700">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                      Live Telegram Bot Simulator
                    </span>
                    <button
                      onClick={() => setViewMode('bot-only')}
                      className="text-[11px] text-sky-700 font-bold hover:underline cursor-pointer"
                    >
                      Expand Fullscreen
                    </button>
                  </div>

                  <div className="w-full h-full max-h-[820px]">
                    <TelegramSimulator
                      settings={settings}
                      messages={messages}
                      onSendMessage={handleUserSendMessage}
                      onButtonClick={handleButtonClick}
                      onLinkClick={handleLinkClick}
                      onRestartBot={handleRestartBot}
                      onClearChat={handleClearChat}
                      currentUser={currentUser}
                      isBotTyping={isBotTyping}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
