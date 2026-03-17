import { Circle } from 'lucide-react';
import { useElapsedTime } from '@/hooks/useElapsedTime';

interface ElapsedTimeProps {
  time: string;
}

const ElapsedTime = ({ time }: ElapsedTimeProps) => {
  const elapsed = useElapsedTime(time);
  if (!elapsed) return null;

  const isHT = elapsed === 'HT';

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-live/20 text-live text-xs font-bold font-mono">
      {!isHT && <Circle className="w-2 h-2 fill-current animate-pulse" />}
      {elapsed}
    </span>
  );
};

export default ElapsedTime;
