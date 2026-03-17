import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useTelegramBot } from '@/hooks/useTelegramBot';
import {
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Users,
  Hash,
  MessageSquare,
  Save,
  Key,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
} from 'lucide-react';

const TelegramBotManager: React.FC = () => {
  const {
    settings,
    channels,
    isVerifying,
    updateSettings,
    verifyToken,
    addChannel,
    removeChannel,
    toggleChannel,
  } = useTelegramBot();

  const [tokenInput, setTokenInput] = useState(settings.token);
  const [newChatId, setNewChatId] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isSavingMessages, setIsSavingMessages] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState(settings.welcomeMessage);
  const [startMsg, setStartMsg] = useState(settings.streamStartMessage);
  const [endMsg, setEndMsg] = useState(settings.streamEndMessage);

  const handleVerifyToken = async () => {
    if (!tokenInput.trim()) {
      toast({ title: 'Error', description: 'Please enter a bot token', variant: 'destructive' });
      return;
    }
    const result = await verifyToken(tokenInput.trim());
    if (result.ok) {
      toast({
        title: 'Bot Connected!',
        description: `@${result.username} is now active`,
      });
    } else {
      toast({
        title: 'Invalid Token',
        description: 'Could not verify the bot token. Check BotFather.',
        variant: 'destructive',
      });
    }
  };

  const handleAddChannel = async () => {
    const id = newChatId.trim();
    if (!id) return;
    setIsAddingChannel(true);
    const result = await addChannel(id);
    setIsAddingChannel(false);
    if (result.ok && result.channel) {
      setNewChatId('');
      toast({ title: 'Channel Added', description: `${result.channel.name} added successfully` });
    } else {
      toast({ title: 'Failed', description: result.error || 'Could not add channel', variant: 'destructive' });
    }
  };

  const handleSaveMessages = () => {
    setIsSavingMessages(true);
    updateSettings({ welcomeMessage: welcomeMsg, streamStartMessage: startMsg, streamEndMessage: endMsg });
    setTimeout(() => {
      setIsSavingMessages(false);
      toast({ title: 'Saved', description: 'Message templates updated' });
    }, 500);
  };

  const channelTypeIcon = (type: string) => {
    if (type === 'channel') return <Hash className="w-3.5 h-3.5" />;
    if (type === 'supergroup') return <Users className="w-3.5 h-3.5" />;
    return <MessageSquare className="w-3.5 h-3.5" />;
  };

  const channelTypeColor = (type: string) => {
    if (type === 'channel') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (type === 'supergroup') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-green-500/10 text-green-400 border-green-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Bot Token Configuration */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Bot Token
                {settings.isEnabled && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Get your bot token from @BotFather on Telegram</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.isEnabled && settings.username && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="p-2 rounded-full bg-green-500/20">
                <Bot className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-400">@{settings.username}</p>
                <p className="text-xs text-muted-foreground">Bot is active and ready</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Enable</Label>
                <Switch
                  checked={settings.isEnabled}
                  onCheckedChange={(v) => updateSettings({ isEnabled: v })}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              type="password"
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={handleVerifyToken} disabled={isVerifying} className="gap-2 shrink-0">
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {settings.isEnabled ? 'Re-verify' : 'Connect Bot'}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Steps to set up your bot:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-1">
                <li>Message <span className="text-amber-400 font-medium">@BotFather</span> on Telegram</li>
                <li>Use <span className="font-mono text-amber-400">/newbot</span> to create a bot</li>
                <li>Copy the token and paste it above</li>
                <li>Add the bot as <span className="text-amber-400 font-medium">admin</span> to your channels</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channels & Groups */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Hash className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Channels & Groups</CardTitle>
              <CardDescription>Add Telegram channels or groups to broadcast streams</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add channel form */}
          <div className="flex gap-2">
            <Input
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="@channelname or -1001234567890"
              className="flex-1 font-mono text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
              disabled={!settings.isEnabled}
            />
            <Button
              onClick={handleAddChannel}
              disabled={isAddingChannel || !settings.isEnabled || !newChatId.trim()}
              className="gap-2 shrink-0"
            >
              {isAddingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </Button>
          </div>

          {!settings.isEnabled && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Connect your bot token first to add channels
            </p>
          )}

          {/* Channels list */}
          {channels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No channels added yet</p>
              <p className="text-xs">Add a channel username or chat ID above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    ch.isActive
                      ? 'bg-background/50 border-border/50'
                      : 'bg-muted/20 border-border/30 opacity-60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-muted/50">
                    {channelTypeIcon(ch.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{ch.name}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${channelTypeColor(ch.type)}`}>
                        {channelTypeIcon(ch.type)}
                        {ch.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {ch.username && (
                        <span className="text-xs text-muted-foreground font-mono">@{ch.username}</span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">{ch.chatId}</span>
                      {ch.memberCount !== undefined && ch.memberCount > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {ch.memberCount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={ch.isActive}
                      onCheckedChange={() => toggleChannel(ch.id)}
                      className="scale-90"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        removeChannel(ch.id);
                        toast({ title: 'Channel removed', description: ch.name });
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Message Templates</CardTitle>
              <CardDescription>Customize the messages sent to your channels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Welcome Message</Label>
            <Textarea
              value={welcomeMsg}
              onChange={(e) => setWelcomeMsg(e.target.value)}
              placeholder="Welcome message for new subscribers..."
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Stream Start Message</Label>
            <Textarea
              value={startMsg}
              onChange={(e) => setStartMsg(e.target.value)}
              placeholder="🔴 LIVE: {homeTeam} vs {awayTeam}"
              rows={2}
              className="text-sm font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Variables: <code className="bg-muted px-1 rounded">{'{homeTeam}'}</code>{' '}
              <code className="bg-muted px-1 rounded">{'{awayTeam}'}</code>{' '}
              <code className="bg-muted px-1 rounded">{'{competition}'}</code>
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Stream End Message</Label>
            <Textarea
              value={endMsg}
              onChange={(e) => setEndMsg(e.target.value)}
              placeholder="✅ Match ended: {homeTeam} vs {awayTeam}"
              rows={2}
              className="text-sm font-mono"
            />
          </div>

          <Button onClick={handleSaveMessages} disabled={isSavingMessages} className="gap-2">
            {isSavingMessages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Templates
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramBotManager;
