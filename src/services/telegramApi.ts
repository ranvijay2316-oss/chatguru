import { InlineButtonConfig } from '../types';

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

class TelegramApiService {
  private formatInlineKeyboard(buttons?: InlineButtonConfig[]) {
    if (!buttons || buttons.length === 0) return undefined;

    return {
      inline_keyboard: buttons.map((b) => {
        const text = `${b.emoji ? b.emoji + ' ' : ''}${b.label}`;
        if (b.actionType === 'url' || b.actionType === 'whatsapp') {
          return [{ text, url: b.url || 'https://telegram.org' }];
        }
        if (b.actionType === 'web_app') {
          return [{ text, web_app: { url: b.webAppUrl || b.url || 'https://telegram.org' } }];
        }
        if (b.actionType === 'switch_inline') {
          return [{ text, switch_inline_query: b.shareText || '' }];
        }
        // For callback, popup_alert, share_contact, etc.
        return [{ text, callback_data: b.callbackKey || b.id }];
      }),
    };
  }

  // Send a native Telegram Reply Keyboard requesting contact without manual typing
  async sendContactPrompt(
    token: string,
    chatId: number | string,
    text = 'Please tap the button below to automatically share your verified phone number with us:'
  ): Promise<{ ok: boolean; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: {
            keyboard: [
              [
                {
                  text: '📱 Share My Phone Number (Auto-Verify)',
                  request_contact: true,
                },
              ],
            ],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        }),
      });
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to send contact prompt',
      };
    }
  }

  async getMe(token: string): Promise<{ ok: boolean; result?: TelegramBotInfo; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const data = await response.json();
      return data;
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Network error connecting to Telegram API',
      };
    }
  }

  async getWebhookInfo(token: string): Promise<{ ok: boolean; result?: { url: string; has_custom_certificate: boolean; pending_update_count: number; last_error_message?: string }; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/getWebhookInfo`);
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to fetch webhook info',
      };
    }
  }

  async setWebhook(token: string, webhookUrl: string): Promise<{ ok: boolean; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to set webhook',
      };
    }
  }

  async deleteWebhook(token: string): Promise<{ ok: boolean; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook`, {
        method: 'POST',
      });
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to delete webhook',
      };
    }
  }

  // Set the "What can this bot do?" card that appears before the user clicks START
  async setMyDescription(token: string, description: string): Promise<{ ok: boolean; description?: string }> {
    try {
      const cleanToken = token.trim();
      // Telegram Bot API limits description to 512 characters
      const trimmedDesc = description.slice(0, 512);
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmedDesc }),
      });
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to set bot description',
      };
    }
  }

  async getMyDescription(token: string): Promise<{ ok: boolean; result?: { description: string }; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/getMyDescription`);
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to get bot description',
      };
    }
  }

  async setMyShortDescription(token: string, shortDescription: string): Promise<{ ok: boolean; description?: string }> {
    try {
      const cleanToken = token.trim();
      const trimmed = shortDescription.slice(0, 120);
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: trimmed }),
      });
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to set short description',
      };
    }
  }

  async setMyName(token: string, name: string): Promise<{ ok: boolean; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/setMyName`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.slice(0, 64) }),
      });
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to set bot name',
      };
    }
  }

  async sendMessage(
    token: string,
    chatId: number | string,
    text: string,
    buttons?: InlineButtonConfig[]
  ): Promise<{ ok: boolean; description?: string; result?: unknown }> {
    try {
      const cleanToken = token.trim();
      const body: Record<string, unknown> = {
        chat_id: chatId,
        text,
      };

      const reply_markup = this.formatInlineKeyboard(buttons);
      if (reply_markup) {
        body.reply_markup = reply_markup;
      }

      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to send message',
      };
    }
  }

  async sendPhoto(
    token: string,
    chatId: number | string,
    photoUrl: string,
    caption?: string,
    buttons?: InlineButtonConfig[]
  ): Promise<{ ok: boolean; description?: string; result?: unknown; fallbackToText?: boolean }> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { ok: false, description: 'Telegram Bot Token is missing or empty' };
    }

    if (!photoUrl || !photoUrl.trim()) {
      // No photo provided, send as standard message
      const textRes = await this.sendMessage(cleanToken, chatId, caption || 'Welcome!', buttons);
      return {
        ok: textRes.ok,
        description: textRes.description,
        fallbackToText: true,
        result: textRes.result,
      };
    }

    const reply_markup = this.formatInlineKeyboard(buttons);
    // Telegram restricts photo captions to 1024 characters
    const trimmedCaption = caption ? caption.slice(0, 1024) : undefined;

    // 1. If photo is a relative URL (/assets/...) or blob/data URI, upload directly via FormData
    const isLocalPath = photoUrl.startsWith('/') || photoUrl.startsWith('./') || photoUrl.startsWith('data:') || photoUrl.startsWith('blob:');

    if (isLocalPath) {
      try {
        const fullUrl = photoUrl.startsWith('/') ? `${window.location.origin}${photoUrl}` : photoUrl;
        const imgFetch = await fetch(fullUrl);
        if (imgFetch.ok) {
          const blob = await imgFetch.blob();
          const formData = new FormData();
          formData.append('chat_id', String(chatId));
          formData.append('photo', blob, 'poster.png');
          if (trimmedCaption) formData.append('caption', trimmedCaption);
          if (reply_markup) formData.append('reply_markup', JSON.stringify(reply_markup));

          const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendPhoto`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.ok) {
            return data;
          }
          // If Telegram rejected it due to a permission error (e.g. 403 Forbidden), return immediately
          if (data.description && (data.description.includes('bot can\'t initiate') || data.description.includes('chat not found') || data.description.includes('blocked'))) {
            return data;
          }
        }
      } catch (err) {
        console.warn('Local photo upload via FormData failed, attempting fallback...', err);
      }
    }

    // 2. If photo is a public HTTP/HTTPS URL, try standard JSON payload
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      try {
        const body: Record<string, unknown> = {
          chat_id: chatId,
          photo: photoUrl,
        };
        if (trimmedCaption) body.caption = trimmedCaption;
        if (reply_markup) body.reply_markup = reply_markup;

        const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (data.ok) return data;

        // If permission error, return directly
        if (data.description && (data.description.includes('bot can\'t initiate') || data.description.includes('chat not found') || data.description.includes('blocked'))) {
          return data;
        }

        // Try downloading blob and sending via FormData if URL was unreachable by Telegram servers
        try {
          const imgFetch = await fetch(photoUrl);
          if (imgFetch.ok) {
            const blob = await imgFetch.blob();
            const formData = new FormData();
            formData.append('chat_id', String(chatId));
            formData.append('photo', blob, 'poster.png');
            if (trimmedCaption) formData.append('caption', trimmedCaption);
            if (reply_markup) formData.append('reply_markup', JSON.stringify(reply_markup));

            const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendPhoto`, {
              method: 'POST',
              body: formData,
            });
            const blobData = await res.json();
            if (blobData.ok) return blobData;
            if (blobData.description && (blobData.description.includes('bot can\'t initiate') || blobData.description.includes('chat not found') || blobData.description.includes('blocked'))) {
              return blobData;
            }
          }
        } catch {
          // ignore and proceed to fallback
        }
      } catch (err) {
        console.warn('Public photo fetch failed:', err);
      }
    }

    // 3. Fallback: Always ensure user receives text & buttons even if Telegram could not load the image!
    const fallbackText = caption && caption.trim().length > 0 ? caption : 'Welcome!';
    const textRes = await this.sendMessage(cleanToken, chatId, fallbackText, buttons);
    return {
      ok: textRes.ok,
      description: textRes.ok ? 'Delivered as text & buttons (photo URL was unreachable by Telegram)' : textRes.description,
      fallbackToText: true,
      result: textRes.result,
    };
  }

  async getUpdates(
    token: string,
    offset = 0
  ): Promise<{ ok: boolean; result?: TelegramUpdate[]; description?: string }> {
    try {
      const cleanToken = token.trim();
      const response = await fetch(
        `https://api.telegram.org/bot${cleanToken}/getUpdates?offset=${offset}&timeout=1`
      );
      return await response.json();
    } catch (err: unknown) {
      return {
        ok: false,
        description: err instanceof Error ? err.message : 'Failed to poll updates',
      };
    }
  }

  async answerCallbackQuery(token: string, callbackQueryId: string, text?: string, showAlert?: boolean): Promise<{ ok: boolean }> {
    try {
      const cleanToken = token.trim();
      const body: Record<string, unknown> = {
        callback_query_id: callbackQueryId,
      };
      if (text) body.text = text;
      if (showAlert) body.show_alert = true;

      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch {
      return { ok: false };
    }
  }
}

export const telegramApi = new TelegramApiService();
