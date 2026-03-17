import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  Plus,
  Trash2,
  Loader2,
  Upload,
  Image,
  Link,
  Clock,
  MapPin,
} from 'lucide-react';

interface OverlayAd {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  display_duration: number;
}

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-center', label: 'Bottom Center' },
];

const OverlayAdsManager = () => {
  const { t } = useLanguage();
  const [ads, setAds] = useState<OverlayAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // New ad form state
  const [newAdName, setNewAdName] = useState('');
  const [newAdLinkUrl, setNewAdLinkUrl] = useState('');
  const [newAdPosition, setNewAdPosition] = useState('bottom-right');
  const [newAdDuration, setNewAdDuration] = useState(10);
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setIsLoading(true);
    // Need to fetch all ads for admin, not just active ones
    // Use RPC or bypass - for now let's query directly
    const { data, error } = await supabase
      .from('overlay_ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ads:', error);
    } else {
      setAds(data || []);
    }
    setIsLoading(false);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPG, GIF, or WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 2MB.';
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({ title: t('error'), description: error, variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `overlay_ad_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      setNewAdImageUrl(publicUrl);
      toast({ title: t('success'), description: 'Image uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: t('error'), description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateAd = async () => {
    if (!newAdName.trim() || !newAdImageUrl) {
      toast({ title: t('error'), description: 'Name and image are required', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('overlay_ads').insert({
        name: newAdName.trim(),
        image_url: newAdImageUrl,
        link_url: newAdLinkUrl.trim() || null,
        position: newAdPosition,
        display_duration: newAdDuration,
        is_active: true,
      });

      if (error) throw error;

      toast({ title: t('success'), description: 'Ad created successfully' });
      
      // Reset form
      setNewAdName('');
      setNewAdLinkUrl('');
      setNewAdPosition('bottom-right');
      setNewAdDuration(10);
      setNewAdImageUrl('');
      
      fetchAds();
    } catch (error) {
      console.error('Create error:', error);
      toast({ title: t('error'), description: 'Failed to create ad', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('overlay_ads')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast({ title: t('error'), description: 'Failed to update ad', variant: 'destructive' });
    } else {
      setAds(ads.map(ad => ad.id === id ? { ...ad, is_active: isActive } : ad));
    }
  };

  const handleDeleteAd = async (id: string) => {
    const { error } = await supabase.from('overlay_ads').delete().eq('id', id);

    if (error) {
      toast({ title: t('error'), description: 'Failed to delete ad', variant: 'destructive' });
    } else {
      setAds(ads.filter(ad => ad.id !== id));
      toast({ title: t('success'), description: 'Ad deleted successfully' });
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Megaphone className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('overlayAds')}</CardTitle>
            <CardDescription>{t('overlayAdsDesc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Ad Form */}
        <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('createNewAd')}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('adName')}</Label>
              <Input
                value={newAdName}
                onChange={(e) => setNewAdName(e.target.value)}
                placeholder="e.g., Sponsor Banner"
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">{t('adLinkUrl')}</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newAdLinkUrl}
                  onChange={(e) => setNewAdLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{t('adPosition')}</Label>
              <Select value={newAdPosition} onValueChange={setNewAdPosition}>
                <SelectTrigger>
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{t('displayDuration')}</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={newAdDuration}
                  onChange={(e) => setNewAdDuration(parseInt(e.target.value) || 5)}
                  min={5}
                  max={60}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('durationHint')}</p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm">{t('adImage')}</Label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                {newAdImageUrl ? (
                  <img src={newAdImageUrl} alt="Ad preview" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {t('uploadImage')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('adImageRequirements')}</p>
          </div>

          <Button
            onClick={handleCreateAd}
            disabled={isCreating || !newAdName.trim() || !newAdImageUrl}
            className="w-full gap-2"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('createAd')}
          </Button>
        </div>

        {/* Existing Ads List */}
        <div className="space-y-3">
          <h4 className="font-medium">{t('existingAds')}</h4>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : ads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('noAdsYet')}</p>
          ) : (
            <div className="space-y-2">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50"
                >
                  <div className="w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    <img src={ad.image_url} alt={ad.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ad.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {POSITION_OPTIONS.find(p => p.value === ad.position)?.label} • {ad.display_duration}s
                    </p>
                  </div>
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={(checked) => handleToggleActive(ad.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAd(ad.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverlayAdsManager;
