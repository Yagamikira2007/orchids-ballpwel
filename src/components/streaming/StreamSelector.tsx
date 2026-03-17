import { useState } from 'react';
import { Author } from '@/types';
import { Play, Radio, ExternalLink, Check, Globe, Zap, Tv, Signal, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import StreamQualityBadge from './StreamQualityBadge';

interface StreamSelectorProps {
  streams: Author[];
  selectedStream: Author | null;
  onSelectStream: (stream: Author) => void;
  isLive?: boolean;
}

const StreamSelector = ({ streams, selectedStream, onSelectStream, isLive = true }: StreamSelectorProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isLive) {
    return (
      <div className="text-center py-10 bg-card rounded-xl border border-border">
        <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-muted-foreground">{t('streamsUnavailableTitle')}</h3>
        <p className="text-xs text-muted-foreground/60 mt-1">{t('streamsUnavailableDesc')}</p>
      </div>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <div className="text-center py-10 bg-card rounded-xl border border-border">
        <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-sm font-semibold">{t('noStreams')}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t('noStreamsDesc')}</p>
      </div>
    );
  }

  const getStreamType = (url: string) => {
    if (url?.includes('.m3u8')) return { label: 'HLS', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (url?.includes('embed')) return { label: 'Embed', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { label: 'Web', icon: ExternalLink, color: 'text-amber-400', bg: 'bg-amber-500/10' };
  };

  const estimateQuality = (stream: Author): 'HD' | 'SD' | 'LOW' => {
    const name = stream.name?.toLowerCase() || '';
    const url = stream.url?.toLowerCase() || '';
    if (name.includes('hd') || name.includes('1080') || name.includes('720') || url.includes('hd')) return 'HD';
    if (name.includes('low') || name.includes('240')) return 'LOW';
    return 'SD';
  };

  const selectedIndex = selectedStream ? streams.indexOf(selectedStream) : -1;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Signal className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold leading-none">{t('availableStreams')}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {streams.length} {streams.length > 1 ? t('sources') : t('source')}
              {selectedStream && (
                <span className="text-primary ml-1">• {selectedStream.name} {t('active')}</span>
              )}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Stream List */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="border-t border-border">
          {streams.map((stream, index) => {
            const isSelected = selectedStream === stream;
            const streamType = getStreamType(stream.url);
            const StreamIcon = streamType.icon;
            const quality = estimateQuality(stream);

            return (
              <button
                key={index}
                onClick={() => onSelectStream(stream)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 relative ${
                  isSelected
                    ? 'bg-primary/10'
                    : 'hover:bg-secondary/40'
                } ${index !== streams.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
                )}

                {/* Stream number / logo */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'bg-secondary/60 text-muted-foreground'
                }`}>
                  {stream.logo ? (
                    <img
                      src={stream.logo}
                      alt={stream.name}
                      className="w-7 h-7 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {stream.name || `Stream ${index + 1}`}
                    </p>
                    {isSelected && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-bold text-primary uppercase">{t('active')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StreamQualityBadge quality={quality} showIcon={false} />
                    <span className={`inline-flex items-center gap-0.5 text-[10px] ${streamType.color} ${streamType.bg} px-1.5 py-0.5 rounded font-medium`}>
                      <StreamIcon className="w-2.5 h-2.5" />
                      {streamType.label}
                    </span>
                    {stream.url && (
                      <span className="text-[10px] text-muted-foreground/50 truncate max-w-[100px]">
                        {(() => { try { return new URL(stream.url).hostname; } catch { return ''; } })()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center group-hover:border-primary/40">
                      <Play className="w-3 h-3 text-muted-foreground ml-0.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick actions for selected stream */}
        {selectedStream && (
          <div className="border-t border-border px-4 py-2.5 bg-secondary/20 flex items-center gap-2">
            <button
              onClick={() => window.open(selectedStream.url, '_blank', 'noopener,noreferrer')}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('openInNewTab')}
            </button>
            <div className="w-px h-5 bg-border" />
            <button
              onClick={() => onSelectStream(selectedStream)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 py-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {t('playEmbedded')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamSelector;
