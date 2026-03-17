/**
 * useBotApi — communicates with the Python FastAPI bot service.
 *
 * Bot API URL is read from VITE_BOT_API_URL (default: http://localhost:8000)
 * API Secret  from VITE_BOT_API_SECRET
 */

import { useState, useCallback } from 'react';

const BOT_API_URL    = (import.meta.env.VITE_BOT_API_URL    || 'http://localhost:8000').replace(/\/$/, '');
const BOT_API_SECRET = import.meta.env.VITE_BOT_API_SECRET  || '';

export interface StreamStatus {
  chat_id:    number;
  match_name: string;
  competition: string;
  source:     string;
  state:      'idle' | 'starting' | 'live' | 'stopping' | 'error';
  error?:     string;
  started_at?: number;
  uptime_sec?: number;
}

export interface BotApiStatus {
  ok:             boolean;
  bot_ready:      boolean;
  user_ready:     boolean;
  active_streams: number;
  streams:        Record<string, StreamStatus>;
}

export interface StartStreamPayload {
  chat_ids:    string[];
  source:      string;
  match_name:  string;
  competition: string;
  announce:    boolean;
}

export interface StopStreamPayload {
  chat_ids:    string[];
  final_score?: string;
  announce:    boolean;
}

export interface StartResult {
  chat_id:              string;
  ok:                   boolean;
  error:                string | null;
  announcement_msg_id?: number;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BOT_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type':  'application/json',
      'x-api-secret':  BOT_API_SECRET,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function useBotApi() {
  const [status,      setStatus]      = useState<BotApiStatus | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [connected,   setConnected]   = useState<boolean | null>(null);

  // ── Ping / status ────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async (): Promise<BotApiStatus | null> => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch<BotApiStatus>('/status');
      setStatus(data);
      setConnected(data.ok);
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setApiError(msg);
      setConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Start live stream ────────────────────────────────────────────────────
  const startStream = useCallback(async (payload: StartStreamPayload): Promise<{
    ok: boolean;
    results: StartResult[];
    error?: string;
  }> => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch<{ ok: boolean; results: StartResult[]; success_count: number }>('/stream/start', {
        method: 'POST',
        body:   JSON.stringify(payload),
      });
      return { ok: data.ok, results: data.results };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setApiError(msg);
      return { ok: false, results: [], error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Stop live stream ─────────────────────────────────────────────────────
  const stopStream = useCallback(async (payload: StopStreamPayload): Promise<boolean> => {
    setIsLoading(true);
    setApiError(null);
    try {
      await apiFetch('/stream/stop', {
        method: 'POST',
        body:   JSON.stringify(payload),
      });
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setApiError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Channel info ─────────────────────────────────────────────────────────
  const getChannelInfo = useCallback(async (chatId: string) => {
    try {
      return await apiFetch<{ ok: boolean; id: number; title: string; username?: string; type: string; members: number }>(
        '/channels/info',
        { method: 'POST', body: JSON.stringify({ chat_id: chatId }) }
      );
    } catch {
      return null;
    }
  }, []);

  // ── Single stream status ─────────────────────────────────────────────────
  const getStreamStatus = useCallback(async (chatId: string): Promise<StreamStatus | null> => {
    try {
      const data = await apiFetch<StreamStatus & { ok: boolean }>(`/stream/${chatId}`);
      return data;
    } catch {
      return null;
    }
  }, []);

  return {
    status,
    isLoading,
    apiError,
    connected,
    fetchStatus,
    startStream,
    stopStream,
    getChannelInfo,
    getStreamStatus,
    BOT_API_URL,
  };
}
