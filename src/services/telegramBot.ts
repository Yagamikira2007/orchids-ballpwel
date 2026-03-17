// Telegram Bot Service
// This service handles all Telegram Bot API interactions

export interface TelegramChannel {
  id: string;
  chatId: string;
  name: string;
  type: 'channel' | 'group' | 'supergroup';
  username?: string;
  isActive: boolean;
  addedAt: string;
  memberCount?: number;
}

export interface LiveStream {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  streamUrl: string;
  thumbnailUrl?: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'ended';
  broadcastChannels: string[]; // channel IDs
  messageIds: Record<string, number>; // chatId -> messageId for editing
  createdAt: string;
}

export interface BotSettings {
  token: string;
  username: string;
  welcomeMessage: string;
  streamStartMessage: string;
  streamEndMessage: string;
  isEnabled: boolean;
}

export interface BroadcastMessage {
  id: string;
  channelId: string;
  messageId?: number;
  streamId: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
}

export class TelegramBotService {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async getMe(): Promise<{ ok: boolean; result?: { id: number; username: string; first_name: string } }> {
    try {
      const res = await fetch(`${this.baseUrl}/getMe`);
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async getChatInfo(chatId: string): Promise<{ ok: boolean; result?: { id: number; title: string; type: string; username?: string } }> {
    try {
      const res = await fetch(`${this.baseUrl}/getChat?chat_id=${chatId}`);
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async getMemberCount(chatId: string): Promise<number> {
    try {
      const res = await fetch(`${this.baseUrl}/getChatMemberCount?chat_id=${chatId}`);
      const data = await res.json();
      return data.ok ? data.result : 0;
    } catch {
      return 0;
    }
  }

  async sendMessage(chatId: string, text: string, options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    inlineKeyboard?: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
    disableNotification?: boolean;
  }): Promise<{ ok: boolean; result?: { message_id: number } }> {
    try {
      const body: Record<string, unknown> = {
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || 'HTML',
        disable_notification: options?.disableNotification || false,
      };

      if (options?.inlineKeyboard) {
        body.reply_markup = { inline_keyboard: options.inlineKeyboard };
      }

      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async sendPhoto(chatId: string, photoUrl: string, caption: string, options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    inlineKeyboard?: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
  }): Promise<{ ok: boolean; result?: { message_id: number } }> {
    try {
      const body: Record<string, unknown> = {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: options?.parseMode || 'HTML',
      };

      if (options?.inlineKeyboard) {
        body.reply_markup = { inline_keyboard: options.inlineKeyboard };
      }

      const res = await fetch(`${this.baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async editMessage(chatId: string, messageId: number, text: string, options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    inlineKeyboard?: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
  }): Promise<{ ok: boolean }> {
    try {
      const body: Record<string, unknown> = {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: options?.parseMode || 'HTML',
      };

      if (options?.inlineKeyboard) {
        body.reply_markup = { inline_keyboard: options.inlineKeyboard };
      }

      const res = await fetch(`${this.baseUrl}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async pinMessage(chatId: string, messageId: number): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/pinChatMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
      });
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  async deleteMessage(chatId: string, messageId: number): Promise<{ ok: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
      });
      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  formatStreamStartMessage(stream: LiveStream, streamPageUrl: string): string {
    const kickoffTime = new Date(stream.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `🔴 <b>LIVE NOW</b>

⚽ <b>${stream.homeTeam}</b> vs <b>${stream.awayTeam}</b>
🏆 ${stream.competition}
⏰ Kickoff: ${kickoffTime}

📺 <b>Watch Live Stream Below!</b>
🔗 Click the button to watch now`;
  }

  formatStreamEndMessage(stream: LiveStream, result?: string): string {
    return `✅ <b>MATCH ENDED</b>

⚽ <b>${stream.homeTeam}</b> vs <b>${stream.awayTeam}</b>
🏆 ${stream.competition}
${result ? `📊 Final Score: <b>${result}</b>` : ''}

Thanks for watching! Stay tuned for more live streams. 🙌`;
  }

  formatScheduleMessage(stream: LiveStream, streamPageUrl: string): string {
    const matchTime = new Date(stream.startTime).toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `📅 <b>UPCOMING MATCH</b>

⚽ <b>${stream.homeTeam}</b> vs <b>${stream.awayTeam}</b>
🏆 ${stream.competition}
🕐 Match Time: ${matchTime}

🔔 Turn on notifications so you don't miss it!`;
  }
}

export const createBotService = (token: string) => new TelegramBotService(token);
