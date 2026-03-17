import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, LayoutList, Save, GripVertical } from 'lucide-react';

interface BannerAd {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  frequency: number;
}

const AdBannersManager = () => {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newFrequency, setNewFrequency] = useState(3);
  const [isAdding, setIsAdding] = useState(false);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-ad-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as BannerAd[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('ad_banners').insert({
        name: newName.trim(),
        image_url: newImageUrl.trim(),
        link_url: newLinkUrl.trim() || null,
        frequency: newFrequency,
        sort_order: (banners?.length || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ad-banners'] });
      queryClient.invalidateQueries({ queryKey: ['ad-banners'] });
      setNewName('');
      setNewImageUrl('');
      setNewLinkUrl('');
      setNewFrequency(3);
      setIsAdding(false);
      toast({ title: 'Success', description: 'Banner ad added' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add banner', variant: 'destructive' }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('ad_banners').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ad-banners'] });
      queryClient.invalidateQueries({ queryKey: ['ad-banners'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ad_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ad-banners'] });
      queryClient.invalidateQueries({ queryKey: ['ad-banners'] });
      toast({ title: 'Success', description: 'Banner deleted' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }),
  });

  const handleAdd = () => {
    if (!newName.trim() || !newImageUrl.trim()) {
      toast({ title: 'Error', description: 'Name and Image URL are required', variant: 'destructive' });
      return;
    }
    addMutation.mutate();
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <LayoutList className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Ad Banners</CardTitle>
              <CardDescription>ပွဲစာရင်းကြားထဲ ပေါ်မယ့် Banner Ads များ</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'default'} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new banner form */}
        {isAdding && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Banner name" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Frequency (every N cards)</Label>
                <Input type="number" min={1} max={20} value={newFrequency} onChange={e => setNewFrequency(+e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="https://example.com/banner.jpg" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Link URL (optional)</Label>
              <Input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://example.com" className="mt-1" />
            </div>
            {newImageUrl && (
              <div className="rounded-lg overflow-hidden border border-border/50 max-h-32">
                <img src={newImageUrl} alt="Preview" className="w-full h-auto object-cover max-h-32" />
              </div>
            )}
            <Button onClick={handleAdd} disabled={addMutation.isPending} className="gap-2 w-full">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Banner
            </Button>
          </div>
        )}

        {/* Banner list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !banners?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">No banners yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {banners.map(banner => (
              <div key={banner.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="w-16 h-10 rounded overflow-hidden border border-border/50 shrink-0">
                  <img src={banner.image_url} alt={banner.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{banner.name}</p>
                  <p className="text-[10px] text-muted-foreground">Every {banner.frequency} cards</p>
                </div>
                <Switch
                  checked={banner.is_active}
                  onCheckedChange={checked => toggleMutation.mutate({ id: banner.id, is_active: checked })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(banner.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdBannersManager;
