export type ButtonActionType =
  | 'url'            // Open website or portal URL
  | 'callback'       // Send automated reply message in chat
  | 'popup_alert'    // Show Telegram native popup modal / alert dialog
  | 'share_contact'  // Auto-push phone number from Telegram ID (no typing needed)
  | 'share_location' // Auto-push location from Telegram
  | 'whatsapp'       // One-tap WhatsApp Helpline redirect
  | 'web_app'        // Open Telegram Mini App / WebApp modal
  | 'switch_inline'; // Share bot with friends or channels

export interface InlineButtonConfig {
  id: string;
  label: string;
  emoji?: string;
  actionType: ButtonActionType;
  url?: string;
  callbackKey?: string;
  responseText?: string;
  popupTitle?: string;
  popupText?: string;       // Custom text displayed in Telegram native popup dialog
  showAsAlert?: boolean;    // If true, Telegram displays a modal dialog with OK button
  webAppUrl?: string;       // URL for Telegram Mini App
  shareText?: string;       // Text for referral / sharing
  row?: number;             // 0 or 1 for grouping in rows
  order: number;
}

export interface BotPosterConfig {
  imageUrl: string;
  title: string;
  caption: string;
  description?: string;
  showWelcomeBanner?: boolean;
  aspectRatio?: string;
}

export interface InteractionNotification {
  id: string;
  userName: string;
  userUsername?: string;
  userTelegramId: string;
  actionText: string;
  type: 'message' | 'start' | 'contact_shared' | 'button_click';
  timestamp: string;
  phoneNumber?: string;
  userId: string;
}

export interface BotAboutConfig {
  title: string;
  descriptionText: string;
  registerUrl: string;
  whatsappUrl1: string;
  whatsappUrl2: string;
}

export interface BotProfileConfig {
  name: string;
  username: string;
  subtitle: string;
  avatarUrl: string;
  isVerified: boolean;
  token?: string;
  webhookUrl?: string;
}

export interface BotSettings {
  profile: BotProfileConfig;
  about: BotAboutConfig;
  poster: BotPosterConfig;
  buttons: InlineButtonConfig[];
  quickReplies: string[];
  theme: 'telegram-green' | 'dark' | 'telegram-blue' | 'day-light';
  soundEnabled: boolean;
  autoGreetingEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  telegramId?: string;
  userName?: string;
  sender: 'user' | 'bot' | 'admin';
  text?: string;
  imageUrl?: string;
  buttons?: InlineButtonConfig[];
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isCommand?: boolean;
  replyToId?: string;
  isContactCard?: boolean;
  contactData?: {
    phoneNumber: string;
    firstName: string;
    lastName?: string;
    userId?: number | string;
  };
}

export interface UserActivityItem {
  id: string;
  timestamp: string;
  action: string;
  type: 'message' | 'button' | 'link' | 'admin_reply' | 'start' | 'contact_shared';
  detail?: string;
}

export type StaffRole = 'super_admin' | 'support_agent' | 'marketing_manager';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: StaffRole;
  avatarUrl?: string;
  active: boolean;
  assignedChatsCount: number;
  lastLoginAt: string;
  pin?: string;
  phone?: string;
}

export interface UserSubscriber {
  id: string;
  telegramId: string;
  name: string;
  username: string;
  customerType: 'new' | 'existing' | 'vip' | 'lead';
  phone?: string;
  isPhoneVerified?: boolean;
  joinedAt: string;
  firstChatDate?: string;
  firstChatDay?: string;
  lastActiveAt: string;
  totalInteractions: number;
  lastClickedButton?: string;
  tags: string[];
  status: 'active' | 'blocked' | 'unsubscribed';
  avatarColor: string;
  notes?: string;
  unreadCount?: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  activityTimeline?: UserActivityItem[];
  registrationSource?: 'telegram_bot' | 'web_portal' | 'whatsapp';
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  messageText: string;
  imageUrl?: string;
  targetAudience: 'all' | 'new_customers' | 'existing_customers';
  scheduledAt?: string;
  sentAt: string;
  status: 'sent' | 'scheduled' | 'draft' | 'sending' | 'failed';
  recipientsCount: number;
  deliveredCount: number;
  clicksCount: number;
  buttons?: InlineButtonConfig[];
}

export interface ClickAnalytics {
  id: string;
  buttonId: string;
  buttonLabel: string;
  userId: string;
  timestamp: string;
  type: 'existing_customer' | 'new_customer' | 'whatsapp' | 'register_url' | 'custom';
}

export interface TelegramConnectionState {
  isConnected: boolean;
  botId?: string;
  botFirstName?: string;
  botUsername?: string;
  canJoinGroups?: boolean;
  canReadAllGroupMessages?: boolean;
  supportsInlineQueries?: boolean;
  isPollingActive: boolean;
  lastSyncAt?: string;
  webhookStatus?: 'not_set' | 'active' | 'error';
  pendingUpdatesCount?: number;
}
