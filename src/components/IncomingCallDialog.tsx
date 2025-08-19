import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallDialogProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallDialog = ({
  isOpen,
  callerName,
  callerAvatar,
  isVideo,
  onAccept,
  onReject
}: IncomingCallDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => onReject()}>
      <DialogContent className="sm:max-w-md gradient-surface border-border/20">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={callerAvatar} alt={callerName} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-2xl">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <DialogTitle className="text-xl">
            Incoming {isVideo ? 'Video' : 'Voice'} Call
          </DialogTitle>
          <DialogDescription className="text-base">
            {callerName} is calling you
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center space-x-8 mt-6">
          {/* Reject Button */}
          <Button
            variant="destructive"
            size="lg"
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
            onClick={onReject}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          {/* Accept Button */}
          <Button
            variant="default"
            size="lg"
            className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700"
            onClick={onAccept}
          >
            {isVideo ? (
              <Video className="w-6 h-6" />
            ) : (
              <Phone className="w-6 h-6" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};