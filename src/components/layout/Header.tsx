import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Tv, Zap, Calendar, Trophy, Settings, X, Code2, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useTheme } from '@/hooks/useTheme';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import TelegramLink from '@/components/ui/TelegramLink';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Header = ({ onSearch, searchQuery }: HeaderProps) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { settings } = useAppSettings();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { path: '/', label: t('allMatches'), icon: Trophy },
    { path: '/live', label: t('live'), icon: Zap },
    { path: '/upcoming', label: t('upcoming'), icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50">
      {/* Main glass bar */}
      <div className="glass-effect border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative w-8 h-8 rounded-lg gradient-pitch flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30 overflow-hidden flex-shrink-0">
                {settings.appLogoUrl ? (
                  <img src={settings.appLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Tv className="w-4 h-4 text-primary-foreground" />
                )}
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-display text-base font-bold text-foreground leading-tight">
                  {settings.appName || t('appName')}
                </span>
                <span className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase">
                  Live Streaming
                </span>
              </div>
              {/* Mobile: app name only */}
              <span className="sm:hidden font-display text-base font-bold text-foreground">
                {settings.appName || t('appName')}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5 bg-secondary/40 rounded-xl p-1 border border-border/40 backdrop-blur-sm">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive(path)
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {path === '/live' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-1.5">
              {/* Desktop search */}
              <div className={`relative transition-all duration-300 hidden sm:block ${searchFocused ? 'w-56' : 'w-40'}`}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
                <Input
                  type="text"
                  placeholder={t('searchTeams')}
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="pl-9 pr-3 bg-secondary/40 border-border/40 focus:border-primary/60 focus:bg-secondary/60 h-8 rounded-xl text-xs"
                />
              </div>

              {/* Accumulator button - icon only */}
              <Link to="/accumulator">
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-500/30 text-yellow-500 hover:from-yellow-500/25 hover:to-orange-500/25 transition-all">
                  <Zap className="w-4 h-4 fill-current" />
                </Button>
              </Link>

              {/* Mobile search toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground hover:text-primary rounded-xl h-8 w-8"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </Button>
              <div className="hidden sm:flex items-center gap-1">
                {settings.developerLink && (
                  <a href={settings.developerLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl h-8 gap-1.5 text-xs font-medium transition-colors">
                      <Code2 className="w-3.5 h-3.5" />
                      Developer
                    </Button>
                  </a>
                )}
                <TelegramLink />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-xl h-8 w-8 transition-all duration-300 bg-secondary/60 border border-border/50 hover:bg-primary/15 hover:border-primary/40"
                  title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-primary" />
                  ) : (
                    <Moon className="w-4 h-4 text-primary" />
                  )}
                </Button>
                <LanguageSwitcher />
              </div>

              <Link to="/admin" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl h-8 w-8 transition-colors">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>

              {/* Mobile: language + developer */}
              <div className="flex sm:hidden items-center gap-0.5">
                {settings.developerLink && (
                  <a href={settings.developerLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-xl h-8 w-8">
                      <Code2 className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-xl h-8 w-8 transition-all duration-300 bg-secondary/60 border border-border/50 hover:bg-primary/15 hover:border-primary/40"
                  title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-primary" />
                  )}
                </Button>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - slides down */}
      {mobileSearchOpen && (
        <div className="sm:hidden glass-effect border-b border-border/30 animate-fade-in">
          <div className="container mx-auto px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('searchTeams')}
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 pr-4 bg-secondary/40 border-border/40 focus:border-primary/60 h-9 rounded-xl text-sm w-full"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
