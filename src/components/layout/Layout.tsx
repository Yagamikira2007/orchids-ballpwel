import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from './Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Zap, Calendar, Trophy, CheckCircle } from 'lucide-react';

interface LayoutProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Layout = ({ onSearch, searchQuery }: LayoutProps) => {
  const { t } = useLanguage();
  const location = useLocation();

  const bottomNavItems = [
    { path: '/', label: t('allMatches'), icon: Trophy },
    { path: '/live', label: t('live'), icon: Zap },
    { path: '/upcoming', label: t('upcoming'), icon: Calendar },
    { path: '/results', label: 'Results', icon: CheckCircle },
    { path: '/basketball', label: 'NBA', icon: null },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Stadium photo background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/stadium-bg.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark overlay — deep green tinted, keeps text readable */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(5,20,8,0.82) 0%, rgba(3,14,5,0.90) 40%, rgba(2,10,3,0.96) 100%)' }}
      />
      {/* Subtle grass stripe overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, rgba(30,100,30,0.06) 0px, rgba(30,100,30,0.06) 60px, rgba(10,60,10,0.03) 60px, rgba(10,60,10,0.03) 120px)',
      }} />
      <Header onSearch={onSearch} searchQuery={searchQuery} />
      <main className="container mx-auto px-4 py-4 md:py-8 flex-1 relative z-10 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Footer - desktop only */}
      <footer className="hidden md:block border-t border-border/50 py-6 mt-auto bg-card/30 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t('footerRights')}</p>
            <a
              href="https://t.me/itachiXCoder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all text-xs font-medium border border-[#0088cc]/20"
            >
              <Send className="w-3.5 h-3.5" />
              @itachiXCoder
            </a>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation - mobile only */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around py-1.5 px-4 relative">
          {bottomNavItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            const isLive = path === '/live';
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all duration-300 min-w-[60px] ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground active:scale-95'
                }`}
              >
                {active && (
                  <div className="absolute inset-0 bg-primary/12 rounded-2xl border border-primary/20" />
                )}

                <div className="relative z-10">
                  {Icon ? (
                    <Icon className={`w-5 h-5 transition-all duration-200 ${active ? 'text-primary scale-110' : ''}`} />
                  ) : (
                    <span className="text-lg leading-5">{label.split(' ')[0]}</span>
                  )}
                  {isLive && (
                    <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-live animate-pulse shadow-sm shadow-live/50" />
                  )}
                </div>

                <span className={`relative z-10 text-[10px] font-bold tracking-wide transition-all duration-200 ${
                  active ? 'text-primary' : ''
                }`}>
                  {Icon ? label : label.split(' ').slice(1).join(' ') || label}
                </span>

                {active && (
                  <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
