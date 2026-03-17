import { Clock } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  timestamp?: number;
}

const CountdownTimer = ({ timestamp }: CountdownTimerProps) => {
  const { formatted, isExpired, days, hours, minutes, seconds } = useCountdown(timestamp);

  if (isExpired || !formatted) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Clock className="w-3.5 h-3.5 text-upcoming" />
      <div className="flex items-center gap-1 font-mono text-sm">
        {days > 0 && (
          <>
            <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-bold">{days}d</span>
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-bold">
          {hours.toString().padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-bold">
          {minutes.toString().padStart(2, '0')}
        </span>
        <span className="text-muted-foreground">:</span>
        <span className="bg-secondary px-1.5 py-0.5 rounded text-xs font-bold">
          {seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;
