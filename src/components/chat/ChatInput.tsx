import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VirtualKeyboard } from '@/components/ui/virtual-keyboard';
import { Send, Plus, Mic, Maximize, Minimize, Image, Video, Phone, VideoIcon, Smile } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => void;
  isLoading: boolean;
  isRecording: boolean;
  handleVoiceNote: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
}

export const ChatInput = ({
  newMessage,
  setNewMessage,
  sendMessage,
  isLoading,
  isRecording,
  handleVoiceNote,
  isFullScreen,
  toggleFullScreen,
  fileInputRef,
  inputRef,
  handleFileUpload,
  onStartVoiceCall,
  onStartVideoCall
}: ChatInputProps) => {
  const deviceType = useDeviceType();
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isMobileOrTablet = deviceType === 'mobile' || deviceType === 'tablet';

  // Common emojis for the picker
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
    '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✨', '🎉', '🎊', '🔥', '💯', '⭐', '🌟', '💫', '⚡', '☀️',
    '🌙', '⭐', '🌈', '☁️', '⛅', '🌤️', '🌦️', '🌧️', '⛈️', '❄️'
  ];

  // Virtual keyboard handlers
  const handleVirtualKeyPress = useCallback((key: string) => {
    setNewMessage(newMessage + key);
  }, [newMessage, setNewMessage]);

  const handleVirtualBackspace = useCallback(() => {
    setNewMessage(newMessage.slice(0, -1));
  }, [newMessage, setNewMessage]);

  const handleVirtualSpace = useCallback(() => {
    setNewMessage(newMessage + ' ');
  }, [newMessage, setNewMessage]);

  const handleVirtualEnter = useCallback(() => {
    if (newMessage.trim()) {
      sendMessage();
      setShowVirtualKeyboard(false);
    }
  }, [newMessage, sendMessage]);

  // Handle input focus on mobile/tablet - automatically show keyboard
  const handleInputFocus = useCallback(() => {
    if (isMobileOrTablet) {
      setShowVirtualKeyboard(true);
      // Prevent native keyboard
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, [isMobileOrTablet]);

  // Handle input click - same as focus for mobile/tablet
  const handleInputClick = useCallback(() => {
    if (isMobileOrTablet) {
      setShowVirtualKeyboard(true);
      // Prevent native keyboard
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, [isMobileOrTablet]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    setNewMessage(newMessage + emoji);
    setShowEmojiPicker(false);
  }, [newMessage, setNewMessage]);

  return (
    <>
      {/* Spacer to push chat content up when keyboard is visible */}
      {showVirtualKeyboard && isMobileOrTablet && (
        <div className="h-[300px]" />
      )}
      
      <div className={cn(
        "gradient-surface border-t border-border/20 p-4 backdrop-blur-xl transition-all duration-200",
        showVirtualKeyboard && isMobileOrTablet ? "fixed bottom-[220px] left-0 right-0 z-40" : ""
      )}>
        <div className="flex items-center space-x-3">
        {/* Plus Menu Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 bg-surface/95 backdrop-blur-xl border-border/50" align="start">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 hover:bg-muted/50"
                onClick={toggleFullScreen}
              >
                {isFullScreen ? (
                  <>
                    <Minimize className="w-4 h-4" />
                    <span>Exit Full Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4" />
                    <span>Full Screen</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 hover:bg-muted/50"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/*";
                    fileInputRef.current.click();
                  }
                }}
              >
                <Image className="w-4 h-4" />
                <span>Image</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 hover:bg-muted/50"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "video/*";
                    fileInputRef.current.click();
                  }
                }}
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 hover:bg-muted/50"
                onClick={onStartVoiceCall}
              >
                <Phone className="w-4 h-4" />
                <span>Voice Call</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 hover:bg-muted/50"
                onClick={onStartVideoCall}
              >
                <VideoIcon className="w-4 h-4" />
                <span>Video Call</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onFocus={handleInputFocus}
            onClick={handleInputClick}
            autoComplete="off"
            autoFocus={!isMobileOrTablet}
            readOnly={isMobileOrTablet}
            className="h-12 bg-background/50 border-border/50 focus:border-primary/50 pr-24 pl-12 transition-all duration-300"
          />
          
          {/* Emoji Button */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1 h-10 w-10 hover:bg-muted/50 transition-all duration-300"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-3 bg-surface/95 backdrop-blur-xl border-border/50" 
              align="start"
              side="top"
            >
              <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                {commonEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted/50 text-base"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Mic Button */}
          <Button 
            variant="ghost"
            size="icon"
            className={`absolute right-12 top-1 h-10 w-10 transition-all duration-300 ${
              isRecording 
                ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
                : 'hover:bg-muted/50'
            }`}
            onClick={handleVoiceNote}
            disabled={isLoading}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
          </Button>
          
          {/* Send Button */}
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !newMessage.trim()}
            size="icon"
            className="absolute right-1 top-1 h-10 w-10 gradient-primary shadow-glow border-0 transition-all duration-300 hover:shadow-glow disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileUpload}
        accept="image/*,*"
      />

      {/* Virtual Keyboard for Mobile/Tablet */}
      {isMobileOrTablet && (
        <VirtualKeyboard
          isVisible={showVirtualKeyboard}
          onKeyPress={handleVirtualKeyPress}
          onBackspace={handleVirtualBackspace}
          onSpace={handleVirtualSpace}
          onEnter={handleVirtualEnter}
        />
      )}
    </>
  );
};