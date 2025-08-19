import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  sender_name: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  media_name: string | null;
  created_at: string;
}

interface MessagesListProps {
  messages: Message[];
  currentUser: string;
  hasMoreMessages: boolean;
  isLoading: boolean;
  loadMoreMessages: () => void;
  formatTime: (timestamp: string) => string;
  formatDate: (timestamp: string) => string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const MessagesList = ({
  messages,
  currentUser,
  hasMoreMessages,
  isLoading,
  loadMoreMessages,
  formatTime,
  formatDate,
  messagesEndRef
}: MessagesListProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {/* Load More Messages Button */}
      {hasMoreMessages && (
        <div className="flex justify-center pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMoreMessages}
            disabled={isLoading}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
          >
            Load More Messages
          </Button>
        </div>
      )}
      
      {messages.map((message, index) => {
        const isOwn = message.sender_name === currentUser;
        const showDate = index === 0 || 
          formatDate(messages[index - 1]?.created_at) !== formatDate(message.created_at);
        
        return (
          <div key={message.id} className="space-y-4">
            {showDate && (
              <div className="flex justify-center">
                <div className="bg-muted/50 text-muted-foreground text-xs px-1 py-1 rounded-full">
                  {formatDate(message.created_at)}
                </div>
              </div>
            )}
            
            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <MessageBubble 
                message={message}
                isOwn={isOwn}
                formatTime={formatTime}
              />
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};