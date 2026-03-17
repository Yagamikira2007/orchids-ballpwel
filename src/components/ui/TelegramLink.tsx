import { Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const TelegramLink = () => {
  const { t } = useLanguage();

  return (
    <a
      href="https://t.me/itachiXCoder"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/30 transition-colors text-sm font-medium border border-[#0088cc]/30"
    >
      <Send className="w-3.5 h-3.5" />
      <span>{t('developer')}</span>
    </a>
  );
};

export default TelegramLink;
