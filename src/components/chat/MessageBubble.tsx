import { Card } from '@/components/ui/card';
import { Mic, Paperclip, Download } from 'lucide-react';

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

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  formatTime: (timestamp: string) => string;
}

export const MessageBubble = ({ message, isOwn, formatTime }: MessageBubbleProps) => {
  const getStatusIndicator = () => {
    // Show status indicators for all messages now, with different logic
    if (!message.status) return null;
    
    const statusConfig = {
      delivered: 'bg-slate-800', // black circle
      received: 'bg-slate-400', // gray circle  
      seen: 'bg-green-500' // green circle
    };
    
    return (
      <div 
        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[message.status]} ml-1`}
        title={message.status}
      />
    );
  };
  return (
    <Card
      className={`max-w-xs lg:max-w-md px-3 py-2 shadow-message transition-all duration-300 hover:shadow-lg ${
        isOwn
          ? "gradient-primary text-primary-foreground ml-12 rounded-br-sm"
          : "bg-muted/50 border-border/50 mr-12 rounded-bl-sm"
      }`}
    >
      <div className="flex items-end gap-2">
        {/* Message Text */}
        {message.message_type === "text" && (
          <div className="text-sm leading-snug">{message.content}</div>
        )}

        {/* Message Time for text messages */}
        {message.message_type === "text" && (
          <div className="flex items-center gap-1">
            <div className="text-[10px] text-muted-foreground opacity-70">
              {formatTime(message.created_at)}
            </div>
            {getStatusIndicator()}
          </div>
        )}
      </div>

      {/* Images */}
      {message.message_type === "image" && (
        <div className="mt-1">
          <img
            src={message.media_url!}
            alt={message.media_name!}
            className="rounded-lg max-w-full h-auto shadow-sm"
          />
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-[10px] text-muted-foreground opacity-70">
              {formatTime(message.created_at)}
            </div>
            {getStatusIndicator()}
          </div>
        </div>
      )}

      {/* Audio Messages */}
{message.message_type === "audio" && (
  <div className="mt-1">
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-background/10">
      {/* Play Icon */}
      <button className="p-1 rounded-full hover:bg-background/20">
        <Mic className="w-4 h-4 text-primary" />
      </button>

      {/* Slim audio bar */}
      <audio 
        controls 
        className="h-6 flex-1"
        src={message.media_url!}
      />

      {/* Timestamp */}
      <div className="text-[10px] text-muted-foreground opacity-70 whitespace-nowrap">
        {formatTime(message.created_at)}
      </div>

      {/* Status */}
      {getStatusIndicator()}
    </div>
  </div>
)}


      {/* Files */}
      {message.message_type === "file" && (
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-background/10">
          <Paperclip className="w-4 h-4" />
          <span className="text-sm flex-1 truncate">{message.media_name}</span>
          <a
            href={message.media_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-background/20 rounded"
          >
            <Download className="w-4 h-4" />
          </a>
          <div className="flex items-center gap-1">
            <div className="text-[10px] text-muted-foreground opacity-70">
              {formatTime(message.created_at)}
            </div>
            {getStatusIndicator()}
          </div>
        </div>
      )}
    </Card>
  );
};