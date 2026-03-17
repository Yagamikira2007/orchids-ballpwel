import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import OverlayAdsManager from '@/components/admin/OverlayAdsManager';
import AdBannersManager from '@/components/admin/AdBannersManager';
import TelegramBotDashboard from '@/components/admin/TelegramBotDashboard';
import TelegramBotManager from '@/components/admin/TelegramBotManager';
import LiveStreamBroadcast from '@/components/admin/LiveStreamBroadcast';
import ScheduledBroadcasts from '@/components/admin/ScheduledBroadcasts';
import {
  Settings,
  Upload,
  Image,
  Type,
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Monitor,
  Film,
  Check,
  ShieldAlert,
  LogOut,
  Globe,
  Palette,
  Code2,
  TicketPercent,
  Bot,
  Radio,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Allowed file types for upload
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type AdminTab = 'app' | 'telegram' | 'streams' | 'schedule';

const AdminPanel = () => {
  const { t } = useLanguage();
  const { settings, updateSetting } = useAppSettings();
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('app');

  const [appName, setAppName] = useState(settings.appName);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [developerLink, setDeveloperLink] = useState(settings.developerLink);
  const [tickerText, setTickerText] = useState(settings.tickerText || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingStreamLogo, setIsUploadingStreamLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingColor, setIsSavingColor] = useState(false);
  const [isSavingDevLink, setIsSavingDevLink] = useState(false);
  const [isSavingTicker, setIsSavingTicker] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const streamLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Preset theme colors (HSL format)
  const presetColors = [
    { name: 'Green', value: '142 71% 45%' },
    { name: 'Blue', value: '217 91% 60%' },
    { name: 'Purple', value: '271 91% 65%' },
    { name: 'Red', value: '0 84% 60%' },
    { name: 'Orange', value: '25 95% 53%' },
    { name: 'Pink', value: '330 81% 60%' },
    { name: 'Cyan', value: '189 94% 43%' },
    { name: 'Yellow', value: '48 96% 53%' },
  ];

  useEffect(() => {
    setAppName(settings.appName);
    setPrimaryColor(settings.primaryColor);
    setDeveloperLink(settings.developerLink);
    setTickerText(settings.tickerText || '');
  }, [settings.appName, settings.primaryColor, settings.developerLink, settings.tickerText]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPG, SVG, or WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('fileTooLarge');
    }
    return null;
  };

  const handleUploadLogo = async (file: File, type: 'app_logo_url' | 'stream_dialog_logo_url' | 'favicon_url') => {
    const isAppLogo = type === 'app_logo_url';
    const isFavicon = type === 'favicon_url';
    const setUploading = isAppLogo ? setIsUploadingLogo : isFavicon ? setIsUploadingFavicon : setIsUploadingStreamLogo;
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${type.replace('_url', '')}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      const success = await updateSetting(type, publicUrl);
      
      if (success) {
        toast({
          title: t('success'),
          description: isFavicon ? t('faviconUpdated') : isAppLogo ? t('logoUpdated') : t('streamLogoUpdated'),
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('error'),
        description: t('uploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async (type: 'app_logo_url' | 'stream_dialog_logo_url' | 'favicon_url') => {
    const success = await updateSetting(type, '');
    if (success) {
      toast({
        title: t('success'),
        description: t('logoRemoved'),
      });
    }
  };

  const handleSaveColor = async () => {
    setIsSavingColor(true);
    const success = await updateSetting('primary_color', primaryColor);
    setIsSavingColor(false);
    
    if (success) {
      toast({
        title: t('success'),
        description: t('themeColorUpdated'),
      });
    }
  };

  const handleSaveAppName = async () => {
    // Validate app name
    const trimmedName = appName.trim();
    if (!trimmedName || trimmedName.length > 50) {
      toast({
        title: t('error'),
        description: 'App name must be between 1 and 50 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingName(true);
    const success = await updateSetting('app_name', trimmedName);
    setIsSavingName(false);
    
    if (success) {
      toast({
        title: t('success'),
        description: t('appNameUpdated'),
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'app_logo_url' | 'stream_dialog_logo_url' | 'favicon_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: t('error'),
          description: error,
          variant: 'destructive',
        });
        return;
      }
      handleUploadLogo(file, type);
    }
    // Reset input
    e.target.value = '';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-xl bg-destructive/10 w-fit">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Contact an administrator to request access.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('adminPanel')}</h1>
                <p className="text-sm text-muted-foreground">{t('adminPanelDesc')}</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Top-level tab navigation */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 mb-8 overflow-x-auto">
          {[
            { id: 'app' as AdminTab, label: 'App Settings', icon: <Settings className="w-4 h-4" /> },
            { id: 'telegram' as AdminTab, label: 'Bot Settings', icon: <Bot className="w-4 h-4" /> },
            { id: 'streams' as AdminTab, label: 'Live Streams', icon: <Radio className="w-4 h-4" /> },
            { id: 'schedule' as AdminTab, label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Telegram Bot Dashboard (shown when on any telegram tab) */}
        {(activeTab === 'telegram' || activeTab === 'streams' || activeTab === 'schedule') && (
          <div className="mb-6">
            <TelegramBotDashboard />
          </div>
        )}

        {activeTab === 'telegram' && <TelegramBotManager />}
        {activeTab === 'streams' && <LiveStreamBroadcast />}
        {activeTab === 'schedule' && <ScheduledBroadcasts />}

        {activeTab === 'app' && (
        <div className="space-y-6">
          {/* App Name Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Type className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('appName')}</CardTitle>
                  <CardDescription>{t('appNameDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder={t('enterAppName')}
                  className="flex-1"
                  maxLength={50}
                />
                <Button 
                  onClick={handleSaveAppName}
                  disabled={isSavingName || appName.trim() === settings.appName}
                  className="gap-2"
                >
                  {isSavingName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t('save')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Logo Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Monitor className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('appLogo')}</CardTitle>
                  <CardDescription>{t('appLogoDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                  {settings.appLogoUrl ? (
                    <img 
                      src={settings.appLogoUrl} 
                      alt="App Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'app_logo_url')}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="gap-2"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {t('uploadLogo')}
                    </Button>
                    
                    {settings.appLogoUrl && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveLogo('app_logo_url')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('logoRequirements')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stream Dialog Logo Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Film className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('streamDialogLogo')}</CardTitle>
                  <CardDescription>{t('streamDialogLogoDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                  {settings.streamDialogLogoUrl ? (
                    <img 
                      src={settings.streamDialogLogoUrl} 
                      alt="Stream Dialog Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <input
                    ref={streamLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'stream_dialog_logo_url')}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => streamLogoInputRef.current?.click()}
                      disabled={isUploadingStreamLogo}
                      className="gap-2"
                    >
                      {isUploadingStreamLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {t('uploadLogo')}
                    </Button>
                    
                    {settings.streamDialogLogoUrl && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveLogo('stream_dialog_logo_url')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('logoRequirements')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favicon Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Globe className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('favicon')}</CardTitle>
                  <CardDescription>{t('faviconDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Favicon Preview */}
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                  {settings.faviconUrl ? (
                    <img 
                      src={settings.faviconUrl} 
                      alt="Favicon" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Globe className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'favicon_url')}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={isUploadingFavicon}
                      className="gap-2"
                    >
                      {isUploadingFavicon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {t('uploadLogo')}
                    </Button>
                    
                    {settings.faviconUrl && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveLogo('favicon_url')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    PNG, ICO, or SVG. Recommended: 32x32px.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Color Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Palette className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('themeColor')}</CardTitle>
                  <CardDescription>{t('themeColorDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setPrimaryColor(color.value)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        primaryColor === color.value
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: `hsl(${color.value})` }}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <div className="flex gap-3 items-center">
                  <div 
                    className="w-12 h-12 rounded-lg border border-border"
                    style={{ backgroundColor: `hsl(${primaryColor})` }}
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="142 71% 45%"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button 
                    onClick={handleSaveColor}
                    disabled={isSavingColor || primaryColor === settings.primaryColor}
                    className="gap-2"
                  >
                    {isSavingColor ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {t('save')}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  HSL format: hue saturation% lightness% (e.g., 142 71% 45%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Developer Link Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Code2 className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Developer Link</CardTitle>
                  <CardDescription>Header ထဲက Developer ခလုတ်နှိပ်ရင် ရောက်မယ့် link ကို သတ်မှတ်ပါ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={developerLink}
                  onChange={(e) => setDeveloperLink(e.target.value)}
                  placeholder="https://t.me/yourChannel"
                  className="flex-1"
                />
                <Button 
                  onClick={async () => {
                    setIsSavingDevLink(true);
                    const success = await updateSetting('developer_link', developerLink.trim());
                    setIsSavingDevLink(false);
                    if (success) {
                      toast({ title: t('success'), description: 'Developer link updated!' });
                    }
                  }}
                  disabled={isSavingDevLink || developerLink.trim() === settings.developerLink}
                  className="gap-2"
                >
                  {isSavingDevLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t('save')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ticker Text Manager */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <TicketPercent className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Scrolling Ad Text</CardTitle>
                  <CardDescription>Video Player အောက်မှာ ရွေ့ပြီးပြမယ့် ကြော်ငြာစာသားထည့်ပါ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                placeholder="ကြော်ငြာစာသား ထည့်ပါ... (ဗလာထားရင် ပြမှာမဟုတ်ပါ)"
                rows={3}
              />
              <Button 
                onClick={async () => {
                  setIsSavingTicker(true);
                  const success = await updateSetting('ticker_text', tickerText.trim());
                  setIsSavingTicker(false);
                  if (success) {
                    toast({ title: t('success'), description: 'Ticker text updated!' });
                  }
                }}
                disabled={isSavingTicker || tickerText.trim() === (settings.tickerText || '')}
                className="gap-2"
              >
                {isSavingTicker ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('save')}
              </Button>
            </CardContent>
          </Card>

          {/* Overlay Ads Manager */}
          <OverlayAdsManager />

          {/* Ad Banners Manager */}
          <AdBannersManager />

          {/* Current Settings Preview */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('currentSettings')}</CardTitle>
                  <CardDescription>{t('currentSettingsDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <Label className="text-xs text-muted-foreground">{t('appName')}</Label>
                  <p className="font-medium mt-1">{settings.appName}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <Label className="text-xs text-muted-foreground">{t('appLogo')}</Label>
                  <p className="font-medium mt-1 truncate">
                    {settings.appLogoUrl ? t('uploaded') : t('notSet')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <Label className="text-xs text-muted-foreground">{t('favicon')}</Label>
                  <p className="font-medium mt-1 truncate">
                    {settings.faviconUrl ? t('uploaded') : t('notSet')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <Label className="text-xs text-muted-foreground">{t('themeColor')}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${settings.primaryColor})` }}
                    />
                    <p className="font-mono text-sm truncate">{settings.primaryColor}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
