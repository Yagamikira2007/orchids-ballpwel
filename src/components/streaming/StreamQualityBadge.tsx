import { Wifi, WifiOff, Signal } from 'lucide-react';

interface StreamQualityBadgeProps {
  quality?: 'HD' | 'SD' | 'LOW' | string;
  showIcon?: boolean;
}

const StreamQualityBadge = ({ quality = 'SD', showIcon = true }: StreamQualityBadgeProps) => {
  const getQualityConfig = () => {
    const q = quality?.toUpperCase() || 'SD';
    switch (q) {
      case 'HD':
      case '1080P':
      case '720P':
        return {
          label: 'HD',
          className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: Wifi,
        };
      case 'SD':
      case '480P':
      case '360P':
        return {
          label: 'SD',
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: Signal,
        };
      case 'LOW':
      case '240P':
        return {
          label: 'LOW',
          className: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: WifiOff,
        };
      default:
        return {
          label: quality || 'SD',
          className: 'bg-muted text-muted-foreground border-border',
          icon: Signal,
        };
    }
  };

  const config = getQualityConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
};

export default StreamQualityBadge;
