import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Download, Trash2, User, Bell, Palette, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
}

interface UserProfile {
  id: string;
  user_name: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_preference: string;
  notification_enabled: boolean;
}

export const SettingsDialog = ({ isOpen, onClose, currentUser }: SettingsDialogProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, currentUser]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_name', currentUser)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create default profile
        const defaultProfile = {
          user_name: currentUser,
          display_name: currentUser,
          avatar_url: null,
          bio: null,
          theme_preference: 'system',
          notification_enabled: true
        };
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile settings",
        variant: "destructive"
      });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_name', currentUser);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setIsLoading(true);
    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([oldPath]);
        }
      }

      // Upload new avatar
      const fileName = `${currentUser}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update profile
      await updateProfile({ avatar_url: publicUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeAvatar = async () => {
    if (!profile?.avatar_url) return;

    setIsLoading(true);
    try {
      const path = profile.avatar_url.split('/').pop();
      if (path) {
        await supabase.storage
          .from('profile-pictures')
          .remove([path]);
      }

      await updateProfile({ avatar_url: null });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportChatData = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const exportData = {
        exported_at: new Date().toISOString(),
        total_messages: data.length,
        messages: data
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Chat data has been downloaded"
      });
    } catch (error) {
      console.error('Error exporting chat:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export chat data",
        variant: "destructive"
      });
    }
  };

  const clearChatData = async () => {
    if (!confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast({
        title: "Chat Cleared",
        description: "All chat messages have been deleted"
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear chat data",
        variant: "destructive"
      });
    }
  };

  if (!profile) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: MessageSquare }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex space-x-4">
          {/* Sidebar */}
          <div className="w-48 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                
                {/* Avatar Section */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {profile.display_name?.[0]?.toUpperCase() || profile.user_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                    {profile.avatar_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeAvatar}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.user_name}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground mt-1">Username cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.display_name || ''}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => updateProfile({
                      display_name: profile.display_name,
                      bio: profile.bio
                    })}
                    disabled={isLoading}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preferences</h3>
                
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={profile.theme_preference}
                    onValueChange={(value) => updateProfile({ theme_preference: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new messages
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={profile.notification_enabled}
                    onCheckedChange={(checked) => updateProfile({ notification_enabled: checked })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Data & Privacy</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Export Chat Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download all your chat messages as a JSON file
                    </p>
                    <Button variant="outline" onClick={exportChatData}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg border-destructive/20">
                    <h4 className="font-medium mb-2 text-destructive">Clear Chat History</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently delete all chat messages. This action cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={clearChatData}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Messages
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Privacy Information</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Messages are stored securely in our database</p>
                      <p>• Profile pictures are stored in secure cloud storage</p>
                      <p>• Your data is never shared with third parties</p>
                      <p>• You can delete your data at any time</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};