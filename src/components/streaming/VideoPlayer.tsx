import { useState } from 'react';
import { Play, ExternalLink, AlertTriangle, Tv, Signal, Wifi, ShieldAlert, Check, Zap, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Author } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { isValidStreamUrl } from '@/lib/urlValidation';
import HLSPlayer from './HLSPlayer';
import PlayerTicker from './PlayerTicker';
import StreamQualityBadge from './StreamQualityBadge';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  stream: Author | null;
  matchTitle?: string;
  isLive?: boolean;
  streams?: Author[];
  onSelectStream?: (stream: Author) => void;
}

const VideoPlayer = ({ stream, matchTitle, isLive = true, streams = [], onSelectStream }: VideoPlayerProps) => {
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [useEmbedded, setUseEmbedded] = useState(true);
  const [showStreamList, setShowStreamList] = useState(false);
  const { t } = useLanguage();
  const { settings } = useAppSettings();

  const getStreamType = (url: string) => {
    if (url?.includes('.m3u8')) return { label: 'HLS', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (url?.includes('embed')) return { label: 'Embed', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { label: 'Web', icon: ExternalLink, color: 'text-amber-400', bg: 'bg-amber-500/10' };
  };

  const estimateQuality = (s: Author): 'HD' | 'SD' | 'LOW' => {
    const name = s.name?.toLowerCase() || '';
    const url = s.url?.toLowerCase() || '';
    if (name.includes('hd') || name.includes('1080') || name.includes('720') || url.includes('hd')) return 'HD';
    if (name.includes('low') || name.includes('240')) return 'LOW';
    return 'SD';
  };

  const handleSelectStream = (s: Author) => {
    onSelectStream?.(s);
    setShowStreamList(false);
    setPlayerError(null);
    setUseEmbedded(true);
  };

  // Inline stream switcher bar
  const InlineStreamSwitcher = () => {
    if (!streams || streams.length === 0 || !onSelectStream) return null;

    return (
      <div className="bg-card/95 backdrop-blur-sm border-t border-border">
        {/* Current stream bar + toggle */}
        <button
          onClick={() => setShowStreamList(!showStreamList)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold">
              {stream ? stream.name : t('selectStream')}
            </span>
            {stream && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">
                ● {t('active')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">
              {streams.length} {streams.length > 1 ? t('sources') : t('source')}
            </span>
            {showStreamList ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expandable stream list */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showStreamList ? 'max-h-[300px]' : 'max-h-0'}`}>
          <div className="border-t border-border/50 max-h-[280px] overflow-y-auto">
            {streams.map((s, index) => {
              const isSelected = stream === s;
              const streamType = getStreamType(s.url);
              const StreamIcon = streamType.icon;
              const quality = estimateQuality(s);

              return (
                <button
                  key={index}
                  onClick={() => handleSelectStream(s)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all relative ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-secondary/40'
                  } ${index !== streams.length - 1 ? 'border-b border-border/30' : ''}`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-primary" />
                  )}

                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground'
                  }`}>
                    {s.logo ? (
                      <img src={s.logo} alt={s.name} className="w-5 h-5 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs font-semibold truncate ${isSelected ? 'text-primary' : ''}`}>
                      {s.name || `Stream ${index + 1}`}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StreamQualityBadge quality={quality} showIcon={false} />
                      <span className={`inline-flex items-center gap-0.5 text-[9px] ${streamType.color} ${streamType.bg} px-1 py-0.5 rounded font-medium`}>
                        <StreamIcon className="w-2 h-2" />
                        {streamType.label}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center flex-shrink-0">
                      <Play className="w-2.5 h-2.5 text-muted-foreground ml-px" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Show unavailable state when match is not live
  if (!isLive) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-card via-card to-secondary/30 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-muted-foreground/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-muted-foreground/10 rounded-full blur-3xl" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="w-24 h-24 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-6">
              <Tv className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-muted-foreground">{t('streamsUnavailableTitle')}</h3>
            <p className="text-muted-foreground/70 text-sm text-center max-w-xs">{t('streamsUnavailableDesc')}</p>
          </div>
        </div>
        <InlineStreamSwitcher />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-card via-card to-secondary/30 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                {settings.streamDialogLogoUrl ? (
                  <img src={settings.streamDialogLogoUrl} alt="Stream Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <Tv className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center animate-ping">
                <Signal className="w-3 h-3 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">{t('selectStream')}</h3>
            <p className="text-muted-foreground text-sm text-center max-w-xs">{t('selectStreamDesc')}</p>
          </div>
        </div>
        <InlineStreamSwitcher />
      </div>
    );
  }

  // Validate stream URL before rendering
  if (!isValidStreamUrl(stream.url)) {
    return (
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-destructive/10 via-card to-secondary/30 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground">Invalid Stream URL</h3>
            <p className="text-muted-foreground text-sm text-center max-w-xs">
              This stream URL could not be validated. Please select a different stream.
            </p>
          </div>
        </div>
        <InlineStreamSwitcher />
      </div>
    );
  }

  const isHLSStream = stream.url?.includes('.m3u8');
  const isEmbeddable = stream.url?.includes('embed') || isHLSStream;

  const handlePlayerError = (error: string) => {
    setPlayerError(error);
    console.error('Player error:', error);
  };

  const handleExternalClick = () => {
    if (isValidStreamUrl(stream.url)) {
      window.open(stream.url, '_blank', 'noopener,noreferrer');
    }
  };

  // If HLS stream and embedded mode is enabled
  if (isHLSStream && useEmbedded && !playerError) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/5">
          <HLSPlayer
            src={stream.url}
            title={matchTitle || `${stream.name} Stream`}
            onError={handlePlayerError}
            streams={streams}
            selectedStream={stream}
            onSelectStream={onSelectStream}
          />
          <PlayerTicker />
        </div>
        <StreamInfo stream={stream} onExternalClick={handleExternalClick} />
      </div>
    );
  }

  // If it's an embeddable stream (iframe)
  if (isEmbeddable && useEmbedded && !playerError) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/5">
          <div className="aspect-video bg-black relative">
            <iframe
              src={stream.url}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`${stream.name} Stream`}
              sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
              referrerPolicy="no-referrer"
            />
          </div>
          <InlineStreamSwitcher />
        </div>
        <StreamInfo stream={stream} onExternalClick={handleExternalClick} />
      </div>
    );
  }

  // Fallback: External link with preview
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-card via-card to-secondary/30 relative group">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-destructive/20 rounded-full blur-3xl" />
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            {playerError && (
              <div className="flex items-center gap-2 text-yellow-500 mb-6 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">{t('embeddedUnavailable')}</span>
              </div>
            )}
            
            <button
              onClick={handleExternalClick}
              className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform duration-300"
            >
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-xl flex items-center justify-center border border-primary/30 group-hover:border-primary/50 transition-all shadow-lg shadow-primary/20">
                  <Play className="w-12 h-12 text-primary fill-primary ml-1" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
                  <Wifi className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{t('watchOn')} {stream.name}</p>
                <p className="text-muted-foreground text-sm">{t('clickToOpen')}</p>
              </div>
            </button>

            {playerError && (
              <Button
                variant="outline"
                className="mt-6 gap-2"
                onClick={() => {
                  setPlayerError(null);
                  setUseEmbedded(true);
                }}
              >
                {t('tryEmbeddedAgain')}
              </Button>
            )}
          </div>
        </div>
        <InlineStreamSwitcher />
      </div>

      <StreamInfo stream={stream} onExternalClick={handleExternalClick} />
    </div>
  );
};

interface StreamInfoProps {
  stream: Author;
  onExternalClick: () => void;
}

const StreamInfo = ({ stream, onExternalClick }: StreamInfoProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-card to-card/80 rounded-xl border border-border backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center overflow-hidden border border-primary/20">
            {stream.logo ? (
              <img src={stream.logo} alt={stream.name} className="w-9 h-9 object-contain" />
            ) : (
              <Play className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-live flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <div>
          <p className="font-semibold">{stream.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t('currentlyStreaming')}
          </p>
        </div>
      </div>
      
      <Button variant="outline" size="sm" onClick={onExternalClick} className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all">
        <ExternalLink className="w-4 h-4" />
        <span className="hidden sm:inline">{t('openExternal')}</span>
      </Button>
    </div>
  );
};

export default VideoPlayer;
