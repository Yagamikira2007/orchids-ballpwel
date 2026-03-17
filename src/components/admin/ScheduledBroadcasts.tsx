import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useTelegramBot } from '@/hooks/useTelegramBot';
import { LiveStream } from '@/services/telegramBot';
import {
  Calendar,
  Clock,
  Send,
  Loader2,
  Trophy,
  ChevronRight,
  Bell,
  Filter,
  Radio,
} from 'lucide-react';

const APP_URL = window.location.origin;

const ScheduledBroadcasts: React.FC = () => {
  const { settings, channels, streams, isBroadcasting, broadcastSchedule } = useTelegramBot();
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'live'>('scheduled');

  const activeChannels = channels.filter((c) => c.isActive);

  const allSelected = activeChannels.every((c) => selectedChannels.includes(c.id));

  const toggleSelectAll = () => {
    setSelectedChannels(allSelected ? [] : activeChannels.map((c) => c.id));
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAnnounce = async (streamId: string) => {
    if (!settings.isEnabled) {
      toast({ title: 'Bot not connected', variant: 'destructive' });
      return;
    }
    const chIds = selectedChannels.length ? selectedChannels : activeChannels.map((c) => c.id);
    if (!chIds.length) {
      toast({ title: 'No channels', description: 'Add channels in Bot Settings first.', variant: 'destructive' });
      return;
    }
    const stream = streams.find((s) => s.id === streamId);
    const streamUrl = `${APP_URL}/watch/${stream?.matchId}`;
    const result = await broadcastSchedule(streamId, streamUrl, chIds);
    toast({
      title: result.success > 0 ? 'Announcement Sent!' : 'Failed',
      description: `Sent to ${result.success}/${result.success + result.failed} channels`,
      variant: result.success > 0 ? 'default' : 'destructive',
    });
  };

  const filteredStreams = streams.filter((s) => {
    if (filterStatus === 'all') return s.status !== 'ended';
    return s.status === filterStatus;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Group by date
  const groupedByDate: Record<string, LiveStream[]> = {};
  filteredStreams.forEach((s) => {
    const date = new Date(s.startTime).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(s);
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Match Schedule & Announcements</h3>
        <p className="text-sm text-muted-foreground">Send upcoming match announcements to your channels</p>
      </div>

      {/* Channel multi-select */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="w-4 h-4" />
              Broadcast Channels
            </CardTitle>
            {activeChannels.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs h-7 px-2">
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeChannels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active channels. Add them in Bot Settings.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeChannels.map((ch) => (
                <label
                  key={ch.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs cursor-pointer transition-all select-none ${
                    selectedChannels.includes(ch.id)
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  <Checkbox
                    checked={selectedChannels.includes(ch.id)}
                    onCheckedChange={() => toggleChannel(ch.id)}
                    className="w-3 h-3"
                  />
                  {ch.name}
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 w-fit">
        {(['scheduled', 'live', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all capitalize ${
              filterStatus === f
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'live' ? '🔴 Live' : f === 'scheduled' ? '📅 Scheduled' : 'All Active'}
          </button>
        ))}
      </div>

      {/* Schedule list */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mb-3 opacity-20" />
            <p className="font-medium">No matches scheduled</p>
            <p className="text-sm">Create streams in the Live Streams tab</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dayStreams]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-sm">{date}</h4>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <div className="space-y-3">
                {dayStreams.map((stream) => (
                  <Card key={stream.id} className={`border-border/50 transition-all hover:border-border ${
                    stream.status === 'live' ? 'border-red-500/20 bg-red-500/5' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="text-center shrink-0 w-14">
                          <p className="text-lg font-bold leading-none">
                            {new Date(stream.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(stream.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).slice(-2)}
                          </p>
                        </div>

                        <div className="w-px h-10 bg-border/50" />

                        {/* Match info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">
                              {stream.homeTeam} <span className="text-muted-foreground font-normal text-xs">vs</span> {stream.awayTeam}
                            </p>
                            {stream.status === 'live' && (
                              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full animate-pulse">
                                🔴 LIVE
                              </span>
                            )}
                          </div>
                          {stream.competition && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Trophy className="w-3 h-3" />
                              {stream.competition}
                            </p>
                          )}
                        </div>

                        {/* Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnnounce(stream.id)}
                          disabled={isBroadcasting === stream.id || !settings.isEnabled}
                          className="gap-1.5 shrink-0"
                        >
                          {isBroadcasting === stream.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Announce</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledBroadcasts;
