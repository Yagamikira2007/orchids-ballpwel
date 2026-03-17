import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTelegramBot } from '@/hooks/useTelegramBot';
import {
  Bot,
  Hash,
  Radio,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Activity,
  Clock,
  Trophy,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react';

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <Card className="border-border/50 bg-card/50">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <div className="text-right">
          <p className="text-2xl font-bold leading-none">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3">{label}</p>
    </CardContent>
  </Card>
);

const TelegramBotDashboard: React.FC = () => {
  const { settings, channels, streams } = useTelegramBot();

  const activeChannels = channels.filter((c) => c.isActive);
  const totalMembers = channels.reduce((sum, c) => sum + (c.memberCount || 0), 0);
  const liveStreams = streams.filter((s) => s.status === 'live');
  const scheduledStreams = streams.filter((s) => s.status === 'scheduled');
  const endedStreams = streams.filter((s) => s.status === 'ended');

  const recentStreams = [...streams]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Bot status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        settings.isEnabled
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-muted/30 border-border/50'
      }`}>
        <div className={`p-2 rounded-full ${settings.isEnabled ? 'bg-green-500/20' : 'bg-muted'}`}>
          <Bot className={`w-5 h-5 ${settings.isEnabled ? 'text-green-400' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">
              {settings.isEnabled ? `@${settings.username}` : 'Bot Not Connected'}
            </p>
            {settings.isEnabled ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
                <Wifi className="w-3 h-3" /> Online
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1">
                <WifiOff className="w-3 h-3" /> Offline
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {settings.isEnabled
              ? `Broadcasting to ${activeChannels.length} active channel${activeChannels.length !== 1 ? 's' : ''}`
              : 'Configure your bot token in Bot Settings'}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Hash className="w-4 h-4 text-blue-400" />}
          label="Active Channels"
          value={activeChannels.length}
          sub={`${channels.length} total`}
          color="bg-blue-500/10"
        />
        <StatCard
          icon={<Users className="w-4 h-4 text-purple-400" />}
          label="Total Members"
          value={totalMembers >= 1000 ? `${(totalMembers / 1000).toFixed(1)}K` : totalMembers}
          sub="across all channels"
          color="bg-purple-500/10"
        />
        <StatCard
          icon={<Radio className="w-4 h-4 text-red-400" />}
          label="Live Streams"
          value={liveStreams.length}
          sub={`${scheduledStreams.length} scheduled`}
          color="bg-red-500/10"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
          label="Streams Broadcast"
          value={endedStreams.length + liveStreams.length}
          sub="total completed"
          color="bg-green-500/10"
        />
      </div>

      {/* Live streams alert */}
      {liveStreams.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-sm text-red-400">Currently Live</span>
            </div>
            <div className="space-y-2">
              {liveStreams.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.homeTeam} vs {s.awayTeam}</p>
                    {s.competition && <p className="text-xs text-muted-foreground">{s.competition}</p>}
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs animate-pulse">
                    🔴 LIVE
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels overview */}
      {channels.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Channels Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ch.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ch.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{ch.chatId}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ch.memberCount !== undefined && ch.memberCount > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ch.memberCount >= 1000 ? `${(ch.memberCount / 1000).toFixed(1)}K` : ch.memberCount}
                      </span>
                    )}
                    <Badge variant={ch.isActive ? 'default' : 'secondary'} className="text-xs">
                      {ch.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent streams */}
      {recentStreams.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentStreams.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    s.status === 'live' ? 'bg-red-500 animate-pulse' :
                    s.status === 'scheduled' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.homeTeam} vs {s.awayTeam}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.competition && `${s.competition} · `}
                      {new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs shrink-0 ${
                      s.status === 'live' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      s.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}
                  >
                    {s.status === 'live' ? '🔴 Live' : s.status === 'scheduled' ? '📅 Scheduled' : '✅ Ended'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {streams.length === 0 && channels.length === 0 && (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bot className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-semibold">Get Started</p>
            <p className="text-sm text-center max-w-xs mt-1">
              Set up your Telegram bot, add channels, and start broadcasting football live streams
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TelegramBotDashboard;
