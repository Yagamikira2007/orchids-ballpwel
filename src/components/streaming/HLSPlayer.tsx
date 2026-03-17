import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Volume1,
  Maximize, 
  Minimize,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw,
  Tv,
  Check,
  PictureInPicture2,
  SkipBack,
  SkipForward,
  Signal,
  Radio,
  Lock,
  Unlock,
  Sun,
  RectangleHorizontal,
} from 'lucide-react';
import { Author } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface HLSPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onError?: (error: string) => void;
  streams?: Author[];
  selectedStream?: Author | null;
  onSelectStream?: (stream: Author) => void;
}

interface QualityLevel {
  height: number;
  bitrate: number;
  index: number;
}

const HLSPlayer = ({ src, poster, title, onError, streams = [], selectedStream, onSelectStream }: HLSPlayerProps) => {
  const { settings } = useAppSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useLanguage();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [seekIndicator, setSeekIndicator] = useState<{ side: 'left' | 'right'; seconds: number } | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [aspectMode, setAspectMode] = useState<'contain' | 'cover' | '16:9' | '4:3'>('contain');
  const [showBrightness, setShowBrightness] = useState(false);


  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !src) return;

    setError(null);
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferHole: 0.5,
          // Retry settings
          fragLoadingMaxRetry: 6,
          fragLoadingMaxRetryTimeout: 16000,
          fragLoadingRetryDelay: 1000,
          manifestLoadingMaxRetry: 4,
          manifestLoadingMaxRetryTimeout: 16000,
          manifestLoadingRetryDelay: 1000,
          levelLoadingMaxRetry: 4,
          levelLoadingMaxRetryTimeout: 16000,
          levelLoadingRetryDelay: 1000,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setIsLoading(false);
          const levels = data.levels.map((level, index) => ({
            height: level.height,
            bitrate: level.bitrate,
            index,
          }));
          setQualityLevels(levels);

          // Auto-play after manifest parsed
          videoRef.current?.play().catch(() => {});
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          setCurrentQuality(data.level);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.warn('HLS error:', data.type, data.details, data.fatal);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError(t('networkError'));
                hls.destroy();
                onError?.('Network error');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError(t('mediaError'));
                hls.destroy();
                onError?.('Media error');
                break;
              default:
                setError(t('streamUnavailable'));
                hls.destroy();
                onError?.('Fatal streaming error');
                break;
            }
          }
        });

      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = src;
        setIsLoading(false);
      } else {
        setError(t('hlsNotSupported'));
        onError?.('HLS not supported');
      }
    } else {
      videoRef.current.src = src;
      setIsLoading(false);
    }
  }, [src, onError, t]);

  useEffect(() => {
    initializePlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [initializePlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Update buffered
      if (video.buffered.length > 0) {
        const buffEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedPercent(video.duration ? (buffEnd / video.duration) * 100 : 0);
      }
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError(t('failedToLoad'));
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [t]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isPlaying, volume]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowVolumeSlider(false);
      }
    }, 3000);
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const seekBy = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setSeekIndicator({ side: seconds > 0 ? 'right' : 'left', seconds: Math.abs(seconds) });
      setTimeout(() => setSeekIndicator(null), 600);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const setQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const jumpToLive = () => {
    if (videoRef.current && duration) {
      videoRef.current.currentTime = duration;
      setCurrentTime(duration);
      if (!isPlaying) videoRef.current.play();
    }
  };

  const cycleAspectMode = () => {
    const modes: Array<'contain' | 'cover' | '16:9' | '4:3'> = ['contain', 'cover', '16:9', '4:3'];
    const idx = modes.indexOf(aspectMode);
    setAspectMode(modes[(idx + 1) % modes.length]);
  };

  const getAspectLabel = () => {
    switch (aspectMode) {
      case 'contain': return 'Fit';
      case 'cover': return 'Fill';
      case '16:9': return '16:9';
      case '4:3': return '4:3';
    }
  };

  const getVideoStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { filter: `brightness(${brightness}%)` };
    switch (aspectMode) {
      case 'contain': return { ...base, objectFit: 'contain' };
      case 'cover': return { ...base, objectFit: 'cover' };
      case '16:9': return { ...base, objectFit: 'fill', aspectRatio: '16/9' };
      case '4:3': return { ...base, objectFit: 'fill', aspectRatio: '4/3' };
      default: return { ...base, objectFit: 'contain' };
    }
  };

  // Touch handler: single tap toggles controls, double tap seeks
  const handleTouchEnd = (e: React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.changedTouches[0].clientX - rect.left;
    const isLeft = x < rect.width / 2;

    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
      doubleTapTimeoutRef.current = null;
      seekBy(isLeft ? -10 : 10);
    } else {
      doubleTapTimeoutRef.current = setTimeout(() => {
        doubleTapTimeoutRef.current = null;
        // Single tap: toggle controls visibility only
        showControlsTemporarily();
      }, 250);
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getQualityLabel = (level: QualityLevel) => {
    if (level.height >= 1080) return '1080p HD';
    if (level.height >= 720) return '720p HD';
    if (level.height >= 480) return '480p';
    if (level.height >= 360) return '360p';
    return `${level.height}p`;
  };

  const getQualityShortLabel = (level: QualityLevel) => {
    if (level.height >= 1080) return '1080p';
    if (level.height >= 720) return '720p';
    if (level.height >= 480) return '480p';
    return `${level.height}p`;
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden group cursor-pointer select-none"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowVolumeSlider(false);
        }
      }}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className="w-full h-full bg-black"
        style={getVideoStyle()}
        poster={poster}
        playsInline
        onTouchEnd={(e) => { if (!isLocked) handleTouchEnd(e); }}
        onClick={(e) => {
          e.preventDefault();
          if (!isLocked) showControlsTemporarily();
        }}
      />

      {/* App Icon - top right */}
      <div className="absolute top-3 right-3 z-40 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-lg shadow-black/30">
        <img src={settings.appLogoUrl} alt="App" className="w-7 h-7 rounded-full object-cover" />
      </div>


      {/* Seek Indicator (double-tap feedback) */}
      {seekIndicator && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${seekIndicator.side === 'left' ? 'left-8' : 'right-8'} animate-fade-in`}>
          <div className="flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-5 py-3">
            {seekIndicator.side === 'left' ? (
              <SkipBack className="w-6 h-6 text-white" />
            ) : (
              <SkipForward className="w-6 h-6 text-white" />
            )}
            <span className="text-white text-xs font-bold">{seekIndicator.seconds}s</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Signal className="w-5 h-5 text-primary" />
            </div>
          </div>
          {isBuffering && !isLoading && (
            <p className="mt-3 text-xs text-white/60 font-medium">Buffering...</p>
          )}
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-center p-6">
          <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <p className="text-base font-semibold text-white mb-1">{error}</p>
          <p className="text-xs text-white/50 mb-4">Please check your connection</p>
          <Button onClick={initializePlayer} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <RefreshCw className="w-3.5 h-3.5" />
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Large Play Button (when paused, not loading) */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform group-hover:scale-110">
            <Play className="w-7 h-7 sm:w-9 sm:h-9 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
      )}

      {/* Top Gradient + Title */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-4 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live</span>
          </div>
          {title && (
            <span className="text-xs sm:text-sm font-medium text-white/80 truncate">{title}</span>
          )}
        </div>
      </div>

      {/* Lock Screen Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLocked(false); }}
            className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-2 text-white/80 hover:text-white transition-all opacity-0 hover:opacity-100 active:opacity-100"
            style={{ opacity: showControls ? 0.7 : 0 }}
          >
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold">Locked — Tap to unlock</span>
          </button>
        </div>
      )}

      {/* Brightness Slider Overlay */}
      {showBrightness && !isLocked && (
        <div className={`absolute top-14 left-3 z-40 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-all ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] text-white/80 font-bold">{brightness}%</span>
          </div>
          <Slider
            value={[brightness]}
            min={30}
            max={150}
            step={5}
            onValueChange={(v) => setBrightness(v[0])}
            onClick={(e) => e.stopPropagation()}
            className="w-28 cursor-pointer"
          />
        </div>
      )}

      {/* Bottom Controls */}
      {!isLocked && (
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 z-30 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {/* Progress bar area */}
        <div className="px-3 sm:px-4">
          <div className="relative group/progress h-6 flex items-end pb-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              handleSeek([percent * (duration || 100)]);
            }}
          >
            <div className="w-full h-1 group-hover/progress:h-1.5 rounded-full bg-white/20 transition-all relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
                style={{ width: `${bufferedPercent}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div
              className="absolute bottom-1.5 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls bar */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 sm:px-4 pb-3 pt-1">
          <div className="flex items-center justify-between gap-1">
            {/* Left controls */}
            <div className="flex items-center gap-0.5 sm:gap-1.5">
              {/* Play/Pause */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
                )}
              </button>

              {/* Skip Back */}
              <button
                onClick={(e) => { e.stopPropagation(); seekBy(-10); }}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={(e) => { e.stopPropagation(); seekBy(10); }}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
              </button>

              {/* Live Edge Button */}
              <button
                onClick={(e) => { e.stopPropagation(); jumpToLive(); }}
                className="px-2 py-1 rounded-md bg-live/20 hover:bg-live/40 border border-live/30 transition-colors flex items-center gap-1 ml-0.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                <span className="text-[9px] font-black text-live tracking-wider">LIVE</span>
              </button>

              {/* Volume */}
              <div className="relative flex items-center hidden sm:flex"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/15 transition-colors"
                >
                  <VolumeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20 opacity-100 ml-1' : 'w-0 opacity-0'}`}>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.05}
                    onValueChange={(v) => { handleVolumeChange(v); }}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="text-[9px] sm:text-xs text-white/60 font-mono ml-0.5 whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Lock */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsLocked(true); }}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors"
                title="Lock Screen"
              >
                <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70" />
              </button>

              {/* Brightness */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowBrightness(!showBrightness); }}
                className={`p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors ${showBrightness ? 'bg-white/15' : ''}`}
                title="Brightness"
              >
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70" />
              </button>

              {/* Aspect Ratio */}
              <button
                onClick={(e) => { e.stopPropagation(); cycleAspectMode(); }}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors relative"
                title={`Aspect: ${getAspectLabel()}`}
              >
                <RectangleHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70" />
                <span className="absolute -top-1 -right-1 text-[7px] bg-white/20 text-white rounded px-0.5 font-bold leading-tight">
                  {getAspectLabel()}
                </span>
              </button>

              {/* Stream/Channel Switcher */}
              {streams.length > 1 && onSelectStream && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors relative"
                    >
                      <Radio className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white/80" />
                      <span className="absolute -top-0.5 -right-0.5 text-[7px] bg-live text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                        {streams.length}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="bg-card/95 backdrop-blur-xl border-border min-w-[180px] max-h-[280px] overflow-y-auto">
                    <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Signal className="w-3 h-3" />
                      Channels
                    </DropdownMenuLabel>
                    {streams.map((s, index) => {
                      const isActive = selectedStream === s;
                      return (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => onSelectStream(s)}
                          className={`gap-2 text-sm cursor-pointer ${isActive ? 'bg-primary/15' : ''}`}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {s.logo ? (
                              <img src={s.logo} alt={s.name} className="w-4 h-4 object-contain rounded-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <span className="text-[10px] font-bold">{index + 1}</span>
                            )}
                          </div>
                          <span className="truncate flex-1">{s.name || `Stream ${index + 1}`}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Settings (Quality + Speed) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors relative"
                  >
                    <Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white/80" />
                    {currentQuality !== -1 && qualityLevels[currentQuality] && (
                      <span className="absolute -top-0.5 -right-0.5 text-[8px] bg-primary text-primary-foreground rounded px-0.5 font-bold">
                        {getQualityShortLabel(qualityLevels[currentQuality])}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="bg-card/95 backdrop-blur-xl border-border min-w-[160px]">
                  {qualityLevels.length > 0 && (
                    <>
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Quality</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setQuality(-1)} className="gap-2 text-sm">
                        Auto
                        {currentQuality === -1 && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                      </DropdownMenuItem>
                      {qualityLevels.map((level) => (
                        <DropdownMenuItem key={level.index} onClick={() => setQuality(level.index)} className="gap-2 text-sm">
                          {getQualityLabel(level)}
                          {currentQuality === level.index && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Speed</DropdownMenuLabel>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <DropdownMenuItem key={rate} onClick={() => changePlaybackRate(rate)} className="gap-2 text-sm">
                      {rate}x{rate === 1 && ' (Normal)'}
                      {playbackRate === rate && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Picture-in-Picture */}
              {'pictureInPictureEnabled' in document && (
                <button
                  onClick={(e) => { e.stopPropagation(); togglePiP(); }}
                  className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors hidden sm:flex"
                >
                  <PictureInPicture2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white/80" />
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="p-1 sm:p-2 rounded-lg hover:bg-white/15 transition-colors"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default HLSPlayer;
