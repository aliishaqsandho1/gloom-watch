import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { encryptMessage, decryptMessage, getUserEncryptionKey } from '@/lib/encryption';
import { AIChatSidebar } from '@/components/AIChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessagesList } from '@/components/chat/MessagesList';
import { ChatInput } from '@/components/chat/ChatInput';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useWebRTC } from '@/hooks/useWebRTC';
import { CallInterface } from '@/components/CallInterface';
import { IncomingCallDialog } from '@/components/IncomingCallDialog';

interface Message {
  id: string;
  sender_name: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  media_name: string | null;
  created_at: string;
  status?: 'delivered' | 'received' | 'seen';
}

interface ChatProps {
  currentUser: string;
}

const Chat = ({ currentUser }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Voice recording hook
  const { isRecording, handleVoiceNote } = useVoiceRecording(currentUser);
  
  // WebRTC calling hook
  const {
    isInCall,
    isVideoEnabled,
    isAudioEnabled,
    incomingCall,
    isConnecting,
    isConnected,
    callDuration,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useWebRTC({ currentUser });

  useEffect(() => {
    const initializeEncryption = async () => {
      const key = await getUserEncryptionKey(currentUser);
      setEncryptionKey(key);
      // Only fetch messages after encryption key is ready
      await fetchMessagesWithKey(key);
      setupRealtimeSubscription();
    };
    
    initializeEncryption();
    
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessagesWithKey = async (key: string, loadMore = false) => {
    const limit = 20;
    const offset = loadMore ? messageOffset : 0;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      toast({
        title: "Connection Error",
        description: "Failed to load message history",
        variant: "destructive"
      });
    } else {
      const decryptedMessages = await Promise.all((data || []).map(async (message) => {
        let decryptedContent = message.content;
        // Only try to decrypt if content exists and looks encrypted (contains base64 characters)
        if (message.content && key && message.content.length > 20 && /^[A-Za-z0-9+/=]+$/.test(message.content)) {
          try {
            decryptedContent = await decryptMessage(message.content, key);
          } catch (decryptError) {
            console.warn('Failed to decrypt message:', message.id, decryptError);
            // Keep original content if decryption fails (likely old unencrypted message)
            decryptedContent = message.content;
          }
        }
        return {
          ...message,
          content: decryptedContent,
          status: (message.sender_name === currentUser ? 'seen' : 'received') as 'delivered' | 'received' | 'seen'
        };
      }));
      
      const reversedData = decryptedMessages.reverse();
      if (loadMore) {
        setMessages(prev => [...reversedData, ...prev]);
        setMessageOffset(prev => prev + limit);
      } else {
        setMessages(reversedData);
        setMessageOffset(limit);
      }
      setHasMoreMessages((data || []).length === limit);
    }
  };

  const fetchMessages = async (loadMore = false) => {
    if (encryptionKey) {
      return fetchMessagesWithKey(encryptionKey, loadMore);
    }
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && !isLoading && encryptionKey) {
      fetchMessagesWithKey(encryptionKey, true);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          // Decrypt the content if it exists and we have the key
          if (newMessage.content && encryptionKey && newMessage.content.length > 20 && /^[A-Za-z0-9+/=]+$/.test(newMessage.content)) {
            try {
              newMessage.content = await decryptMessage(newMessage.content, encryptionKey);
            } catch (decryptError) {
              console.warn('Failed to decrypt real-time message:', newMessage.id, decryptError);
            }
          }
          // Set status for messages
          if (newMessage.sender_name === currentUser) {
            newMessage.status = 'delivered';
          } else {
            newMessage.status = 'received';
          }
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !encryptionKey) return;

    setIsLoading(true);
    try {
      // Encrypt the message before sending
      const encryptedContent = await encryptMessage(newMessage, encryptionKey);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_name: currentUser,
          content: encryptedContent,
          message_type: 'text'
        });

      if (error) {
        toast({
          title: "Send Failed",
          description: "Message could not be delivered",
          variant: "destructive"
        });
      } else {
        // Keep focus and clear message in one go
        inputRef.current?.focus();
        setNewMessage('');
      }
    } catch (encryptError) {
      toast({
        title: "Encryption Failed",
        description: "Could not encrypt message",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    // Upload file to Supabase storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Upload Failed",
        description: "Could not upload media file",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(fileName);

    // Save message with media
    const messageType = file.type.startsWith('image/') ? 'image' : 'file';
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_name: currentUser,
        content: null,
        message_type: messageType,
        media_url: publicUrl,
        media_name: file.name
      });

    if (error) {
      toast({
        title: "Send Failed",
        description: "Could not send media",
        variant: "destructive"
      });
    }

    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };


  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader 
        currentUser={currentUser}
        isOnline={isOnline}
        onOpenAIChat={() => setIsAIChatOpen(true)}
      />

      <MessagesList
        messages={messages}
        currentUser={currentUser}
        hasMoreMessages={hasMoreMessages}
        isLoading={isLoading}
        loadMoreMessages={loadMoreMessages}
        formatTime={formatTime}
        formatDate={formatDate}
        messagesEndRef={messagesEndRef}
      />

      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        isLoading={isLoading}
        isRecording={isRecording}
        handleVoiceNote={handleVoiceNote}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        fileInputRef={fileInputRef}
        inputRef={inputRef}
        handleFileUpload={handleFileUpload}
        onStartVoiceCall={() => startCall(false)}
        onStartVideoCall={() => startCall(true)}
      />

      <AIChatSidebar isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      
      {/* Call Interface */}
      {isInCall && (
        <CallInterface
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isConnected={isConnected}
          callDuration={callDuration}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onEndCall={endCall}
        />
      )}
      
      {/* Incoming Call Dialog */}
      {incomingCall && (
        <IncomingCallDialog
          isOpen={true}
          callerName={incomingCall.from}
          isVideo={incomingCall.isVideo}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
    </div>
  );
};

export default Chat;