import { useState, useCallback } from 'react';
import { TelegramBotService, TelegramChannel, LiveStream, BotSettings } from '@/services/telegramBot';

const STORAGE_KEY = 'telegram_bot_data';

interface BotData {
  settings: BotSettings;
  channels: TelegramChannel[];
  streams: LiveStream[];
}

const defaultSettings: BotSettings = {
  token: '',
  username: '',
  welcomeMessage: '👋 Welcome! Get live football stream notifications here.',
  streamStartMessage: '🔴 LIVE NOW: {homeTeam} vs {awayTeam}',
  streamEndMessage: '✅ Match Ended: {homeTeam} vs {awayTeam}',
  isEnabled: false,
};

function loadData(): BotData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { settings: defaultSettings, channels: [], streams: [] };
}

function saveData(data: BotData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useTelegramBot() {
  const [data, setData] = useState<BotData>(loadData);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState<string | null>(null);

  const persist = useCallback((updater: (prev: BotData) => BotData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  // Settings
  const updateSettings = useCallback((patch: Partial<BotSettings>) => {
    persist(d => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, [persist]);

  const verifyToken = useCallback(async (token: string): Promise<{ ok: boolean; username?: string }> => {
    setIsVerifying(true);
    try {
      const svc = new TelegramBotService(token);
      const res = await svc.getMe();
      if (res.ok && res.result) {
        persist(d => ({
          ...d,
          settings: { ...d.settings, token, username: res.result!.username, isEnabled: true },
        }));
        return { ok: true, username: res.result.username };
      }
      return { ok: false };
    } finally {
      setIsVerifying(false);
    }
  }, [persist]);

  // Channels
  const addChannel = useCallback(async (chatId: string): Promise<{ ok: boolean; channel?: TelegramChannel; error?: string }> => {
    if (!data.settings.token) return { ok: false, error: 'Bot token not configured' };
    const svc = new TelegramBotService(data.settings.token);
    const info = await svc.getChatInfo(chatId);
    if (!info.ok || !info.result) return { ok: false, error: 'Could not fetch channel info. Make sure the bot is added as admin.' };

    const exists = data.channels.find(c => c.chatId === String(info.result!.id));
    if (exists) return { ok: false, error: 'Channel already added' };

    const memberCount = await svc.getMemberCount(chatId);
    const channel: TelegramChannel = {
      id: crypto.randomUUID(),
      chatId: String(info.result.id),
      name: info.result.title,
      type: info.result.type as TelegramChannel['type'],
      username: info.result.username,
      isActive: true,
      addedAt: new Date().toISOString(),
      memberCount,
    };

    persist(d => ({ ...d, channels: [...d.channels, channel] }));
    return { ok: true, channel };
  }, [data.settings.token, data.channels, persist]);

  const removeChannel = useCallback((id: string) => {
    persist(d => ({ ...d, channels: d.channels.filter(c => c.id !== id) }));
  }, [persist]);

  const toggleChannel = useCallback((id: string) => {
    persist(d => ({
      ...d,
      channels: d.channels.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c),
    }));
  }, [persist]);

  // Streams
  const addStream = useCallback((stream: Omit<LiveStream, 'id' | 'createdAt' | 'messageIds'>): LiveStream => {
    const newStream: LiveStream = {
      ...stream,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      messageIds: {},
    };
    persist(d => ({ ...d, streams: [newStream, ...d.streams] }));
    return newStream;
  }, [persist]);

  const updateStream = useCallback((id: string, patch: Partial<LiveStream>) => {
    persist(d => ({
      ...d,
      streams: d.streams.map(s => s.id === id ? { ...s, ...patch } : s),
    }));
  }, [persist]);

  const deleteStream = useCallback((id: string) => {
    persist(d => ({ ...d, streams: d.streams.filter(s => s.id !== id) }));
  }, [persist]);

  // Broadcast stream go-live to selected channels
  const broadcastGoLive = useCallback(async (
    streamId: string,
    streamPageUrl: string,
    channelIds: string[],
    pin: boolean = false,
  ): Promise<{ success: number; failed: number }> => {
    if (!data.settings.token) return { success: 0, failed: channelIds.length };
    const stream = data.streams.find(s => s.id === streamId);
    if (!stream) return { success: 0, failed: channelIds.length };

    setIsBroadcasting(streamId);
    const svc = new TelegramBotService(data.settings.token);
    let success = 0;
    let failed = 0;
    const newMessageIds: Record<string, number> = { ...stream.messageIds };

    const targetChannels = data.channels.filter(c => channelIds.includes(c.id) && c.isActive);

    for (const ch of targetChannels) {
      const text = svc.formatStreamStartMessage(stream, streamPageUrl);
      const keyboard = [[{ text: '📺 Watch Live', url: streamPageUrl }]];

      let result;
      if (stream.thumbnailUrl) {
        result = await svc.sendPhoto(ch.chatId, stream.thumbnailUrl, text, { inlineKeyboard: keyboard });
      } else {
        result = await svc.sendMessage(ch.chatId, text, { inlineKeyboard: keyboard });
      }

      if (result.ok && result.result) {
        newMessageIds[ch.chatId] = result.result.message_id;
        if (pin) await svc.pinMessage(ch.chatId, result.result.message_id);
        success++;
      } else {
        failed++;
      }
    }

    persist(d => ({
      ...d,
      streams: d.streams.map(s =>
        s.id === streamId
          ? { ...s, status: 'live', messageIds: newMessageIds, broadcastChannels: channelIds }
          : s
      ),
    }));

    setIsBroadcasting(null);
    return { success, failed };
  }, [data.settings.token, data.streams, data.channels, persist]);

  // Broadcast stream ended
  const broadcastStreamEnd = useCallback(async (
    streamId: string,
    result?: string,
  ): Promise<{ success: number; failed: number }> => {
    if (!data.settings.token) return { success: 0, failed: 0 };
    const stream = data.streams.find(s => s.id === streamId);
    if (!stream) return { success: 0, failed: 0 };

    setIsBroadcasting(streamId);
    const svc = new TelegramBotService(data.settings.token);
    let success = 0;
    let failed = 0;

    const targetChannels = data.channels.filter(c =>
      stream.broadcastChannels.includes(c.id) && c.isActive
    );

    for (const ch of targetChannels) {
      const msgId = stream.messageIds[ch.chatId];
      const text = svc.formatStreamEndMessage(stream, result);

      let res;
      if (msgId) {
        res = await svc.editMessage(ch.chatId, msgId, text);
      } else {
        res = await svc.sendMessage(ch.chatId, text);
      }

      if (res.ok) success++; else failed++;
    }

    persist(d => ({
      ...d,
      streams: d.streams.map(s => s.id === streamId ? { ...s, status: 'ended' } : s),
    }));

    setIsBroadcasting(null);
    return { success, failed };
  }, [data.settings.token, data.streams, data.channels, persist]);

  // Broadcast schedule announcement
  const broadcastSchedule = useCallback(async (
    streamId: string,
    streamPageUrl: string,
    channelIds: string[],
  ): Promise<{ success: number; failed: number }> => {
    if (!data.settings.token) return { success: 0, failed: channelIds.length };
    const stream = data.streams.find(s => s.id === streamId);
    if (!stream) return { success: 0, failed: channelIds.length };

    setIsBroadcasting(streamId);
    const svc = new TelegramBotService(data.settings.token);
    let success = 0;
    let failed = 0;

    const targetChannels = data.channels.filter(c => channelIds.includes(c.id) && c.isActive);

    for (const ch of targetChannels) {
      const text = svc.formatScheduleMessage(stream, streamPageUrl);
      const keyboard = [[{ text: '🔔 Set Reminder', url: streamPageUrl }]];
      const res = await svc.sendMessage(ch.chatId, text, { inlineKeyboard: keyboard });
      if (res.ok) success++; else failed++;
    }

    setIsBroadcasting(null);
    return { success, failed };
  }, [data.settings.token, data.streams, data.channels, persist]);

  return {
    settings: data.settings,
    channels: data.channels,
    streams: data.streams,
    isVerifying,
    isBroadcasting,
    updateSettings,
    verifyToken,
    addChannel,
    removeChannel,
    toggleChannel,
    addStream,
    updateStream,
    deleteStream,
    broadcastGoLive,
    broadcastStreamEnd,
    broadcastSchedule,
  };
}
