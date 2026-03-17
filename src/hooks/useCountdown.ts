import { useState, useEffect } from 'react';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export const useCountdown = (targetTimestamp?: number): CountdownResult => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetTimestamp) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  if (!targetTimestamp) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '' };
  }

  const targetMs = targetTimestamp * 1000;
  const diff = targetMs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { days, hours, minutes, seconds, isExpired: false, formatted };
};
