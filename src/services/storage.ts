import {
  BotSettings,
  ChatMessage,
  UserSubscriber,
  BroadcastCampaign,
  ClickAnalytics,
  StaffMember
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'telebot_v5_clean_zero_settings',
  MESSAGES: 'telebot_v5_clean_zero_messages',
  USERS: 'telebot_v5_clean_zero_users',
  BROADCASTS: 'telebot_v5_clean_zero_broadcasts',
  ANALYTICS: 'telebot_v5_clean_zero_analytics',
  STAFF: 'telebot_v5_clean_zero_staff',
  CURRENT_STAFF: 'telebot_v5_clean_zero_current_staff',
  AUTH_LOGGED_IN: 'telebot_auth_logged_in_v1',
};

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff_1',
    name: 'Admin',
    email: 'admin@telegrambot.com',
    username: 'admin',
    password: 'admin123',
    role: 'super_admin',
    avatarUrl: '',
    active: true,
    assignedChatsCount: 0,
    lastLoginAt: 'Active Now',
    pin: '1234',
    phone: '+91 98000 00001',
  },
  {
    id: 'staff_2',
    name: 'Support Agent',
    email: 'agent@telegrambot.com',
    username: 'agent',
    password: 'agent123',
    role: 'support_agent',
    avatarUrl: '',
    active: true,
    assignedChatsCount: 0,
    lastLoginAt: 'Active Now',
    pin: '1234',
    phone: '+91 98000 00002',
  },
];

export const CLEAN_SETTINGS: BotSettings = {
  profile: {
    name: '',
    username: '',
    subtitle: '',
    avatarUrl: '',
    isVerified: false,
    token: '',
    webhookUrl: '',
  },
  about: {
    title: '',
    descriptionText: '',
    registerUrl: '',
    whatsappUrl1: '',
    whatsappUrl2: '',
  },
  poster: {
    imageUrl: '',
    title: '',
    caption: '',
    aspectRatio: '16:9',
  },
  buttons: [],
  quickReplies: ['/start'],
  theme: 'telegram-green',
  soundEnabled: true,
  autoGreetingEnabled: true,
};

export const INITIAL_USERS: UserSubscriber[] = [];
export const INITIAL_MESSAGES: ChatMessage[] = [];
export const INITIAL_BROADCASTS: BroadcastCampaign[] = [];
export const INITIAL_ANALYTICS: ClickAnalytics[] = [];

export class StorageService {
  getSettings(): BotSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return CLEAN_SETTINGS;
  }

  saveSettings(settings: BotSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Fallback
    }
  }

  getMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_MESSAGES;
  }

  saveMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch {
      // Fallback
    }
  }

  getUsers(): UserSubscriber[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_USERS;
  }

  saveUsers(users: UserSubscriber[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {
      // Fallback
    }
  }

  getBroadcasts(): BroadcastCampaign[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BROADCASTS);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_BROADCASTS;
  }

  saveBroadcasts(broadcasts: BroadcastCampaign[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BROADCASTS, JSON.stringify(broadcasts));
    } catch {
      // Fallback
    }
  }

  getAnalytics(): ClickAnalytics[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return INITIAL_ANALYTICS;
  }

  saveAnalytics(analytics: ClickAnalytics[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
    } catch {
      // Fallback
    }
  }

  getStaff(): StaffMember[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return DEFAULT_STAFF_MEMBERS;
  }

  saveStaff(staff: StaffMember[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
    } catch {
      // Fallback
    }
  }

  getCurrentStaff(): StaffMember {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_STAFF);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return DEFAULT_STAFF_MEMBERS[0];
  }

  saveCurrentStaff(staff: StaffMember): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STAFF, JSON.stringify(staff));
    } catch {
      // Fallback
    }
  }

  getIsLoggedIn(): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_LOGGED_IN);
      return data === 'true';
    } catch {
      return false;
    }
  }

  setIsLoggedIn(isLoggedIn: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_LOGGED_IN, isLoggedIn ? 'true' : 'false');
    } catch {
      // Fallback
    }
  }

  resetAll(): void {
    localStorage.clear();
  }
}

export const storage = new StorageService();
