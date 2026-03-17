import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useTelegramBot } from '@/hooks/useTelegramBot';
import { useBotApi, StreamStatus } from '@/hooks/useBotApi';
import {
  Radio,
  Plus,
  Trash2,
  Square,
  Loader2,
  Link,
  Trophy,
  Clock,
  CheckCircle2,
  X,
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Server,
  MonitorPlay,
  Tv2,
  AlertTriangle,
  Bell,
  Pin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StreamFormData {
  homeTeam:    string;
  awayTeam:    string;
  competition: string;
  source:      string;   // RTMP / HLS / YouTube URL
  startTime:   string;
}

const defaultForm: StreamFormData = {
  homeTeam:    '',
  awayTeam:    '',
  competition: '',
  source:      '',
  startTime:   new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
};

/* ── helpers ──────────────────────────────────────────────────────────────── */
function StatePill({ state }: { state: StreamStatus['state'] }) {
  const cfg: Record<StreamStatus['state'], { label: string; cls: string }> = {
    idle:     { label: 'Idle',     cls: 'bg-muted text-muted-foreground border-border/50' },
    starting: { label: 'Starting', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    live:     { label: '🔴 LIVE',  cls: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' },
    stopping: { label: 'Stopping', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    error:    { label: 'Error',    cls: 'bg-destructive/20 text-destructive border-destructive/30' },
  };
  const c = cfg[state];
  return <Badge className={`text-xs ${c.cls}`}>{c.label}</Badge>;
}

function formatUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}h ${m}m`
    : m > 0
    ? `${m}m ${s}s`
    : `${s}s`;
}

/* ══════════════════════════════════════════════════════════════════════════ */

const LiveStreamBroadcast: React.FC = () => {
  const { settings, channels } = useTelegramBot();
  const {
    status: botStatus,
    isLoading,
    apiError,
    connected,
    fetchStatus,
    startStream,
    stopStream,
    BOT_API_URL,
  } = useBotApi();

  const [showForm,          setShowForm]          = useState(false);
  const [form,              setForm]              = useState<StreamFormData>(defaultForm);
  const [selectedChannels,  setSelectedChannels]  = useState<string[]>([]);
  const [sendAnnounce,      setSendAnnounce]      = useState(true);
  const [endScoreMap,       setEndScoreMap]       = useState<Record<string, string>>({});
  const [endingId,          setEndingId]          = useState<string | null>(null);
  const [expandedSource,    setExpandedSource]    = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeChannels = channels.filter((c) => c.isActive);

  // ── Auto-ping bot API every 5 s while connected ────────────────────────
  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  // ── Derived state ──────────────────────────────────────────────────────
  const liveChannelIds: string[] = botStatus
    ? Object.entries(botStatus.streams)
        .filter(([, s]) => s.state === 'live' || s.state === 'starting')
        .map(([id]) => id)
    : [];

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const handleStart = async () => {
    if (!form.homeTeam || !form.awayTeam || !form.source) {
      toast({ title: 'Missing fields', description: 'Home team, away team and source URL are required.', variant: 'destructive' });
      return;
    }
    if (selectedChannels.length === 0) {
      toast({ title: 'No channels', description: 'Select at least one channel to stream to.', variant: 'destructive' });
      return;
    }

    const result = await startStream({
      chat_ids:    selectedChannels,
      source:      form.source,
      match_name:  `${form.homeTeam} vs ${form.awayTeam}`,
      competition: form.competition,
      announce:    sendAnnounce,
    });

    if (result.ok) {
      const ok  = result.results.filter((r) => r.ok).length;
      const bad = result.results.filter((r) => !r.ok);
      toast({
        title:       '🔴 Stream Started!',
        description: `Live on ${ok} channel(s)${bad.length ? ` · ${bad.length} failed` : ''}`,
      });
      setShowForm(false);
      setForm(defaultForm);
      setSelectedChannels([]);
      fetchStatus();
    } else {
      toast({
        title:       'Failed to start stream',
        description: result.error || result.results.find((r) => r.error)?.error || 'Unknown error',
        variant:     'destructive',
      });
    }
  };

  const handleStop = async (chatId: string) => {
    const score = endScoreMap[chatId] || '';
    const ok    = await stopStream({ chat_ids: [chatId], final_score: score, announce: sendAnnounce });
    setEndingId(null);
    if (ok) {
      toast({ title: '⏹ Stream Ended', description: score ? `Final: ${score}` : undefined });
      fetchStatus();
    } else {
      toast({ title: 'Stop failed', variant: 'destructive' });
    }
  };

  const toggleChannel = (id: string) =>
    setSelectedChannels((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  /* ── Connection status banner ────────────────────────────────────────── */

  const connectionBanner = () => {
    if (connected === null) return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        Connecting to bot service at <code className="font-mono text-xs bg-muted px-1 rounded">{BOT_API_URL}</code>…
      </div>
    );

    if (!connected) return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
        <WifiOff className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-destructive">Bot service not reachable</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Start the Python bot: <code className="bg-muted px-1 rounded font-mono">cd bot && python main.py</code>
            <br />Expected at: <code className="font-mono text-xs">{BOT_API_URL}</code>
          </p>
          {apiError && <p className="text-xs text-destructive/70 mt-1 font-mono">{apiError}</p>}
        </div>
        <Button size="sm" variant="outline" onClick={fetchStatus} className="shrink-0 gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm">
        <Wifi className="w-4 h-4 text-green-400 shrink-0" />
        <div className="flex-1">
          <span className="font-medium text-green-400">Bot service connected</span>
          <span className="text-muted-foreground ml-2">
            · {botStatus?.active_streams ?? 0} active stream{botStatus?.active_streams !== 1 ? 's' : ''}
            {botStatus?.bot_ready  ? '' : ' · ⚠ Bot client not ready'}
            {botStatus?.user_ready ? '' : ' · ⚠ User client not ready'}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchStatus} disabled={isLoading} className="shrink-0 h-7 w-7 p-0">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  };

  /* ── Active streams ───────────────────────────────────────────────────── */

  const activeStreamCards = () => {
    if (!botStatus || Object.keys(botStatus.streams).length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Active Streams
        </h4>
        {Object.entries(botStatus.streams).map(([chatId, s]) => {
          const ch    = channels.find((c) => c.chatId === chatId);
          const isEnd = endingId === chatId;

          return (
            <Card key={chatId} className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{s.match_name}</span>
                      <StatePill state={s.state} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ch?.name ?? chatId}
                      {s.competition ? ` · ${s.competition}` : ''}
                      {s.uptime_sec ? ` · ⏱ ${formatUptime(s.uptime_sec)}` : ''}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground/60 mt-0.5 truncate">{s.source}</p>
                  </div>
                </div>

                {/* End stream section */}
                {isEnd ? (
                  <div className="flex gap-2">
                    <Input
                      value={endScoreMap[chatId] || ''}
                      onChange={(e) => setEndScoreMap((p) => ({ ...p, [chatId]: e.target.value }))}
                      placeholder="Final score (optional)"
                      className="text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleStop(chatId)}
                      disabled={isLoading}
                      className="gap-1.5 bg-destructive hover:bg-destructive/90 shrink-0"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                      End
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEndingId(null)} className="shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEndingId(chatId)}
                    className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Square className="w-3.5 h-3.5" />
                    End Stream
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  /* ── Source URL hints ───────────────────────────────────────────────────── */

  const sourceExamples = [
    { label: 'RTMP (OBS)',     hint: 'rtmp://live.example.com/live/stream_key', icon: <MonitorPlay className="w-3.5 h-3.5" /> },
    { label: 'HLS / M3U8',    hint: 'https://example.com/stream/index.m3u8',   icon: <Tv2 className="w-3.5 h-3.5" /> },
    { label: 'YouTube Live',  hint: 'https://www.youtube.com/watch?v=VIDEO_ID',icon: <Play className="w-3.5 h-3.5" /> },
    { label: 'Direct MP4',    hint: 'https://example.com/video.mp4',           icon: <Link className="w-3.5 h-3.5" /> },
  ];

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Tv2 className="w-4 h-4 text-primary" />
            Telegram Live Streams
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stream video <strong>directly on your Telegram channel</strong> — viewers watch inside Telegram
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          disabled={!connected}
          className="gap-2"
          size="sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Stream'}
        </Button>
      </div>

      {/* Connection banner */}
      {connectionBanner()}

      {/* How it works card */}
      {connected && !showForm && Object.keys(botStatus?.streams ?? {}).length === 0 && (
        <Card className="border-border/30 bg-muted/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { n: '1', title: 'Choose channels',   desc: 'Select which Telegram channels to go live on' },
                { n: '2', title: 'Set stream source', desc: 'RTMP from OBS, HLS URL, YouTube, or direct video' },
                { n: '3', title: 'Go Live!',          desc: 'Bot starts a Telegram Live Stream — viewers watch inside Telegram' },
              ].map((s) => (
                <div key={s.n} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active streams */}
      {activeStreamCards()}

      {/* New stream form */}
      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Start New Live Stream on Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Match info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Home Team *</Label>
                <Input
                  value={form.homeTeam}
                  onChange={(e) => setForm((p) => ({ ...p, homeTeam: e.target.value }))}
                  placeholder="e.g. Man United"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Away Team *</Label>
                <Input
                  value={form.awayTeam}
                  onChange={(e) => setForm((p) => ({ ...p, awayTeam: e.target.value }))}
                  placeholder="e.g. Liverpool"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Competition
                </Label>
                <Input
                  value={form.competition}
                  onChange={(e) => setForm((p) => ({ ...p, competition: e.target.value }))}
                  placeholder="e.g. Premier League"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Match Time
                </Label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Source URL */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Server className="w-3 h-3" /> Stream Source *
              </Label>
              <Input
                value={form.source}
                onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                placeholder="rtmp://… or https://…/stream.m3u8 or YouTube URL"
                className="font-mono text-sm"
              />
              {/* Source examples */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sourceExamples.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, source: ex.hint }))}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {ex.icon}
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel selector */}
            <div className="space-y-2">
              <Label className="text-xs">Broadcast to channels *</Label>
              {activeChannels.length === 0 ? (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  No active channels — add them in Bot Settings
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeChannels.map((ch) => (
                    <label
                      key={ch.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs cursor-pointer transition-all select-none ${
                        selectedChannels.includes(ch.chatId)
                          ? 'bg-primary/20 border-primary/40 text-primary'
                          : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <Checkbox
                        checked={selectedChannels.includes(ch.chatId)}
                        onCheckedChange={() => toggleChannel(ch.chatId)}
                        className="w-3 h-3"
                      />
                      {ch.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Switch checked={sendAnnounce} onCheckedChange={setSendAnnounce} className="scale-75" />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Send 🔴 LIVE announcement message
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleStart}
                disabled={isLoading || !connected}
                className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                Go Live on Telegram
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(defaultForm); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {connected && !showForm && Object.keys(botStatus?.streams ?? {}).length === 0 && (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Tv2 className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-medium">No active streams</p>
            <p className="text-sm text-center max-w-xs">
              Click <strong>New Stream</strong> to start broadcasting live football directly on your Telegram channels
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveStreamBroadcast;
