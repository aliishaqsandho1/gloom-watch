import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Shield, Dot, Bot, Menu, MessageSquare, Share, Trash2, Settings } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SettingsDialog } from '@/components/SettingsDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatHeaderProps {
  currentUser: string;
  isOnline: boolean;
  onOpenAIChat: () => void;
}

export const ChatHeader = ({ currentUser, isOnline, onOpenAIChat }: ChatHeaderProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);

  // Determine chat partner
  const chatPartner = currentUser === 'Ali' ? 'User 1' : 'User 2';

  useEffect(() => {
    const fetchCurrentUserAvatar = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('user_name', currentUser)
          .maybeSingle();
        
        if (profile?.avatar_url) {
          setCurrentUserAvatar(profile.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching current user avatar:', error);
      }
    };

    fetchCurrentUserAvatar();
  }, [currentUser]);
  return (
    <div className="gradient-surface border-b border-border/20 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div 
            className="relative cursor-pointer group"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Avatar className="w-10 h-10 transition-all duration-300 group-hover:ring-2 group-hover:ring-primary/50">
              <AvatarImage src={currentUserAvatar || undefined} alt={currentUser} />
              <AvatarFallback className="gradient-primary text-primary-foreground">
                {currentUser.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div>
            <h1 className="font-semibold text-lg text-foreground">
              Chatting with {chatPartner}
            </h1>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Dot className="w-4 h-4 text-green-500" />
              <span>Secure Connection</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Chat with AI button - visible on larger screens */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center space-x-2 border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
            onClick={onOpenAIChat}
          >
            <Bot className="w-4 h-4" />
            <span className="hidden lg:inline">Chat with AI</span>
          </Button>
          
          {/* Hamburger Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted/50 transition-all duration-300"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-surface/95 backdrop-blur-xl border-border/50" align="end">
              <div className="space-y-1">
                {/* Chat with AI for mobile */}
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 hover:bg-muted/50 md:hidden"
                  onClick={onOpenAIChat}
                >
                  <Bot className="w-4 h-4" />
                  <span>Chat with AI</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 hover:bg-muted/50"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 hover:bg-muted/50"
                  onClick={async () => {
                    try {
                      const { data: messages, error } = await supabase
                        .from('messages')
                        .select('*')
                        .order('created_at', { ascending: true });

                      if (error) throw error;

                      const chatData = {
                        exportDate: new Date().toISOString(),
                        totalMessages: messages.length,
                        messages: messages
                      };

                      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);

                      toast({
                        title: "Chat Exported",
                        description: "Your chat history has been downloaded"
                      });
                    } catch (error) {
                      toast({
                        title: "Export Failed",
                        description: "Could not export chat history",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Export Chat</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 hover:bg-muted/50"
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Check out this chat app!',
                          text: 'I found this amazing chat application',
                          url: window.location.origin
                        });
                      } catch (error) {
                        // User cancelled sharing
                      }
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                      toast({
                        title: "Link Copied",
                        description: "App link copied to clipboard"
                      });
                    }
                  }}
                >
                  <Share className="w-4 h-4" />
                  <span>Share App</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 hover:bg-muted/50 text-destructive hover:text-destructive"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
                      return;
                    }

                    try {
                      const { error } = await supabase
                        .from('messages')
                        .delete()
                        .neq('id', '00000000-0000-0000-0000-000000000000');

                      if (error) throw error;

                      toast({
                        title: "Chat Cleared",
                        description: "All chat history has been deleted"
                      });
                      
                      window.location.reload();
                    } catch (error) {
                      toast({
                        title: "Clear Failed",
                        description: "Could not clear chat history",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Chat</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentUser={currentUser} 
      />
    </div>
  );
};