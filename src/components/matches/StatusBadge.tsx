import { MatchStatus } from '@/types';
import { Circle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatusBadgeProps {
  status: MatchStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { t } = useLanguage();

  const statusConfig = {
    live: {
      label: t('statusLive'),
      className: 'status-live',
      showDot: true,
    },
    upcoming: {
      label: t('statusUpcoming'),
      className: 'status-upcoming',
      showDot: false,
    },
    finished: {
      label: t('statusFinished'),
      className: 'status-finished',
      showDot: false,
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${config.className}`}>
      {config.showDot && (
        <Circle className="w-2 h-2 fill-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
