import { useAppSettings } from '@/contexts/AppSettingsContext';

const PlayerTicker = () => {
  const { settings } = useAppSettings();

  if (!settings.tickerText) return null;

  return (
    <div className="w-full bg-black/80 backdrop-blur-sm overflow-hidden border-t border-white/5">
      <div className="animate-marquee whitespace-nowrap py-1.5 text-xs sm:text-sm font-medium text-yellow-400">
        <span className="inline-block px-8">{settings.tickerText}</span>
        <span className="inline-block px-8">{settings.tickerText}</span>
        <span className="inline-block px-8">{settings.tickerText}</span>
      </div>
    </div>
  );
};

export default PlayerTicker;
