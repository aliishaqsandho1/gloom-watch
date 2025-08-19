import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallInterfaceProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isConnected: boolean;
  callDuration: number;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onEndCall: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const CallInterface = ({
  isVideoEnabled,
  isAudioEnabled,
  isConnected,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  onToggleVideo,
  onToggleAudio,
  onEndCall,
  isFullscreen = false,
  onToggleFullscreen
}: CallInterfaceProps) => {
  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className={cn(
      "fixed inset-0 bg-black z-50 flex flex-col",
      !isFullscreen && "rounded-lg shadow-2xl"
    )}>
      {/* Remote Video */}
      <div className="flex-1 relative bg-gray-900">
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
        
        {/* Local Video Picture-in-Picture */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Call Status and Timer */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="text-center">
            <div className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>
            {isConnected && (
              <div className="text-lg font-mono">
                {formatDuration(callDuration)}
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-white hover:bg-white/20"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>

      {/* Call Controls */}
      <div className="bg-black/50 backdrop-blur-sm p-6 flex justify-center items-center space-x-4">
        {/* Audio Toggle */}
        <Button
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="lg"
          className="w-14 h-14 rounded-full"
          onClick={onToggleAudio}
        >
          {isAudioEnabled ? (
            <Mic className="w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </Button>

        {/* Video Toggle */}
        <Button
          variant={isVideoEnabled ? "secondary" : "destructive"}
          size="lg"
          className="w-14 h-14 rounded-full"
          onClick={onToggleVideo}
        >
          {isVideoEnabled ? (
            <Video className="w-6 h-6" />
          ) : (
            <VideoOff className="w-6 h-6" />
          )}
        </Button>

        {/* End Call */}
        <Button
          variant="destructive"
          size="lg"
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
          onClick={onEndCall}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};