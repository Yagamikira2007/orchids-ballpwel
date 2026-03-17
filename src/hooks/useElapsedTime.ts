import { useState, useEffect } from 'react';

function parseMatchTime(time: string): Date | null {
  const cleaned = time.replace(/^live\s*/i, '').trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, hours, minutes, day, month, year] = match;
  return new Date(
    Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
  );
}

export const useElapsedTime = (time: string): string | null => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const matchDate = parseMatchTime(time);
  if (!matchDate) return null;

  const diffMs = now - matchDate.getTime();
  if (diffMs < 0) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  if (totalMinutes <= 45) return `${totalMinutes}'`;
  if (totalMinutes <= 60) return 'HT';
  const secondHalfMin = totalMinutes - 15;
  if (secondHalfMin <= 90) return `${secondHalfMin}'`;
  if (secondHalfMin <= 120) return `${secondHalfMin}'`;
  
  return 'FT';
};
